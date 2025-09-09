import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import './VerificationDetails.css';

import { VerificationRequest } from '../services/verification';
import axios from 'axios';
import { getAuthToken } from '../services/auth';
import { useParams, useLocation } from 'react-router-dom';

interface VerificationDetailsProps {
  request: VerificationRequest;
  onBack: () => void;
  onApprove: () => void;
  onDecline: () => void;
}

type SummaryItem = {
  id?: number;
  role: 'vendor' | 'courier';
  full_name: string;
  phone_number: string | null;
  package_type: string | null;
  date: string; // ISO
  address: string | null;
  profile_photo: string | null;
  id_image: string | null;
  cac_document: string | null;
  nin_number: string | null;
  verification_status?: 'pending' | 'approved' | 'rejected';
};

const VerificationDetails: React.FC<VerificationDetailsProps> = ({
  onBack,
  onApprove,
  onDecline
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [vendors, setVendors] = useState<SummaryItem[]>([]);
  const [couriers, setCouriers] = useState<SummaryItem[]>([]);
  const { id } = useParams();
  const { state } = useLocation();
  const [userType, setUserType] = useState<'vendor' | 'courier' | null>(null);
  useEffect(() => {
    if (state && state.role) {
      setUserType(state.role);
    }
  }, [state]);

  const API_BASE = useMemo(() => {
    const raw = process.env.REACT_APP_API_URL || 'https://bestie-server.onrender.com';
    const base = raw.replace(/\/$/, '');
    return base.endsWith('/api') ? base : `${base}/api`;
  }, []);

  useEffect(() => {
    const fetchDetailsById = async () => {
      try {
        setLoading(true);
        setError(null);
        if (!id || !userType) return;
        let userData = null;
        try {
          const res = await axios.get(
            `${API_BASE}/user/admin/verification/${userType}/${id}/`,
            {
              headers: {
                Authorization: `Bearer ${getAuthToken() || ''}`,
                'Content-Type': 'application/json',
              },
              withCredentials: true,
            }
          );
          userData = res.data;
        } catch {}
        if (userType === 'vendor' && userData) {
          setVendors([
            {
              role: 'vendor',
              full_name: userData.full_name,
              phone_number: userData.phone_number || null,
              package_type: userData.package_type || null,
              date: userData.date,
              address: userData.address || null,
              profile_photo: userData.profile_photo || null,
              id_image: userData.id_image || null,
              cac_document: userData.cac_document || null,
              nin_number: userData.nin_number || null,
              verification_status: userData.verification_status || 'pending',
            },
          ]);
          setCouriers([]);
        } else if (userType === 'courier' && userData) {
          setCouriers([
            {
              role: 'courier',
              full_name: userData.full_name,
              phone_number: userData.phone_number || null,
              package_type: userData.package_type || null,
              date: userData.date,
              address: userData.address || null,
              profile_photo: userData.profile_photo || null,
              id_image: userData.id_image || null,
              cac_document: userData.cac_document || null,
              nin_number: userData.nin_number || null,
              verification_status: userData.verification_status || 'pending',
            },
          ]);
          setVendors([]);
        } else {
          setVendors([]);
          setCouriers([]);
        }
      } catch (e: any) {
        console.error('Failed to load verification details:', e);
        setError('Failed to load detailed info. Showing available data.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetailsById();
  }, [API_BASE, id, userType]);

  // Combine vendors and couriers for display
  const combined = [...vendors, ...couriers];

  return (
    <div className="verification-details">
      <div className="verification-details-header">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={20} />
          Back to Verification Requests
        </button>
      </div>
      <div className="verification-content">
        {combined.length === 0 && !loading && (
          <div>No pending verifications found.</div>
        )}
        {combined.map((user, idx) => (
          <div key={idx} className="details-card">
            <img
              src={user.profile_photo || '/api/placeholder/120/120'}
              alt="Profile"
              className="profile-photo"
              style={{ width: 80, height: 80, borderRadius: '50%' }}
            />
            <div><strong>Role:</strong> {user.role}</div>
            <div><strong>Full Name:</strong> {user.full_name}</div>
            <div><strong>Phone Number:</strong> {user.phone_number}</div>
            <div><strong>Package Type:</strong> {user.package_type !== undefined && user.package_type !== null ? user.package_type : 'N/A'}</div>
            <div><strong>Date:</strong> {user.date ? new Date(user.date).toLocaleString() : 'N/A'}</div>
            <div><strong>Address:</strong> {user.address !== undefined && user.address !== null ? user.address : 'N/A'}</div>
            <div>
              <strong>ID Image:</strong>
              {user.id_image ? (
                <a href={user.id_image} target="_blank" rel="noopener noreferrer">View</a>
              ) : 'N/A'}
            </div>
            <div>
              <strong>CAC Document:</strong>
              {user.cac_document ? (
                <a href={user.cac_document} target="_blank" rel="noopener noreferrer">View</a>
              ) : 'N/A'}
            </div>
            <div>
              <strong>NIN Number:</strong> {user.nin_number !== undefined && user.nin_number !== null ? user.nin_number : 'N/A'}
            </div>
            <div className="actions">
              <button className="approve-btn" onClick={() => onApprove && onApprove()}>Approve</button>
              <button className="decline-btn" onClick={() => onDecline && onDecline()}>Decline</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VerificationDetails;
