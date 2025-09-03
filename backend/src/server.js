// =====================================================
// Budget Manager 2025 - Main Server
// Deutsche Geschäfts-Budget-Management-API
// =====================================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import realTimeMonitoringService from './services/realTimeMonitoring.js';

// Import routes
import budgetRoutes from './routes/budgetRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import budgetTrackingRoutes from './routes/budgetTrackingRoutes.js';
import budgetTransferRoutes from './routes/budgetTransferRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import budgetAllocationRoutes from './routes/budgetAllocationRoutes.js';
import dienstleisterRoutes from './routes/dienstleister.js';
import ocrRoutes from './routes/ocrRoutes.js';
import supplierApprovalRoutes from './routes/supplierApprovalRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import statusRoutes from './routes/statusRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import ocrReviewRoutes from './routes/ocrReviewRoutes.js';
import manualInvoicePositionRoutes from './routes/manualInvoicePositionRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import authRoutes from './routes/authRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
// import adminUserRoutes from './routes/adminUserRoutes.js'; // Temporarily disabled
import adminSystemRoutes from './routes/adminSystemRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
// import projectInvoicePositionsRoutes from './routes/projectInvoicePositions.js'; // Integriert in projectRoutes
// TODO: Add teamRoutes when implemented
// import teamRoutes from './routes/teamRoutes.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { validateGermanBusiness } from './middleware/germanBusinessValidator.js';

// Import WebSocket service
import { initializeWebSocket, shutdownWebSocket } from './services/websocketService.js';

// Load environment variables
dotenv.config({ path: './backend/.env' });

// Debug: Prüfe ob .env geladen wurde
console.log('🔍 Debug - .env Status:');
console.log('  OpenAI Key:', process.env.OPENAI_API_KEY ? 'GELADEN' : 'NICHT GELADEN');
console.log('  Anthropic Key:', process.env.ANTHROPIC_API_KEY ? 'GELADEN' : 'NICHT GELADEN');

const app = express();
const PORT = process.env.PORT || 3001;

// Create HTTP server for WebSocket integration
const httpServer = createServer(app);

// =====================================================
// SECURITY MIDDLEWARE
// =====================================================

// Rate limiting - Deutsche Geschäfts-API-Limits
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Zu viele Anfragen von dieser IP-Adresse. Bitte versuchen Sie es später erneut.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.SUPABASE_URL]
    }
  }
}));

// CORS configuration for German business requirements
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL] 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control']
}));

// Apply rate limiting
app.use(limiter);

// =====================================================
// GENERAL MIDDLEWARE
// =====================================================

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined'));
app.use(requestLogger);

// German business validation middleware
app.use('/api', validateGermanBusiness);

// =====================================================
// HEALTH CHECK
// =====================================================

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Budget Manager 2025 API ist betriebsbereit',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Budget Manager 2025 API',
    version: '1.0.0',
    description: 'Deutsche Geschäfts-Budget-Management-System',
    endpoints: {
      budgets: '/api/budgets',
      projects: '/api/projects',
      budgetTracking: '/api/budget-tracking',
      budgetTransfers: '/api/budget-transfers',
      dashboard: '/api/dashboard',
      budgetAllocation: '/api/budget-allocation',
      ocr: '/api/ocr',
      supplierApproval: '/api/supplier-approval',
      suppliers: '/api/suppliers'
      // TODO: Add teams endpoint when implemented
      // teams: '/api/teams'
    },
    features: [
      'Jahresbudget-Verwaltung',
      'Deutsche Geschäftsprojekt-Erstellung', 
      'Dreidimensionales Budget-Tracking',
      'Budget-Transfer-System',
      'Echtzeit-Budget-Dashboard',
      'OCR-Rechnungsverarbeitung (Dual Engine)'
    ],
    germanBusinessCompliance: true,
    currency: 'EUR',
    locale: 'de-DE'
  });
});

// =====================================================
// API ROUTES
// =====================================================

// Budget Management Routes (Epic 01 - Story 1.1)
app.use('/api/budgets', budgetRoutes);

// Project Management Routes (Epic 01 - Story 1.2)
app.use('/api/projects', projectRoutes);

// Epic 9: Project Relations Routes
import projectRelationsRoutes from './routes/projectRelationsRoutes.js';
app.use('/api/projects', projectRelationsRoutes);

// Budget Tracking Routes (Epic 01 - Story 1.3)
app.use('/api/budget-tracking', budgetTrackingRoutes);

// Budget Transfer Routes (Epic 01 - Story 1.4)
app.use('/api/budget-transfers', budgetTransferRoutes);

// Dashboard Routes (Epic 01 - Story 1.5)
app.use('/api/dashboard', dashboardRoutes);

// Budget Allocation Routes (Epic 01 - Story 1.2.3)
app.use('/api/budget-allocation', budgetAllocationRoutes);

