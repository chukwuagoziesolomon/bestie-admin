import React from 'react';
import { Bike, Store, CheckCircle, X, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { useWebSocket } from '../contexts/WebSocketContext';
import './RecentActivities.css';

interface ActivityData {
  id: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  amount?: number;
  timestamp: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  vendor?: {
    id: number;
    name: string;
  };
}

const RecentActivities: React.FC = () => {
  const { activities, connectionStatus, testConnection } = useWebSocket();
  
  const handleRetryConnection = () => {
    // Force a page reload to retry WebSocket connection
    window.location.reload();
  };

  const handleTestConnection = () => {
    testConnection();
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'truck':
        return <Bike size={16} />;
      case 'store':
        return <Store size={16} />;
      case 'check-circle':
        return <CheckCircle size={16} />;
      case 'x-circle':
        return <X size={16} />;
      default:
        return <CheckCircle size={16} />;
    }
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi size={14} className="connection-icon connected" />;
      case 'disconnected':
        return <WifiOff size={14} className="connection-icon disconnected" />;
      case 'error':
        return <AlertCircle size={14} className="connection-icon error" />;
      case 'connecting':
        return <div className="connection-icon connecting">⟳</div>;
      default:
        return <WifiOff size={14} className="connection-icon disconnected" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} mins ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return date.toLocaleDateString();
  };

  // Only show real-time WebSocket activities, no fallback data
  const displayActivities = activities;

  return (
    <div className="recent-activities">
      <div className="recent-activities-header">
        <h3 className="recent-activities-title">Recent Activities</h3>
        <div className="recent-activities-controls">
          <div className="connection-status">
            {getConnectionIcon()}
            <span className="connection-text">{connectionStatus}</span>
          </div>
          <div className="recent-activities-dropdown">
            <select className="time-dropdown">
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="recent-activities-list">
        {displayActivities.length > 0 ? (
          displayActivities.map((activity, index) => (
            <div key={activity.id || index} className="activity-item">
              <div className="activity-icon" style={{ color: activity.color || '#6b7280' }}>
                {getIcon(activity.icon)}
              </div>
              <div className="activity-content">
                <p className="activity-message">
                  {activity.description}
                </p>
                <span className="activity-time">
                  {formatTime(activity.timestamp)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="no-activities">
            <div className="no-activities-icon">
              {connectionStatus === 'error' ? (
                <AlertCircle size={24} />
              ) : (
                <CheckCircle size={24} />
              )}
            </div>
            <p className="no-activities-message">
              {connectionStatus === 'connected' 
                ? 'No recent activities' 
                : connectionStatus === 'error'
                ? 'Connection failed'
                : 'Waiting for connection...'}
            </p>
            {connectionStatus === 'disconnected' && (
              <p className="no-activities-submessage">
                Connect to see real-time activities
              </p>
            )}
            {connectionStatus === 'error' && (
              <div className="no-activities-actions">
                <p className="no-activities-submessage">
                  WebSocket server may not be running
                </p>
                <div className="button-group">
                  <button 
                    className="retry-button"
                    onClick={handleRetryConnection}
                  >
                    Retry Connection
                  </button>
                  <button 
                    className="test-button"
                    onClick={handleTestConnection}
                  >
                    Test Connection
                  </button>
                </div>
                <p className="debug-info">
                  Check browser console for detailed connection logs
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivities;