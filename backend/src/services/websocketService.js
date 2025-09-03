// =====================================================
// Budget Manager 2025 - WebSocket Service
// Story 1.5: Echtzeit-Budget-Dashboard - Real-time Updates
// =====================================================

import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

let io = null;
let redisClient = null;
let redisPubClient = null;
let redisSubClient = null;

// =====================================================
// WEBSOCKET INITIALIZATION
// =====================================================

/**
 * Initialisiere WebSocket-Server mit Redis-Adapter
 * Story 1.5 - Echtzeit-Updates
 */
export const initializeWebSocket = async (httpServer) => {
  try {
    // Socket.IO Server erstellen
    io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    // Redis-Clients für Skalierung (optional)
    if (process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
      try {
        redisPubClient = createClient({ url: process.env.REDIS_URL });
        redisSubClient = redisPubClient.duplicate();

        await Promise.all([
          redisPubClient.connect(),
          redisSubClient.connect()
        ]);

        io.adapter(createAdapter(redisPubClient, redisSubClient));
        console.log('✅ Redis-Adapter für WebSocket initialisiert');
      } catch (redisError) {
        console.log('⚠️ Redis nicht verfügbar, verwende Memory-Adapter:', redisError.message);
      }
    }

    // Connection Handler
    io.on('connection', (socket) => {
      console.log(`🔌 WebSocket-Client verbunden: ${socket.id}`);

      // Client zu Dashboard-Room hinzufügen
      socket.join('dashboard');
      
      // Sende aktuelle Dashboard-Daten beim Connect
      socket.emit('dashboard:initial', {
        message: 'WebSocket-Verbindung erfolgreich',
        timestamp: new Date().toISOString()
      });

      // Disconnect Handler
      socket.on('disconnect', (reason) => {
        console.log(`🔌 WebSocket-Client getrennt: ${socket.id} (${reason})`);
        
        // Remove from monitoring service
        import('./realTimeMonitoring.js').then(({ default: realTimeMonitoringService }) => {
          realTimeMonitoringService.removeSubscriber(socket);
        });
      });

      // Error Handler
      socket.on('error', (error) => {
        console.error(`❌ WebSocket-Fehler für Client ${socket.id}:`, error);
      });

      // Custom Event Handlers
      socket.on('dashboard:subscribe', (data) => {
        console.log(`📊 Client ${socket.id} abonniert Dashboard-Updates:`, data);
        socket.join('dashboard-live');
      });

      socket.on('dashboard:unsubscribe', (data) => {
        console.log(`📊 Client ${socket.id} deabonniert Dashboard-Updates:`, data);
        socket.leave('dashboard-live');
      });

      // Monitoring Event Handlers
      socket.on('monitoring:subscribe', () => {
        console.log(`📊 Client ${socket.id} abonniert Real-Time Monitoring`);
        socket.join('monitoring');
        
        // Add to monitoring service
        import('./realTimeMonitoring.js').then(({ default: realTimeMonitoringService }) => {
          realTimeMonitoringService.addSubscriber(socket);
        });
      });

      socket.on('monitoring:unsubscribe', () => {
        console.log(`📊 Client ${socket.id} deabonniert Real-Time Monitoring`);
        socket.leave('monitoring');
        
        // Remove from monitoring service
        import('./realTimeMonitoring.js').then(({ default: realTimeMonitoringService }) => {
          realTimeMonitoringService.removeSubscriber(socket);
        });
      });
    });

    console.log('🚀 WebSocket-Server erfolgreich initialisiert');
    return io;

  } catch (error) {
    console.error('❌ Fehler beim Initialisieren des WebSocket-Servers:', error);
    throw error;
  }
};

// =====================================================
// REAL-TIME EVENT BROADCASTING
// =====================================================

/**
 * Sende Budget-Update an alle Dashboard-Clients
 * Story 1.5 - Echtzeit Budget-Updates
 */
export const broadcastBudgetUpdate = (eventType, data) => {
  if (!io) {
    console.warn('⚠️ WebSocket-Server nicht initialisiert');
    return;
  }

  const updatePayload = {
    type: eventType,
    data: data,
    timestamp: new Date().toISOString(),
    source: 'budget-manager-api'
  };

  // An alle Dashboard-Clients senden
  io.to('dashboard').emit('budget:update', updatePayload);
  
  console.log(`📡 Budget-Update gesendet: ${eventType}`, {
    clients: io.sockets.adapter.rooms.get('dashboard')?.size || 0,
    type: eventType
  });
};

/**
 * Sende Projekt-Update an Dashboard-Clients
 * Story 1.5 - Projekt-Status-Updates
 */