// Dienstleister Routes (Epic 01 - Story 1.2.1)
app.use('/api/dienstleister', dienstleisterRoutes);

// OCR Routes (Epic 02 - Story 2.1)
app.use('/api/ocr', ocrRoutes);

// Supplier Approval Routes (Epic 02 - Story 2.2)
app.use('/api/supplier-approval', supplierApprovalRoutes);

// Supplier Routes (Österreich-spezifisch für Projekt-Anlage)
app.use('/api/suppliers', supplierRoutes);

// System Status Routes (Service-Verbindungen prüfen)
app.use('/api/status', statusRoutes);

// Admin Management Routes (Epic 08 - Umfassendes Admin-System)
app.use('/api/admin', adminRoutes);
app.use('/api/ocr-review', ocrReviewRoutes);

// Manual Invoice Position Routes (Epic 02 - Story 2.5)
app.use('/api/manual-positions', manualInvoicePositionRoutes);

// Document Storage Routes (Epic 02 - Story 2.10)
app.use('/api/documents', documentRoutes);

// Authentication Routes (Epic 08 - Story 8.1)
app.use('/api/auth', authRoutes);

// Role Management Routes (Epic 08 - Story 8.2)
app.use('/api/roles', roleRoutes);

// Admin User Management Routes (Epic 08 - Story 8.4) - Integriert in adminRoutes
// app.use('/api/admin', adminUserRoutes); // ENTFERNT - Konflikt mit adminRoutes

// Admin System Management Routes (Epic 08 - Story 8.6) - Integriert in adminRoutes  
// app.use('/api/admin/system', adminSystemRoutes); // ENTFERNT - Konflikt mit adminRoutes

// Category Management Routes (Epic 08 - Story 8.7)
app.use('/api/categories', categoryRoutes);

// Project Invoice Positions Routes sind in projectRoutes integriert

// Team Management Routes (Epic 01 - Story 1.2)
import teamsRoutes from './routes/teams.js'
import teamRollenRoutes from './routes/teamRollen.js';
import tagRoutes from './routes/tagRoutes.js';
import userRoutes from './routes/userRoutes.js';
import systemRoutes from './routes/admin/systemRoutes.js';
import aiRoutes from './routes/admin/aiRoutes.js';
import providerRoutes from './routes/admin/providerRoutes.js';
import projectSuppliersRoutes from './routes/projectSuppliersRoutes.js';
import teamRolesRoutes from './routes/teamRolesRoutes.js';

app.use('/api/teams', teamsRoutes);
app.use('/api/team-rollen', teamRollenRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/admin/users', userRoutes);
app.use('/api/admin/system', systemRoutes);
app.use('/api/admin/ai', aiRoutes);
app.use('/api/admin/providers', providerRoutes);

// Epic 9 - Multi-Dienstleister-System Routes
app.use('/api/projects', projectSuppliersRoutes);
app.use('/api/team-roles', teamRolesRoutes);

// =====================================================
// ERROR HANDLING
// =====================================================

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint nicht gefunden',
    message: `Die angeforderte Route ${req.originalUrl} existiert nicht.`,
    code: 'ENDPOINT_NOT_FOUND',
    availableEndpoints: ['/api/budgets', '/api/projects', '/api/budget-tracking', '/api/budget-transfers', '/api/dashboard']
  });
});

// Global error handler
app.use(errorHandler);

// =====================================================
// SERVER STARTUP
// =====================================================

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  console.log(`\\n🛑 ${signal} empfangen. Server wird heruntergefahren...`);
  
  try {
    // WebSocket-Server herunterfahren
    await shutdownWebSocket();
    
    // HTTP-Server herunterfahren
    server.close((err) => {
      if (err) {
        console.error('❌ Fehler beim Herunterfahren:', err);
        process.exit(1);
      }
      
      console.log('✅ Server erfolgreich heruntergefahren');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Fehler beim Herunterfahren:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server with WebSocket support
const server = httpServer.listen(PORT, async () => {
  console.log('\\n🚀 ====================================');
  console.log('   Budget Manager 2025 API Server');
  console.log('   Deutsche Geschäfts-Budget-Verwaltung');
  console.log('====================================');
  console.log(`🌐 Server läuft auf Port: ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🔍 API-Info: http://localhost:${PORT}/api`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/api/dashboard`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
  console.log(`🌍 Umgebung: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💰 Währung: EUR (Deutsche Formatierung)`);
  console.log('====================================\\n');
  
  // Initialize WebSocket server
  try {
    await initializeWebSocket(httpServer);
    console.log('🔌 WebSocket-Server erfolgreich gestartet');
    console.log(`🔄 Real-time Updates: ws://localhost:${PORT}`);
    
    // Start Real-Time Monitoring Service
    realTimeMonitoringService.start();
  } catch (error) {
    console.error('❌ Fehler beim Starten des WebSocket-Servers:', error);
  }
});

export default app;