# Admin Activity System

This document describes how to use the admin activity system that integrates with your backend endpoints.

## Backend Endpoints

Your backend provides the following endpoints for the admin dashboard (localhost:3001):

### REST API Endpoints
- **GET** `/api/admin/recent-activity/?limit=20` - Fetch recent activities
- **POST** `/api/webhook/activity/` - Send activity via webhook
- **POST** `/api/admin/activities/{id}/read/` - Mark activity as read
- **POST** `/api/admin/activities/read-all/` - Mark all activities as read

### WebSocket Endpoint
- **WebSocket** `ws://127.0.0.1:8000/ws/admin/activity/?token=YOUR_JWT` - Real-time activity stream

## Frontend Integration

The frontend has been updated to use these endpoints:

### Components
- `ActivityFeed.tsx` - Displays activities with real-time updates
- `ActivityTestPanel.tsx` - Test panel for sending sample activities
- `useActivityFeed.ts` - Hook for managing activity state
- `useAdminActivityWebSocket.ts` - WebSocket hook for real-time updates

### API Service
- `adminActivity.ts` - Service for making API calls to backend endpoints

## Usage

### 1. Activity Feed Component
The `ActivityFeed` component automatically:
- Loads initial activities from REST API
- Connects to WebSocket for real-time updates
- Shows connection status (Live/Offline)
- Allows marking activities as read
- Displays activities with icons, colors, and amounts

### 2. Test Panel
The `ActivityTestPanel` component provides:
- Sample activity buttons for testing
- Webhook endpoint testing
- Success/error feedback

### 3. Webhook Format
Activities sent via webhook should follow this format:

```json
{
  "title": "Order Completed",
  "description": "Order #1234 has been delivered successfully",
  "icon": "📦",
  "color": "#10B981",
  "amount": 2500,
  "target_type": "order",
  "target_id": "1234",
  "metadata": {
    "customer": "John Doe",
    "items": 3
  }
}
```

### 4. WebSocket Messages
The WebSocket expects messages in this format:

```json
{
  "type": "activity_update",
  "payload": {
    "id": "activity_123",
    "title": "Order Completed",
    "description": "Order #1234 has been delivered successfully",
    "icon": "📦",
    "color": "#10B981",
    "amount": 2500,
    "timestamp": "2023-08-15T10:30:00Z",
    "target_type": "order",
    "target_id": "1234",
    "metadata": {
      "customer": "John Doe",
      "items": 3
    }
  }
}
```

## Configuration

### Environment Variables
Make sure these environment variables are set:

```env
REACT_APP_API_URL=http://localhost:3001  # For REST API calls
```

The WebSocket service uses the base API URL to construct the WebSocket URL.

### Authentication
The system uses JWT tokens stored in localStorage. Make sure the user is authenticated before accessing the activity features.

## Features

### Real-time Updates
- WebSocket connection with automatic reconnection
- Live connection status indicator
- Real-time activity updates without page refresh

### Activity Management
- Load initial activities from REST API
- Pagination support (load more functionality)
- Mark individual activities as read
- Mark all activities as read
- Prevent duplicate activities

### Visual Design
- Color-coded activities with custom colors
- Icons for different activity types
- Amount display with proper formatting
- Metadata display for additional context
- Responsive design for mobile devices

## Testing

1. Start your backend server on localhost:3001
2. Start the frontend application
3. Navigate to the dashboard
4. Use the Activity Test Panel to send sample activities
5. Watch activities appear in real-time in the Activity Feed

## Troubleshooting

### WebSocket Connection Issues
- Check that the backend WebSocket server is running on port 8000
- Verify JWT token is valid
- Check browser console for connection errors

### API Connection Issues
- Verify backend is running on localhost:3001
- Check JWT token is present in localStorage
- Verify CORS settings on backend

### Activity Not Appearing
- Check webhook endpoint is accessible
- Verify activity format matches expected schema
- Check WebSocket connection status in the UI
