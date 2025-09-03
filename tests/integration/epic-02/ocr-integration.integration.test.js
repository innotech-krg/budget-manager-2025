// =====================================================
// Budget Manager 2025 - OCR Integration Tests
// Epic 2 - Stories 2.7, 2.9, 2.10: OCR + Document Storage
// =====================================================

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const { supabase } = require('../../../backend/src/config/database.js');

let app;
let server;

describe('OCRIntegration.integration', () => {
  const testPdfPath = path.join(__dirname, '../../test-files/test-invoice.pdf');
  const testImagePath = path.join(__dirname, '../../test-files/test-invoice.jpg');

  beforeAll(async () => {
    // Import and start test server
    const serverModule = await import('../../../backend/src/server.js');
    app = serverModule.app;
    server = serverModule.server;

    // Create test files
    await createTestFiles();
    
    // Clean up test data
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    if (server) {
      server.close();
    }
  });

  beforeEach(async () => {
    await cleanupTestData();
  });

  describe('OCR Upload with Document Storage', () => {
    it('2.7-INT-001: should process OCR and store document automatically', async () => {
      // Act
      const response = await request(app)
        .post('/api/ocr/upload')
        .attach('file', testPdfPath)
        .field('selectedEngine', 'ai-hybrid');

      // Assert OCR Response
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.ocrProcessingId).toBeDefined();
      expect(response.body.data.documentId).toBeDefined(); // New field from Story 2.10
      expect(response.body.data.aiAnalysis).toBeDefined();

      const ocrProcessingId = response.body.data.ocrProcessingId;
      const documentId = response.body.data.documentId;

      // Verify OCR processing record
      const { data: ocrRecord } = await supabase
        .from('ocr_processing')
        .select('*')
        .eq('id', ocrProcessingId)
        .single();

      expect(ocrRecord).toBeDefined();
      expect(ocrRecord.status).toBe('COMPLETED');
      expect(ocrRecord.ai_analysis).toBeDefined();

      // Verify document was stored
      const { data: documentRecord } = await supabase
        .from('invoice_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      expect(documentRecord).toBeDefined();
      expect(documentRecord.ocr_processing_id).toBe(ocrProcessingId);
      expect(documentRecord.original_filename).toBe('test-invoice.pdf');
      expect(documentRecord.storage_bucket).toBe('invoice-pdfs');
      expect(documentRecord.retention_until).toBeDefined();

      // Verify document exists in Supabase Storage
      const { data: storageFile, error: storageError } = await supabase.storage
        .from('invoice-pdfs')
        .download(documentRecord.storage_path);

      expect(storageError).toBeNull();
      expect(storageFile).toBeDefined();
    });

    it('2.7-INT-002: should handle OCR failure gracefully without storing document', async () => {
      // Arrange - Create a corrupted file that will fail OCR
      const corruptedPath = path.join(__dirname, '../../test-files/corrupted.pdf');
      fs.writeFileSync(corruptedPath, 'Not a valid PDF');

      // Act
      const response = await request(app)
        .post('/api/ocr/upload')
        .attach('file', corruptedPath);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Verify no document was stored on OCR failure
      const { data: documents } = await supabase
        .from('invoice_documents')
        .select('*')
        .eq('original_filename', 'corrupted.pdf');

      expect(documents).toHaveLength(0);

      // Cleanup
      fs.unlinkSync(corruptedPath);
    });

    it('2.7-INT-003: should store document even if OCR partially fails', async () => {
      // This test simulates a scenario where OCR completes but with low confidence
      // The document should still be stored for manual review

      // Act
      const response = await request(app)
        .post('/api/ocr/upload')
        .attach('file', testImagePath);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.documentId).toBeDefined();

      // Verify document was stored regardless of OCR quality
      const documentId = response.body.data.documentId;
      const { data: document } = await supabase
        .from('invoice_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      expect(document).toBeDefined();
      expect(document.original_filename).toBe('test-invoice.jpg');
    });
  });

  describe('OCR Review with Document Display', () => {
    let ocrSessionId;
    let documentId;

    beforeEach(async () => {
      // Upload and process a document first
      const uploadResponse = await request(app)
        .post('/api/ocr/upload')
        .attach('file', testPdfPath);

      ocrSessionId = uploadResponse.body.data.ocrProcessingId;
      documentId = uploadResponse.body.data.documentId;

      // Create OCR review session
      await supabase
        .from('ocr_review_sessions')
        .insert({
          id: `review-${ocrSessionId}`,
          ocr_processing_id: ocrSessionId,
          review_status: 'PENDING',
          extracted_data: {
            supplier: { name: 'Test GmbH' },
            invoice: { number: 'R-001', total_amount: 1000 }
          }
        });
    });

    it('2.9-INT-004: should load OCR review with associated document', async () => {
      // Act
      const response = await request(app)
        .get(`/api/ocr-review/session/review-${ocrSessionId}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const sessionData = response.body.data;
      expect(sessionData.ocrProcessingId).toBe(ocrSessionId);
      expect(sessionData.extractedData).toBeDefined();

      // Verify document can be accessed via OCR processing ID
      const docResponse = await request(app)
        .get(`/api/documents/by-ocr/${ocrSessionId}`);

      expect(docResponse.status).toBe(200);
      expect(docResponse.body.data.documents).toHaveLength(1);
      expect(docResponse.body.data.documents[0].id).toBe(documentId);
    });

    it('2.9-INT-005: should approve OCR review and link document to invoice', async () => {
      // Arrange
      const approvalData = {
        approvedData: {
          supplier: { name: 'Test GmbH', uid_number: 'ATU12345678' },
          invoice: { number: 'R-001', date: '2025-08-30', total_amount: 1000 },
          totals: { grossAmount: 1000, netAmount: 833.33, taxAmount: 166.67 }
        },
        projectAssignments: [],
        comments: 'Test approval'
      };

      // Act
      const response = await request(app)
        .post(`/api/ocr-review/session/review-${ocrSessionId}/approve`)
        .send(approvalData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.invoiceId).toBeDefined();

      const invoiceId = response.body.data.invoiceId;

      // Verify invoice was created
      const { data: invoice } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      expect(invoice).toBeDefined();
      expect(invoice.rechnungsnummer).toBe('R-001');

      // Verify document is now linked to invoice
      const { data: updatedDocument } = await supabase
        .from('invoice_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      expect(updatedDocument.invoice_id).toBe(invoiceId);

      // Verify document can be accessed via invoice ID
      const docByInvoiceResponse = await request(app)
        .get(`/api/documents/by-invoice/${invoiceId}`);

      expect(docByInvoiceResponse.status).toBe(200);
      expect(docByInvoiceResponse.body.data.documents).toHaveLength(1);
    });
  });

  describe('Project Integration with Documents', () => {
    let projectId;
    let invoiceId;
    let documentId;

    beforeEach(async () => {
      // Create test project
      const { data: project } = await supabase
        .from('projects')
        .insert({
          name: 'Test Project',
          planned_budget: 10000,
          status: 'ACTIVE'
        })
        .select()
        .single();

      projectId = project.id;

      // Process OCR and approve to create invoice
      const uploadResponse = await request(app)
        .post('/api/ocr/upload')
        .attach('file', testPdfPath);

      const ocrSessionId = uploadResponse.body.data.ocrProcessingId;
      documentId = uploadResponse.body.data.documentId;

      // Create and approve OCR review
      await supabase
        .from('ocr_review_sessions')
        .insert({
          id: `review-${ocrSessionId}`,
          ocr_processing_id: ocrSessionId,
          review_status: 'PENDING',
          extracted_data: {
            supplier: { name: 'Test GmbH' },
            invoice: { number: 'R-002', total_amount: 500 }
          }
        });

      const approvalResponse = await request(app)
        .post(`/api/ocr-review/session/review-${ocrSessionId}/approve`)
        .send({
          approvedData: {
            supplier: { name: 'Test GmbH' },
            invoice: { number: 'R-002', total_amount: 500 },
            totals: { grossAmount: 500 }
          },
          projectAssignments: [],
          comments: 'Test'
        });

      invoiceId = approvalResponse.body.data.invoiceId;

      // Create invoice position linked to project
      await supabase
        .from('invoice_positions')
        .insert({
          invoice_id: invoiceId,
          project_id: projectId,
          description: 'Test Position',
          quantity: 1,
          unit_price: 500,
          total_amount: 500,
          assignment_type: 'AUTOMATIC'
        });
    });

    it('2.4-INT-006: should display original documents in project invoice positions', async () => {
      // Act
      const response = await request(app)
        .get(`/api/projects/${projectId}/invoice-positions`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const positions = response.body.data.positions;
      expect(positions).toHaveLength(1);
      
      const position = positions[0];
      expect(position.invoice.id).toBe(invoiceId);
      expect(position.invoice.number).toBe('R-002');

      // Verify document can be accessed via invoice
      const docResponse = await request(app)
        .get(`/api/documents/by-invoice/${invoiceId}`);

      expect(docResponse.status).toBe(200);
      expect(docResponse.body.data.documents).toHaveLength(1);
      expect(docResponse.body.data.documents[0].id).toBe(documentId);
    });

    it('2.4-INT-007: should provide document download link in project context', async () => {
      // Act - Get document metadata
      const metadataResponse = await request(app)
        .get(`/api/documents/${documentId}/metadata`);

      expect(metadataResponse.status).toBe(200);

      // Act - Generate download URL
      const urlResponse = await request(app)
        .get(`/api/documents/${documentId}/url`)
        .query({ userId: 'project-user' });

      expect(urlResponse.status).toBe(200);
      expect(urlResponse.body.data.downloadUrl).toBeDefined();

      // Act - Download document
      const downloadResponse = await request(app)
        .get(`/api/documents/${documentId}/download`)
        .query({ userId: 'project-user' });

      expect(downloadResponse.status).toBe(200);
      expect(downloadResponse.headers['content-type']).toBe('application/pdf');
    });
  });

  describe('Document Versioning and Duplicates', () => {
    it('2.10-INT-008: should create new version when re-uploading modified document', async () => {
      // Upload original document
      const originalResponse = await request(app)
        .post('/api/ocr/upload')
        .attach('file', testPdfPath);

      const originalDocumentId = originalResponse.body.data.documentId;

      // Create a modified version of the file
      const modifiedPath = path.join(__dirname, '../../test-files/modified-invoice.pdf');
      const originalContent = fs.readFileSync(testPdfPath);
      const modifiedContent = Buffer.concat([originalContent, Buffer.from('\nModified')]);
      fs.writeFileSync(modifiedPath, modifiedContent);

      // Upload modified document with same name
      const modifiedResponse = await request(app)
        .post('/api/documents/upload')
        .attach('document', modifiedPath)
        .field('uploadedBy', 'test-user');

      // Assert
      expect(modifiedResponse.status).toBe(200);
      const modifiedDocumentId = modifiedResponse.body.data.documentId;
      expect(modifiedDocumentId).not.toBe(originalDocumentId);

      // Verify both versions exist
      const { data: originalDoc } = await supabase
        .from('invoice_documents')
        .select('*')
        .eq('id', originalDocumentId)
        .single();

      const { data: modifiedDoc } = await supabase
        .from('invoice_documents')
        .select('*')
        .eq('id', modifiedDocumentId)
        .single();

      expect(originalDoc.version).toBe(1);
      expect(modifiedDoc.version).toBe(2);
      expect(originalDoc.file_hash).not.toBe(modifiedDoc.file_hash);

      // Cleanup
      fs.unlinkSync(modifiedPath);
    });

    it('2.10-INT-009: should return existing document for exact duplicate', async () => {
      // Upload original document
      const originalResponse = await request(app)
        .post('/api/documents/upload')
        .attach('document', testPdfPath)
        .field('uploadedBy', 'user1');

      const originalDocumentId = originalResponse.body.data.documentId;

      // Upload exact same document again
      const duplicateResponse = await request(app)
        .post('/api/documents/upload')
        .attach('document', testPdfPath)
        .field('uploadedBy', 'user2');

      // Assert - Should return same document ID
      expect(duplicateResponse.status).toBe(200);
      expect(duplicateResponse.body.data.documentId).toBe(originalDocumentId);

      // Verify only one document exists
      const { data: documents } = await supabase
        .from('invoice_documents')
        .select('*')
        .eq('original_filename', 'test-invoice.pdf');

      expect(documents).toHaveLength(1);
    });
  });

  describe('German Business Compliance', () => {
    it('2.10-INT-010: should set 10-year retention period automatically', async () => {
      // Act
      const response = await request(app)
        .post('/api/documents/upload')
        .attach('document', testPdfPath)
        .field('uploadedBy', 'compliance-user');

      // Assert
      expect(response.status).toBe(200);
      const documentId = response.body.data.documentId;

      const { data: document } = await supabase
        .from('invoice_documents')
        .select('retention_until')
        .eq('id', documentId)
        .single();

      const retentionDate = new Date(document.retention_until);
      const currentDate = new Date();
      const yearsDifference = retentionDate.getFullYear() - currentDate.getFullYear();

      expect(yearsDifference).toBe(10);
    });

    it('2.10-INT-011: should log all document access for audit trail', async () => {
      // Upload document
      const uploadResponse = await request(app)
        .post('/api/documents/upload')
        .attach('document', testPdfPath)
        .field('uploadedBy', 'audit-user');

      const documentId = uploadResponse.body.data.documentId;

      // Perform various operations
      await request(app)
        .get(`/api/documents/${documentId}/metadata`);

      await request(app)
        .get(`/api/documents/${documentId}/url`)
        .query({ userId: 'viewer-user' });

      await request(app)
        .get(`/api/documents/${documentId}/download`)
        .query({ userId: 'downloader-user' });

      // Verify audit trail
      const { data: auditLog } = await supabase
        .from('document_access_log')
        .select('*')
        .eq('document_id', documentId)
        .order('accessed_at', { ascending: false });

      expect(auditLog.length).toBeGreaterThanOrEqual(3);
      
      const accessTypes = auditLog.map(log => log.access_type);
      expect(accessTypes).toContain('UPLOAD');
      expect(accessTypes).toContain('VIEW');
      expect(accessTypes).toContain('DOWNLOAD');

      // Verify user tracking
      const users = auditLog.map(log => log.accessed_by);
      expect(users).toContain('audit-user');
      expect(users).toContain('viewer-user');
      expect(users).toContain('downloader-user');
    });

    it('2.10-INT-012: should handle German filename characters correctly', async () => {
      // Create file with German characters
      const germanPath = path.join(__dirname, '../../test-files/Rechnung_Müller_&_Söhne.pdf');
      fs.copyFileSync(testPdfPath, germanPath);

      // Act
      const response = await request(app)
        .post('/api/documents/upload')
        .attach('document', germanPath)
        .field('uploadedBy', 'german-user');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.originalFilename).toBe('Rechnung_Müller_&_Söhne.pdf');

      const documentId = response.body.data.documentId;
      const { data: document } = await supabase
        .from('invoice_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      expect(document.original_filename).toBe('Rechnung_Müller_&_Söhne.pdf');
      expect(document.stored_filename).toBeDefined();
      expect(document.storage_path).toBeDefined();

      // Cleanup
      fs.unlinkSync(germanPath);
    });
  });

  // Helper functions
  async function createTestFiles() {
    const testFilesDir = path.join(__dirname, '../../test-files');
    
    if (!fs.existsSync(testFilesDir)) {
      fs.mkdirSync(testFilesDir, { recursive: true });
    }

    // Create test PDF
    if (!fs.existsSync(testPdfPath)) {
      fs.writeFileSync(testPdfPath, '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF');
    }

    // Create test image
    if (!fs.existsSync(testImagePath)) {
      const jpegHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);
      fs.writeFileSync(testImagePath, jpegHeader);
    }
  }

  async function cleanupTestData() {
    try {
      // Clean up in correct order due to foreign key constraints
      await supabase.from('document_access_log').delete().like('document_id', 'test-%');
      await supabase.from('invoice_positions').delete().like('invoice_id', 'test-%');
      await supabase.from('invoices').delete().like('id', 'test-%');
      await supabase.from('invoice_documents').delete().like('id', 'test-%');
      await supabase.from('ocr_review_sessions').delete().like('id', 'review-%');
      await supabase.from('ocr_processing').delete().like('id', 'test-%');
      await supabase.from('projects').delete().eq('name', 'Test Project');

      // Clean up Supabase Storage
      const { data: files } = await supabase.storage
        .from('invoice-pdfs')
        .list('test/', { limit: 100 });
      
      if (files && files.length > 0) {
        const filePaths = files.map(file => `test/${file.name}`);
        await supabase.storage
          .from('invoice-pdfs')
          .remove(filePaths);
      }
    } catch (error) {
      console.warn('Cleanup warning:', error.message);
    }
  }
});
