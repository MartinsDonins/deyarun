// WebSocket Route Handler for Real-time Workout Communication
// Handles WebSocket connections, authentication, and message routing

import WebSocket, { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { realtimeWorkoutService } from '../services/realtimeWorkoutService.js';

// WebSocket message handlers
const messageHandlers = {
  // Subscribe to workout updates
  subscribe_workout: (ws, payload) => {
    const { workoutId } = payload;
    if (workoutId && ws.userId) {
      realtimeWorkoutService.subscribeToWorkout(ws, workoutId, ws.userId);
      
      // Send confirmation
      ws.send(JSON.stringify({
        type: 'subscription_confirmed',
        payload: { workoutId },
        timestamp: Date.now()
      }));
    }
  },

  // Unsubscribe from workout updates
  unsubscribe_workout: (ws, payload) => {
    const { workoutId } = payload;
    if (workoutId) {
      realtimeWorkoutService.unsubscribeFromWorkout(ws, workoutId);
      
      // Send confirmation
      ws.send(JSON.stringify({
        type: 'unsubscription_confirmed',
        payload: { workoutId },
        timestamp: Date.now()
      }));
    }
  },

  // Real-time workout data
  workout_data: async (ws, payload) => {
    if (ws.userId) {
      const data = {
        ...payload,
        userId: ws.userId
      };
      
      const result = await realtimeWorkoutService.processRealtimeWorkoutData(data);
      
      // Send acknowledgment
      ws.send(JSON.stringify({
        type: 'workout_data_ack',
        payload: { success: result.success, workoutId: payload.workoutId },
        timestamp: Date.now()
      }));
    }
  },

  // GPS update
  gps_update: async (ws, payload) => {
    if (ws.userId) {
      const { workoutId, location } = payload;
      
      // Process GPS update through the workout service
      const data = {
        workoutId,
        userId: ws.userId,
        location,
        metrics: {}, // GPS updates might not have full metrics
        status: 'active'
      };
      
      await realtimeWorkoutService.processRealtimeWorkoutData(data);
    }
  },

  // Heart rate update
  heart_rate_update: async (ws, payload) => {
    if (ws.userId) {
      const { workoutId, heartRate, source } = payload;
      
      console.log(`💓 Heart rate update: ${heartRate} bpm from ${source} for workout ${workoutId}`);
      
      // Broadcast heart rate to other clients
      realtimeWorkoutService.broadcastToWorkout(workoutId, 'heart_rate_update', {
        heartRate,
        source,
        userId: ws.userId,
        timestamp: Date.now()
      });
    }
  },

  // Request coaching tip
  request_coaching_tip: async (ws, payload) => {
    const { workoutId, context } = payload;
    
    if (ws.userId && workoutId) {
      console.log(`💡 Coaching tip requested for workout ${workoutId}`);
      
      // Generate coaching tip based on context
      const tip = await realtimeWorkoutService.generateCoachingTip({
        workoutId,
        userId: ws.userId,
        metrics: context
      });
      
      if (tip) {
        ws.send(JSON.stringify({
          type: 'coaching_tip',
          payload: tip,
          timestamp: Date.now()
        }));
      }
    }
  },

  // Report issue
  report_issue: (ws, payload) => {
    const { workoutId, issue } = payload;
    
    console.log(`⚠️ Issue reported for workout ${workoutId}:`, issue);
    
    // Log issue (in production, you might want to store this in database)
    const issueLog = {
      workoutId,
      userId: ws.userId,
      issue,
      timestamp: new Date(),
      userAgent: ws.userAgent,
      ipAddress: ws.ipAddress
    };
    
    console.log('Issue logged:', issueLog);
    
    // Send acknowledgment
    ws.send(JSON.stringify({
      type: 'issue_reported',
      payload: { workoutId, issueId: `issue_${Date.now()}` },
      timestamp: Date.now()
    }));
  },

  // Share workout status
  share_workout_status: (ws, payload) => {
    const { workoutId, recipients, message } = payload;
    
    console.log(`📤 Workout status shared for ${workoutId} to ${recipients.length} recipients`);
    
    // In a real app, you would send notifications to the recipients
    // For now, just log it
    const share = {
      workoutId,
      fromUserId: ws.userId,
      recipients,
      message,
      timestamp: new Date()
    };
    
    console.log('Workout status shared:', share);
    
    // Send confirmation
    ws.send(JSON.stringify({
      type: 'workout_shared',
      payload: { workoutId, recipientCount: recipients.length },
      timestamp: Date.now()
    }));
  },

  // Ping/pong for keepalive
  ping: (ws, payload) => {
    ws.send(JSON.stringify({
      type: 'pong',
      payload: { timestamp: payload.timestamp },
      timestamp: Date.now()
    }));
  },

  // Admin monitoring subscription
  subscribe_admin_monitoring: (ws, payload) => {
    if (ws.userId && ws.isAdmin) {
      ws.monitoringSubscription = true;
      console.log(`📊 Admin ${ws.userId} subscribed to monitoring updates`);
      
      // Send confirmation
      ws.send(JSON.stringify({
        type: 'monitoring_subscription_confirmed',
        payload: { subscribed: true },
        timestamp: Date.now()
      }));
      
      // Start sending periodic updates
      if (!ws.monitoringInterval) {
        ws.monitoringInterval = setInterval(() => {
          sendMonitoringUpdate(ws);
        }, 5000); // Send updates every 5 seconds
      }
    } else {
      ws.send(JSON.stringify({
        type: 'error',
        payload: { message: 'Admin access required for monitoring subscription' },
        timestamp: Date.now()
      }));
    }
  },

  // Unsubscribe from admin monitoring
  unsubscribe_admin_monitoring: (ws, payload) => {
    if (ws.monitoringSubscription) {
      ws.monitoringSubscription = false;
      
      if (ws.monitoringInterval) {
        clearInterval(ws.monitoringInterval);
        ws.monitoringInterval = null;
      }
      
      console.log(`📊 Admin ${ws.userId} unsubscribed from monitoring updates`);
      
      ws.send(JSON.stringify({
        type: 'monitoring_unsubscription_confirmed',
        payload: { subscribed: false },
        timestamp: Date.now()
      }));
    }
  }
};

// Initialize WebSocket server
export function initializeWebSocketServer(server) {
  console.log('🔌 Initializing WebSocket server...');
  
  const wss = new WebSocketServer({ 
    server,
    path: '/ws',
    clientTracking: true
  });

  wss.on('connection', (ws, req) => {
    console.log('🔗 New WebSocket connection');
    
    // Store connection info
    ws.ipAddress = req.socket.remoteAddress;
    ws.userAgent = req.headers['user-agent'];
    ws.isAlive = true;
    ws.connectionStart = Date.now();
    
    // Extract token from query parameters
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    
    if (!token) {
      console.log('❌ WebSocket connection rejected: No token provided');
      ws.close(1008, 'Token required');
      return;
    }

    // Verify JWT token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      ws.userId = decoded.userId || decoded.id;
      ws.userEmail = decoded.email;
      ws.isAdmin = decoded.role === 'admin';
      
      console.log(`✅ WebSocket authenticated for user ${ws.userId} (admin: ${ws.isAdmin})`);
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connection_established',
        payload: { 
          userId: ws.userId,
          timestamp: Date.now(),
          serverVersion: '1.0.0'
        },
        timestamp: Date.now()
      }));
      
    } catch (error) {
      console.log('❌ WebSocket authentication failed:', error.message);
      ws.close(1008, 'Invalid token');
      return;
    }

    // Handle incoming messages
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        const { type, payload } = message;
        
        console.log(`📨 WebSocket message received: ${type} from user ${ws.userId}`);
        
        // Find and execute message handler
        const handler = messageHandlers[type];
        if (handler) {
          await handler(ws, payload);
        } else {
          console.log(`⚠️ Unknown message type: ${type}`);
          
          // Send error response
          ws.send(JSON.stringify({
            type: 'error',
            payload: { 
              message: `Unknown message type: ${type}`,
              originalType: type 
            },
            timestamp: Date.now()
          }));
        }
        
      } catch (error) {
        console.error('❌ Error processing WebSocket message:', error);
        
        // Send error response
        ws.send(JSON.stringify({
          type: 'error',
          payload: { 
            message: 'Failed to process message',
            error: error.message 
          },
          timestamp: Date.now()
        }));
      }
    });

    // Handle connection errors
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });

    // Handle connection close
    ws.on('close', (code, reason) => {
      console.log(`🔌 WebSocket connection closed: ${code} ${reason}`);
      
      // Clean up subscriptions
      if (ws.workoutId) {
        realtimeWorkoutService.unsubscribeFromWorkout(ws, ws.workoutId);
      }
      
      // Clean up monitoring subscription
      if (ws.monitoringInterval) {
        clearInterval(ws.monitoringInterval);
        ws.monitoringInterval = null;
      }
    });

    // Handle pong messages (for keepalive)
    ws.on('pong', () => {
      ws.isAlive = true;
    });
  });

  // Setup periodic cleanup of dead connections
  const cleanupInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) {
        console.log('🧹 Terminating dead WebSocket connection');
        return ws.terminate();
      }
      
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000); // Check every 30 seconds

  // Cleanup on server shutdown
  wss.on('close', () => {
    clearInterval(cleanupInterval);
    realtimeWorkoutService.cleanup();
  });

  console.log('✅ WebSocket server initialized');
  
  return wss;
}

