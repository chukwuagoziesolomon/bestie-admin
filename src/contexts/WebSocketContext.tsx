import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getAuthToken } from '../utils/api';

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

interface WebSocketMessage {
  type: string;
  data: ActivityData | any;
}

interface WebSocketContextType {
  activities: ActivityData[];
  connectionStatus: 'connected' | 'disconnected' | 'error' | 'connecting';
  addActivity: (activity: ActivityData) => void;
  clearActivities: () => void;
  testConnection: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error' | 'connecting'>('disconnected');
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [showFallbackData, setShowFallbackData] = useState(false);

  const maxReconnectAttempts = 5;
  const reconnectDelay = 1000;

  const addActivity = useCallback((activity: ActivityData) => {
    console.log('Adding activity:', activity);
    setActivities(prev => {
      const newActivities = [activity, ...prev];
      // Keep only last 50 activities
      return newActivities.slice(0, 50);
    });
  }, []);


  const clearActivities = useCallback(() => {
    setActivities([]);
  }, []);

  const generateFallbackActivities = useCallback(() => {
    const fallbackActivities: ActivityData[] = [
      {
        id: 1,
        title: 'New Order #1001',
        description: 'User John Doe ordered from Tasty Bites',
        icon: 'shopping-cart',
        color: '#10B981',
        amount: 25.50,
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
        user: {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com'
        },
        vendor: {
          id: 2,
          name: 'Tasty Bites'
        }
      },
      {
        id: 2,
        title: 'Vendor Approved',
        description: 'Vendor "Pizza Palace" has been approved',
        icon: 'check-circle',
        color: '#10B981',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
        vendor: {
          id: 3,
          name: 'Pizza Palace'
        }
      },
      {
        id: 3,
        title: 'New Courier Registered',
        description: 'Courier "Mike Johnson" has registered',
        icon: 'truck',
        color: '#3B82F6',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        user: {
          id: 4,
          name: 'Mike Johnson',
          email: 'mike@example.com'
        }
      },
      {
        id: 4,
        title: 'Order Completed',
        description: 'Order #999 has been completed successfully',
        icon: 'check-circle',
        color: '#10B981',
        amount: 45.00,
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
        user: {
          id: 5,
          name: 'Sarah Wilson',
          email: 'sarah@example.com'
        }
      },
      {
        id: 5,
        title: 'Vendor Rejected',
        description: 'Vendor "Burger King" has been rejected',
        icon: 'x-circle',
        color: '#EF4444',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
        vendor: {
          id: 6,
          name: 'Burger King'
        }
      }
    ];
    
    console.log('=== Adding Fallback Activities ===');
    setActivities(fallbackActivities);
    setShowFallbackData(true);
  }, []);

