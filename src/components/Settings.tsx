import React, { useState, useEffect } from 'react';
import { Edit, Check, X, Settings as SettingsIcon, DollarSign, Package, Plus } from 'lucide-react';
import { getSettings, updateSetting, createSetting, Setting, UpdateSettingRequest } from '../services/settings';
import './Settings.css';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [editingSetting, setEditingSetting] = useState<Setting | null>(null);
  const [editForm, setEditForm] = useState<UpdateSettingRequest>({ value: '', description: '' });

  useEffect(() => {
    fetchSettings();
  }, [category]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSettings(category);
      setSettings(response.settings);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (setting: Setting) => {
    setEditingSetting(setting);
    setEditForm({ value: setting.value, description: setting.description });
  };

  const handleSave = async () => {
    if (!editingSetting) return;
    try {
      await updateSetting(editingSetting.key, editForm);
      setSettings(prev => prev.map(s => s.key === editingSetting.key ? { ...s, ...editForm } : s));
      setEditingSetting(null);
    } catch (err) {
      console.error('Error updating setting:', err);
      setError('Failed to update setting');
    }
  };

  const handleCancel = () => {
    setEditingSetting(null);
    setEditForm({ value: '', description: '' });
  };

  const handleCreateInitialSettings = async () => {
    const initialSettings = [
      { key: 'delivery_base_fee', value: '1500.00', description: 'Base delivery fee in Naira', data_type: 'decimal' },
      { key: 'delivery_rate_per_km', value: '300.00', description: 'Additional fee per kilometer', data_type: 'decimal' },
      { key: 'delivery_max_distance_for_base', value: '5', description: 'Max distance for base fee only (km)', data_type: 'integer' },
      { key: 'platform_commission_rate', value: '0.10', description: 'Platform commission rate as decimal (0.10 = 10%)', data_type: 'decimal' },
      { key: 'default_vendor_fixed_amount', value: '0.00', description: 'Fixed vendor payout', data_type: 'decimal' },
      { key: 'default_courier_fixed_amount', value: '500.00', description: 'Fixed courier payout', data_type: 'decimal' },
    ];

    try {
      for (const setting of initialSettings) {
        await createSetting(setting);
      }
      fetchSettings(); // Refresh the list
    } catch (err) {
      console.error('Error creating initial settings:', err);
      setError('Failed to create initial settings');
    }
  };

  const getCategoryIcon = (key: string) => {
    if (key.includes('delivery') || key.includes('fee') || key.includes('km')) return <Package size={20} />;
    if (key.includes('commission') || key.includes('amount')) return <DollarSign size={20} />;
    return <SettingsIcon size={20} />;
  };

  const getCategoryColor = (key: string) => {
    if (key.includes('delivery') || key.includes('fee') || key.includes('km')) return 'blue';
    if (key.includes('commission') || key.includes('amount')) return 'green';
    return 'gray';
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="settings-header">
          <h1 className="settings-title">System Settings</h1>
        </div>
        <div className="loading">Loading settings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="settings-page">
        <div className="settings-header">
          <h1 className="settings-title">System Settings</h1>
        </div>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1 className="settings-title">System Settings</h1>
        <div className="category-filter">
          <button
            className={`filter-button ${!category ? 'active' : ''}`}
            onClick={() => setCategory(undefined)}
          >
            All
          </button>
          <button
            className={`filter-button ${category === 'pricing' ? 'active' : ''}`}
            onClick={() => setCategory('pricing')}
          >
            Pricing
          </button>
          <button
            className={`filter-button ${category === 'commission' ? 'active' : ''}`}
            onClick={() => setCategory('commission')}
          >
            Commission
          </button>
        </div>
      </div>

      <div className="settings-grid">
        {settings.length === 0 ? (
          <div className="no-settings">
            <p>{error || 'No settings found. Please check your API connection or create initial settings.'}</p>
            {!error && (
              <button className="create-button" onClick={handleCreateInitialSettings}>
                <Plus size={16} /> Create Initial Settings
              </button>
            )}
          </div>
        ) : (
          settings.map((setting) => (
            <div key={setting.key} className="setting-card">
              <div className="setting-header">
                <div>
                  <div className="setting-key">{setting.key}</div>
                  <div className="setting-description">{setting.description}</div>
                </div>
                <div className={`setting-icon ${getCategoryColor(setting.key)}`}>
                  {getCategoryIcon(setting.key)}
                </div>
              </div>
              <div className="setting-value">{setting.value}</div>
              <div className="setting-meta">
                <span className="setting-type">{setting.data_type}</span>
                <span className={`setting-status ${setting.is_active ? 'active' : 'inactive'}`}>
                  {setting.is_active ? <Check size={12} /> : <X size={12} />}
                  {setting.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <button className="edit-button" onClick={() => handleEdit(setting)}>
                <Edit size={16} /> Edit
              </button>
            </div>
          ))
        )}
      </div>

      {editingSetting && (
        <div className="edit-modal">
          <div className="edit-modal-content">
            <div className="edit-modal-header">
              <h2 className="edit-modal-title">Edit Setting: {editingSetting.key}</h2>
              <button className="close-button" onClick={handleCancel}>
                <X size={24} />
              </button>
            </div>
            <div className="edit-form">
              <div className="form-group">
                <label className="form-label">Value</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.value}
                  onChange={(e) => setEditForm({ ...editForm, value: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>
              <div className="button-group">
                <button className="cancel-button" onClick={handleCancel}>
                  Cancel
                </button>
                <button className="save-button" onClick={handleSave}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;