// Send real-time monitoring update to admin
function sendMonitoringUpdate(ws) {
  if (!ws.monitoringSubscription || ws.readyState !== WebSocket.OPEN) {
    return;
  }
  
  try {
    // Generate mock real-time data
    const systemHealth = {
      status: Math.random() > 0.9 ? (Math.random() > 0.5 ? 'warning' : 'critical') : 'healthy',
      cpu: Math.round((Math.random() * 40 + 20) * 100) / 100,
      memory: Math.round((Math.random() * 30 + 50) * 100) / 100,
      disk: Math.round((Math.random() * 20 + 60) * 100) / 100,
      responseTime: Math.floor(Math.random() * 300) + 100,
      activeConnections: Math.floor(Math.random() * 50) + 10,
      errorRate: Math.round((Math.random() * 2 + 0.1) * 100) / 100,
      uptime: Math.floor((Date.now() - ws.connectionStart) / 1000)
    };
    
    const activeUsers = {
      total: Math.floor(Math.random() * 200) + 50,
      authenticated: Math.floor(Math.random() * 150) + 30,
      anonymous: Math.floor(Math.random() * 50) + 10
    };
    
    const metrics = {
      timestamp: new Date().toISOString(),
      requests: Math.floor(Math.random() * 100) + 50,
      errors: Math.floor(Math.random() * 5),
      responseTime: Math.floor(Math.random() * 200) + 100,
      activeUsers: activeUsers.total
    };
    
    // Send system health update
    ws.send(JSON.stringify({
      type: 'system_health',
      payload: systemHealth,
      timestamp: Date.now()
    }));
    
    // Send active users update
    ws.send(JSON.stringify({
      type: 'active_users',
      payload: activeUsers,
      timestamp: Date.now()
    }));
    
    // Send metrics update
    ws.send(JSON.stringify({
      type: 'metrics',
      payload: metrics,
      timestamp: Date.now()
    }));
    
    // Occasionally send alerts
    if (Math.random() > 0.95) {
      const alertTypes = ['error', 'warning', 'info'];
      const alertMessages = [
        'High CPU usage detected',
        'Database response time elevated',
        'Memory usage approaching limit',
        'New user registration spike',
        'API error rate increased'
      ];
      
      const alert = {
        id: 'alert_' + Date.now(),
        type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
        message: alertMessages[Math.floor(Math.random() * alertMessages.length)],
        timestamp: new Date().toISOString(),
        acknowledged: false,
        details: 'Automatically generated monitoring alert for demonstration'
      };
      
      ws.send(JSON.stringify({
        type: 'alert',
        payload: alert,
        timestamp: Date.now()
      }));
    }
    
  } catch (error) {
    console.error('❌ Error sending monitoring update:', error);
  }
}

// Export message handlers for testing
export { messageHandlers };