  const testConnection = useCallback(() => {
    console.log('=== WebSocket Connection Test ===');
    const token = getAuthToken() || localStorage.getItem('access_token');
    console.log('Token available:', !!token);
    console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'None');
    
    const baseUrl = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
    const wsBaseUrl = baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    console.log('Base URL:', baseUrl);
    console.log('WebSocket Base URL:', wsBaseUrl);
    
    const testUrls = [
      `${wsBaseUrl}/ws/admin/activity/?token=${token}`,
      `${wsBaseUrl}/admin/activity/?token=${token}`
    ];
    
    console.log('Test URLs:', testUrls);
    
    // Test both URLs
    testUrls.forEach((url, index) => {
      console.log(`Testing URL ${index + 1}:`, url);
      const testSocket = new WebSocket(url);
      
      testSocket.onopen = () => {
        console.log(`✅ URL ${index + 1} connected successfully!`);
        testSocket.close();
      };
      
      testSocket.onerror = (error) => {
        console.log(`❌ URL ${index + 1} failed:`, error);
      };
      
      testSocket.onclose = (event) => {
        console.log(`URL ${index + 1} closed with code:`, event.code);
      };
    });
  }, []);

  const connect = useCallback(() => {
    // Try both token keys as per the guide
    const token = getAuthToken() || localStorage.getItem('access_token');
    if (!token) {
      console.log('No auth token available for WebSocket connection');
      setConnectionStatus('error');
      return;
    }

    console.log('Attempting to connect to WebSocket with token:', token.substring(0, 20) + '...');
    setConnectionStatus('connecting');
    
    // Try different WebSocket URLs as per the guide
    const baseUrl = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
    const wsBaseUrl = baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    
    console.log('=== WebSocket URL Construction ===');
    console.log('Environment REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
    console.log('Base URL:', baseUrl);
    console.log('WebSocket Base URL:', wsBaseUrl);
    
    // Try both URL patterns as mentioned in the guide
    const wsUrls = [
      `${wsBaseUrl}/ws/admin/activity/?token=${token}`,  // Prefixed route
      `${wsBaseUrl}/admin/activity/?token=${token}`       // Non-prefixed route (compatibility)
    ];
    
    console.log('Trying WebSocket URLs:', wsUrls);
    
    // Try the first URL (prefixed route)
    const wsUrl = wsUrls[0];
    console.log('Using WebSocket URL:', wsUrl);
    
    try {
      const newSocket = new WebSocket(wsUrl);

    newSocket.onopen = (event) => {
      console.log('Connected to admin activity feed');
      setConnectionStatus('connected');
      setReconnectAttempts(0);
      setIsReconnecting(false);
    };

    newSocket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        handleMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    newSocket.onclose = (event) => {
      console.log('Disconnected from admin activity feed');
      setConnectionStatus('disconnected');
      setSocket(null);
      
      // Attempt to reconnect if not manually closed
      if (event.code !== 1000 && !isReconnecting) {
        attemptReconnect();
      }
    };

    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      console.log('Trying fallback URL...');
      
      // Try the fallback URL (non-prefixed route)
      try {
        const fallbackUrl = wsUrls[1];
        console.log('Attempting fallback WebSocket URL:', fallbackUrl);
        const fallbackSocket = new WebSocket(fallbackUrl);
        
        fallbackSocket.onopen = (event) => {
          console.log('Connected to admin activity feed via fallback URL');
          setConnectionStatus('connected');
          setReconnectAttempts(0);
          setIsReconnecting(false);
          setSocket(fallbackSocket);
        };
        
        fallbackSocket.onmessage = newSocket.onmessage;
        fallbackSocket.onclose = newSocket.onclose;
        fallbackSocket.onerror = (fallbackError) => {
          console.error('Fallback WebSocket also failed:', fallbackError);
          setConnectionStatus('error');
          // Show fallback data when both WebSocket attempts fail
          console.log('Both WebSocket connections failed, showing fallback data');
          generateFallbackActivities();
        };
        
      } catch (fallbackError) {
        console.error('Failed to create fallback WebSocket connection:', fallbackError);
        setConnectionStatus('error');
        // Show fallback data when WebSocket creation fails
        console.log('WebSocket creation failed, showing fallback data');
        generateFallbackActivities();
      }
    };

    setSocket(newSocket);
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus('error');
    }
  }, [isReconnecting]);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'connection.established':
        console.log('WebSocket connection established');
        break;
        
      case 'activity_update':
        if (message.data) {
          addActivity(message.data);
        }
        break;
        
      case 'vendor.registered':
        const vendorRegActivity: ActivityData = {
          id: Date.now(),
          title: 'New Vendor Registered',
          description: `Vendor "${message.data?.business_name || 'Unknown'}" has registered`,
          icon: 'store',
          color: '#3B82F6',
          timestamp: new Date().toISOString()
        };
        addActivity(vendorRegActivity);
        break;
        
      case 'vendor.approved':
        const vendorApprovedActivity: ActivityData = {
          id: Date.now(),
          title: 'Vendor Approved',
          description: `Vendor "${message.data?.business_name || 'Unknown'}" has been approved`,
          icon: 'check-circle',
          color: '#10B981',
          timestamp: new Date().toISOString()
        };
        addActivity(vendorApprovedActivity);
        break;
        
      case 'vendor.rejected':
        const vendorRejectedActivity: ActivityData = {
          id: Date.now(),
          title: 'Vendor Rejected',
          description: `Vendor "${message.data?.business_name || 'Unknown'}" has been rejected`,
          icon: 'x-circle',
          color: '#EF4444',
          timestamp: new Date().toISOString()
        };
        addActivity(vendorRejectedActivity);
        break;
        
      case 'courier.registered':
        const courierRegActivity: ActivityData = {
          id: Date.now(),
          title: 'New Courier Registered',
          description: `Courier "${message.data?.name || 'Unknown'}" has registered`,
          icon: 'truck',
          color: '#3B82F6',
          timestamp: new Date().toISOString()
        };
        addActivity(courierRegActivity);
        break;
        
      case 'courier.approved':
        const courierApprovedActivity: ActivityData = {
          id: Date.now(),
          title: 'Courier Approved',
          description: `Courier "${message.data?.name || 'Unknown'}" has been approved`,
          icon: 'check-circle',
          color: '#10B981',
          timestamp: new Date().toISOString()
        };
        addActivity(courierApprovedActivity);
        break;
        
      case 'courier.rejected':
        const courierRejectedActivity: ActivityData = {
          id: Date.now(),
          title: 'Courier Rejected',
          description: `Courier "${message.data?.name || 'Unknown'}" has been rejected`,
          icon: 'x-circle',
          color: '#EF4444',
          timestamp: new Date().toISOString()
        };
        addActivity(courierRejectedActivity);
        break;
        
      default:
        console.log('Unknown message type:', message.type);
    }
  }, [addActivity]);

  const attemptReconnect = useCallback(() => {
    if (isReconnecting || reconnectAttempts >= maxReconnectAttempts) {
      return;
    }

    setIsReconnecting(true);
    setReconnectAttempts(prev => prev + 1);

    const delay = reconnectDelay * Math.pow(2, reconnectAttempts);
    
    setTimeout(() => {
      console.log(`Reconnection attempt ${reconnectAttempts + 1}/${maxReconnectAttempts}`);
      connect();
    }, delay);
  }, [isReconnecting, reconnectAttempts, connect]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.close(1000, 'Manual disconnect');
      setSocket(null);
      setConnectionStatus('disconnected');
    }
  }, [socket]);

  // Connect on mount
  useEffect(() => {
    console.log('=== WebSocket Context Mounted ===');
    console.log('Attempting to connect...');
    connect();
    
    // Set a timeout to show fallback data if connection takes too long
    const fallbackTimeout = setTimeout(() => {
      if (connectionStatus === 'connecting' || connectionStatus === 'disconnected') {
        console.log('WebSocket connection timeout, showing fallback data');
        generateFallbackActivities();
      }
    }, 5000); // 5 second timeout
    
    // Cleanup on unmount
    return () => {
      console.log('=== WebSocket Context Unmounting ===');
      clearTimeout(fallbackTimeout);
      disconnect();
    };
  }, []);

  // Reconnect when token changes
  useEffect(() => {
    const token = getAuthToken();
    if (token && connectionStatus === 'disconnected') {
      connect();
    }
  }, [connectionStatus, connect]);

  const value: WebSocketContextType = {
    activities,
    connectionStatus,
    addActivity,
    clearActivities,
    testConnection
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};