export const broadcastProjectUpdate = (projectId, updateData) => {
  if (!io) return;

  const updatePayload = {
    type: 'PROJECT_UPDATE',
    projectId,
    data: updateData,
    timestamp: new Date().toISOString()
  };

  io.to('dashboard').emit('project:update', updatePayload);
  
  console.log(`📡 Projekt-Update gesendet für Projekt ${projectId}`);
};

/**
 * Sende Transfer-Update an Dashboard-Clients
 * Story 1.5 - Transfer-Status-Updates
 */
export const broadcastTransferUpdate = (transferId, status, transferData) => {
  if (!io) return;

  const updatePayload = {
    type: 'TRANSFER_UPDATE',
    transferId,
    status,
    data: transferData,
    timestamp: new Date().toISOString()
  };

  io.to('dashboard').emit('transfer:update', updatePayload);
  
  console.log(`📡 Transfer-Update gesendet: ${transferId} → ${status}`);
};

/**
 * Sende kritische Warnung an Dashboard-Clients
 * Story 1.5 - Budget-Warnungen
 */
export const broadcastCriticalAlert = (alertType, alertData) => {
  if (!io) return;

  const alertPayload = {
    type: 'CRITICAL_ALERT',
    alertType,
    data: alertData,
    timestamp: new Date().toISOString(),
    severity: alertData.severity || 'HIGH'
  };

  // An alle Clients senden (nicht nur Dashboard)
  io.emit('alert:critical', alertPayload);
  
  console.log(`🚨 Kritische Warnung gesendet: ${alertType}`);
};

/**
 * Sende Dashboard-Refresh-Signal
 * Story 1.5 - Dashboard-Aktualisierung
 */
export const broadcastDashboardRefresh = (reason = 'DATA_UPDATED') => {
  if (!io) return;

  const refreshPayload = {
    type: 'DASHBOARD_REFRESH',
    reason,
    timestamp: new Date().toISOString()
  };

  io.to('dashboard-live').emit('dashboard:refresh', refreshPayload);
  
  console.log(`🔄 Dashboard-Refresh gesendet: ${reason}`);
};

// =====================================================
// WEBSOCKET STATISTICS & MONITORING
// =====================================================

/**
 * Hole WebSocket-Statistiken
 */
export const getWebSocketStats = () => {
  if (!io) {
    return {
      connected: false,
      clients: 0,
      rooms: {}
    };
  }

  const rooms = {};
  io.sockets.adapter.rooms.forEach((clients, roomName) => {
    if (!roomName.startsWith('/')) { // Nur echte Rooms, nicht Socket-IDs
      rooms[roomName] = clients.size;
    }
  });

  return {
    connected: true,
    totalClients: io.sockets.sockets.size,
    rooms: rooms,
    engine: io.engine.clientsCount
  };
};

/**
 * Teste WebSocket-Verbindung
 */
export const testWebSocketConnection = () => {
  if (!io) {
    return { success: false, message: 'WebSocket-Server nicht initialisiert' };
  }

  const testPayload = {
    type: 'CONNECTION_TEST',
    message: 'WebSocket-Verbindungstest erfolgreich',
    timestamp: new Date().toISOString()
  };

  io.emit('system:test', testPayload);
  
  return { 
    success: true, 
    message: 'Test-Nachricht gesendet',
    clients: io.sockets.sockets.size
  };
};

// =====================================================
// CLEANUP & SHUTDOWN
// =====================================================

/**
 * WebSocket-Server herunterfahren
 */
export const shutdownWebSocket = async () => {
  try {
    if (io) {
      io.close();
      console.log('✅ WebSocket-Server heruntergefahren');
    }

    if (redisPubClient) {
      await redisPubClient.quit();
      console.log('✅ Redis Pub-Client getrennt');
    }

    if (redisSubClient) {
      await redisSubClient.quit();
      console.log('✅ Redis Sub-Client getrennt');
    }
  } catch (error) {
    console.error('❌ Fehler beim Herunterfahren des WebSocket-Servers:', error);
  }
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Prüfe ob WebSocket-Server läuft
 */
export const isWebSocketActive = () => {
  return io !== null && io.sockets !== undefined;
};

/**
 * Hole verbundene Clients
 */
export const getConnectedClients = () => {
  if (!io) return [];
  
  const clients = [];
  io.sockets.sockets.forEach((socket) => {
    clients.push({
      id: socket.id,
      connected: socket.connected,
      rooms: Array.from(socket.rooms)
    });
  });
  
  return clients;
};

export default {
  initializeWebSocket,
  broadcastBudgetUpdate,
  broadcastProjectUpdate,
  broadcastTransferUpdate,
  broadcastCriticalAlert,
  broadcastDashboardRefresh,
  getWebSocketStats,
  testWebSocketConnection,
  shutdownWebSocket,
  isWebSocketActive,
  getConnectedClients
};

