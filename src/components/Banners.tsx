import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff, 
  Calendar,
  Link as LinkIcon,
  Upload,
  X,
  Save,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon
} from 'lucide-react';
import { apiFetch } from '../utils/api';
import './Banners.css';

interface Banner {
  id: number;
  title: string;
  description: string;
  image_url: string;
  banner_type: 'homepage' | 'promotional' | 'seasonal' | 'vendor_spotlight';
  status: 'active' | 'inactive' | 'scheduled' | 'expired';
  priority: number;
  click_url: string;
  is_active: boolean;
  display_start_date?: string;
  display_end_date?: string;
  created_at: string;
  updated_at: string;
}

interface BannerFormData {
  title: string;
  description: string;
  banner_type: string;
  status: string;
  priority: number;
  click_url: string;
  is_active: boolean;
  display_start_date: string;
  display_end_date: string;
  banner_image?: File | null;
}

const Banners: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState<BannerFormData>({
    title: '',
    description: '',
    banner_type: 'homepage',
    status: 'active',
    priority: 0,
    click_url: '',
    is_active: true,
    display_start_date: '',
    display_end_date: '',
    banner_image: null,
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch('/user/banners/');
      
      if (response.success) {
        setBanners(response.banners || []);
      } else {
        setBanners([]);
      }
    } catch (err: any) {
      console.error('Error fetching banners:', err);
      setError(err.message || 'Failed to load banners');
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image size should be less than 5MB');
        return;
      }

      setFormData(prev => ({ ...prev, banner_image: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('banner_type', formData.banner_type);
      formDataToSend.append('status', formData.status);
      formDataToSend.append('priority', formData.priority.toString());
      formDataToSend.append('click_url', formData.click_url);
      formDataToSend.append('is_active', formData.is_active.toString());
      
      if (formData.display_start_date) {
        formDataToSend.append('display_start_date', formData.display_start_date);
      }
      if (formData.display_end_date) {
        formDataToSend.append('display_end_date', formData.display_end_date);
      }
      if (formData.banner_image) {
        formDataToSend.append('banner_image', formData.banner_image);
      }

      const url = editingBanner 
        ? `/user/banners/${editingBanner.id}/`
        : '/user/banners/';
      
      const method = editingBanner ? 'PUT' : 'POST';

      const response = await fetch(url.startsWith('http') ? url : `${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api${url}`, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access-token')}`,
        },
        body: formDataToSend,
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(data.message || `Banner ${editingBanner ? 'updated' : 'created'} successfully`);
        handleCloseModal();
        fetchBanners();
      } else {
        throw new Error(data.message || 'Failed to save banner');
      }
    } catch (err: any) {
      console.error('Error saving banner:', err);
      setError(err.message || 'Failed to save banner');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      description: banner.description,
      banner_type: banner.banner_type,
      status: banner.status,
      priority: banner.priority,
      click_url: banner.click_url,
      is_active: banner.is_active,
      display_start_date: banner.display_start_date ? new Date(banner.display_start_date).toISOString().slice(0, 16) : '',
      display_end_date: banner.display_end_date ? new Date(banner.display_end_date).toISOString().slice(0, 16) : '',
      banner_image: null,
    });
    setImagePreview(banner.image_url);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) {
      return;
    }

    try {
      const response = await apiFetch(`/user/banners/${id}/`, {
        method: 'DELETE',
      });

      if (response.success) {
        alert('Banner deleted successfully');
        fetchBanners();
      }
    } catch (err: any) {
      console.error('Error deleting banner:', err);
      alert(err.message || 'Failed to delete banner');
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('is_active', (!banner.is_active).toString());

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api/user/banners/${banner.id}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access-token')}`,
        },
        body: formDataToSend,
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        fetchBanners();
      }
    } catch (err: any) {
      console.error('Error toggling banner status:', err);
      alert('Failed to update banner status');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBanner(null);
    setImagePreview(null);
    setFormData({
      title: '',
      description: '',
      banner_type: 'homepage',
      status: 'active',
      priority: 0,
      click_url: '',
      is_active: true,
      display_start_date: '',
      display_end_date: '',
      banner_image: null,
    });
    setError(null);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'inactive':
        return 'status-inactive';
      case 'scheduled':
        return 'status-scheduled';
      case 'expired':
        return 'status-expired';
      default:
        return '';
    }
  };

  const getBannerTypeLabel = (type: string) => {
    switch (type) {
      case 'homepage':
        return 'Homepage';
      case 'promotional':
        return 'Promotional';
      case 'seasonal':
        return 'Seasonal';
      case 'vendor_spotlight':
        return 'Vendor Spotlight';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="banners-page">
        <div className="banners-header">
          <h1>Banner Management</h1>
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading banners...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="banners-page">
      <div className="banners-header">
        <div>
          <h1>Banner Management</h1>
          <p className="subtitle">Manage homepage and promotional banners</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={20} />
          Create New Banner
        </button>
      </div>

      {error && !showModal && (
        <div className="error-banner">
          <p>{error}</p>
        </div>
      )}

      <div className="banners-grid">
        {banners.length === 0 ? (
          <div className="empty-state">
            <ImageIcon size={64} className="empty-icon" />
            <h3>No Banners Yet</h3>
            <p>Create your first banner to get started</p>
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={20} />
              Create Banner
            </button>
          </div>
        ) : (
          banners.map((banner) => (
            <div key={banner.id} className="banner-card">
              <div className="banner-image-container">
                <img src={banner.image_url} alt={banner.title} className="banner-image" />
                <div className="banner-overlay-actions">
                  <button
                    className="btn-icon"
                    onClick={() => handleToggleActive(banner)}
                    title={banner.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {banner.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                  <button
                    className="btn-icon"
                    onClick={() => handleEdit(banner)}
                    title="Edit"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    className="btn-icon btn-danger"
                    onClick={() => handleDelete(banner.id)}
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="banner-card-content">
                <div className="banner-card-header">
                  <h3>{banner.title}</h3>
                  <span className={`status-badge ${getStatusBadgeClass(banner.status)}`}>
                    {banner.status}
                  </span>
                </div>

                {banner.description && (
                  <p className="banner-description">{banner.description}</p>
                )}

                <div className="banner-meta">
                  <div className="meta-item">
                    <span className="meta-label">Type:</span>
                    <span className="meta-value">{getBannerTypeLabel(banner.banner_type)}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Priority:</span>
                    <span className="meta-value">{banner.priority}</span>
                  </div>
                </div>

                {banner.click_url && (
                  <div className="banner-link">
                    <LinkIcon size={14} />
                    <a href={banner.click_url} target="_blank" rel="noopener noreferrer">
                      {banner.click_url}
                    </a>
                  </div>
                )}

                {(banner.display_start_date || banner.display_end_date) && (
                  <div className="banner-schedule">
                    <Calendar size={14} />
                    <span>
                      {banner.display_start_date && new Date(banner.display_start_date).toLocaleDateString()}
                      {banner.display_start_date && banner.display_end_date && ' - '}
                      {banner.display_end_date && new Date(banner.display_end_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingBanner ? 'Edit Banner' : 'Create New Banner'}</h2>
              <button className="btn-icon" onClick={handleCloseModal}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="banner-form">
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <div className="form-group">
                <label>Banner Image *</label>
                <div className="image-upload-area">
                  {imagePreview ? (
                    <div className="image-preview">
                      <img src={imagePreview} alt="Preview" />
                      <button
                        type="button"
                        className="btn-remove-image"
                        onClick={() => {
                          setImagePreview(null);
                          setFormData(prev => ({ ...prev, banner_image: null }));
                        }}
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ) : (
                    <label className="upload-placeholder">
                      <Upload size={48} />
                      <span>Click to upload banner image</span>
                      <small>Recommended: 1180x192 pixels (Max 5MB)</small>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter banner title"
                  />
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <input
                    type="number"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Enter banner description"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Banner Type</label>
                  <select
                    name="banner_type"
                    value={formData.banner_type}
                    onChange={handleInputChange}
                  >
                    <option value="homepage">Homepage</option>
                    <option value="promotional">Promotional</option>
                    <option value="seasonal">Seasonal</option>
                    <option value="vendor_spotlight">Vendor Spotlight</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Click URL</label>
                <input
                  type="url"
                  name="click_url"
                  value={formData.click_url}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Display Start Date</label>
                  <input
                    type="datetime-local"
                    name="display_start_date"
                    value={formData.display_start_date}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Display End Date</label>
                  <input
                    type="datetime-local"
                    name="display_end_date"
                    value={formData.display_end_date}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                  />
                  <span>Active</span>
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCloseModal}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={uploading || !formData.title || (!formData.banner_image && !editingBanner)}
                >
                  {uploading ? (
                    <>
                      <div className="spinner-small"></div>
                      {editingBanner ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      {editingBanner ? 'Update Banner' : 'Create Banner'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Banners;
