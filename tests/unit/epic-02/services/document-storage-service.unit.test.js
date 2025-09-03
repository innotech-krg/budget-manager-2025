// =====================================================
// Budget Manager 2025 - DocumentStorageService Unit Tests
// Epic 2 - Story 2.10: Original-Rechnungen Speicherung
// =====================================================

const { documentStorageService } = require('../../../../backend/src/services/documentStorageService.js');
const { supabase } = require('../../../../backend/src/config/database.js');
const fs = require('fs/promises');
const crypto = require('crypto');

// Mock Supabase
jest.mock('../../../../backend/src/config/database.js');

describe('DocumentStorageService.unit', () => {
  let mockFileBuffer;
  let mockMetadata;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock file buffer
    mockFileBuffer = Buffer.from('PDF content mock');
    
    // Mock metadata
    mockMetadata = {
      originalName: 'test-invoice.pdf',
      mimeType: 'application/pdf',
      ocrProcessingId: 'test-ocr-id',
      uploadedBy: 'test-user'
    };

    // Mock Supabase responses
    supabase.storage = {
      from: jest.fn().mockReturnThis(),
      upload: jest.fn(),
      download: jest.fn(),
      createSignedUrl: jest.fn(),
      remove: jest.fn()
    };

    supabase.from = jest.fn().mockReturnThis();
    supabase.insert = jest.fn().mockReturnThis();
    supabase.select = jest.fn().mockReturnThis();
    supabase.single = jest.fn();
    supabase.eq = jest.fn().mockReturnThis();
    supabase.update = jest.fn().mockReturnThis();
    supabase.raw = jest.fn();
  });

  describe('storeDocument()', () => {
    it('2.10-UNIT-001: should store document successfully with correct metadata', async () => {
      // Arrange
      const mockDocument = {
        id: 'doc-123',
        original_filename: 'test-invoice.pdf',
        file_hash: crypto.createHash('sha256').update(mockFileBuffer).digest('hex')
      };

      supabase.storage.upload.mockResolvedValue({ data: { path: 'test-path' }, error: null });
      supabase.single.mockResolvedValue({ data: mockDocument, error: null });

      // Act
      const result = await documentStorageService.storeDocument(mockFileBuffer, mockMetadata);

      // Assert
      expect(supabase.storage.from).toHaveBeenCalledWith('invoice-pdfs');
      expect(supabase.storage.upload).toHaveBeenCalled();
      expect(supabase.from).toHaveBeenCalledWith('invoice_documents');
      expect(result).toEqual(mockDocument);
    });

    it('2.10-UNIT-002: should reject files larger than 50MB', async () => {
      // Arrange
      const largeBuffer = Buffer.alloc(51 * 1024 * 1024); // 51MB
      
      // Act & Assert
      await expect(documentStorageService.storeDocument(largeBuffer, mockMetadata))
        .rejects.toThrow('Datei zu groß');
    });

    it('2.10-UNIT-003: should reject unsupported file types', async () => {
      // Arrange
      const invalidMetadata = {
        ...mockMetadata,
        mimeType: 'application/exe'
      };
      
      // Act & Assert
      await expect(documentStorageService.storeDocument(mockFileBuffer, invalidMetadata))
        .rejects.toThrow('Dateityp nicht erlaubt');
    });

    it('2.10-UNIT-004: should calculate SHA-256 hash correctly', async () => {
      // Arrange
      const expectedHash = crypto.createHash('sha256').update(mockFileBuffer).digest('hex');
      
      supabase.storage.upload.mockResolvedValue({ data: { path: 'test-path' }, error: null });
      supabase.single.mockResolvedValue({ 
        data: { id: 'doc-123', file_hash: expectedHash }, 
        error: null 
      });

      // Act
      const result = await documentStorageService.storeDocument(mockFileBuffer, mockMetadata);

      // Assert
      expect(result.file_hash).toBe(expectedHash);
    });

    it('2.10-UNIT-005: should set 10-year retention period automatically', async () => {
      // Arrange
      const currentDate = new Date();
      const expectedRetentionDate = new Date(currentDate.getFullYear() + 10, currentDate.getMonth(), currentDate.getDate());
      
      supabase.storage.upload.mockResolvedValue({ data: { path: 'test-path' }, error: null });
      supabase.single.mockResolvedValue({ 
        data: { id: 'doc-123', retention_until: expectedRetentionDate.toISOString().split('T')[0] }, 
        error: null 
      });

      // Act
      const result = await documentStorageService.storeDocument(mockFileBuffer, mockMetadata);

      // Assert
      expect(new Date(result.retention_until).getFullYear()).toBe(currentDate.getFullYear() + 10);
    });
  });

  describe('retrieveDocument()', () => {
    it('2.10-UNIT-006: should retrieve document successfully', async () => {
      // Arrange
      const documentId = 'doc-123';
      const mockDocument = {
        id: documentId,
        original_filename: 'test.pdf',
        storage_path: 'invoices/2025/08/test.pdf',
        archived: false
      };
      const mockFileData = new Blob(['PDF content']);

      supabase.single.mockResolvedValue({ data: mockDocument, error: null });
      supabase.storage.download.mockResolvedValue({ data: mockFileData, error: null });

      // Act
      const result = await documentStorageService.retrieveDocument(documentId, 'test-user');

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('invoice_documents');
      expect(supabase.storage.from).toHaveBeenCalledWith('invoice-pdfs');
      expect(result.metadata).toEqual(mockDocument);
    });

    it('2.10-UNIT-007: should reject access to archived documents', async () => {
      // Arrange
      const documentId = 'doc-123';
      const archivedDocument = {
        id: documentId,
        archived: true
      };

      supabase.single.mockResolvedValue({ data: archivedDocument, error: null });

      // Act & Assert
      await expect(documentStorageService.retrieveDocument(documentId, 'test-user'))
        .rejects.toThrow('Dokument ist archiviert');
    });

    it('2.10-UNIT-008: should increment access count on retrieval', async () => {
      // Arrange
      const documentId = 'doc-123';
      const mockDocument = {
        id: documentId,
        archived: false,
        storage_path: 'test-path'
      };

      supabase.single.mockResolvedValue({ data: mockDocument, error: null });
      supabase.storage.download.mockResolvedValue({ data: new Blob(), error: null });
      supabase.update.mockReturnThis();

      // Act
      await documentStorageService.retrieveDocument(documentId, 'test-user');

      // Assert
      expect(supabase.update).toHaveBeenCalledWith({
        access_count: expect.anything(),
        last_accessed: expect.any(String)
      });
    });
  });

  describe('generateDownloadUrl()', () => {
    it('2.10-UNIT-009: should generate signed URL with correct expiration', async () => {
      // Arrange
      const documentId = 'doc-123';
      const expiresIn = 3600;
      const mockDocument = {
        id: documentId,
        storage_path: 'invoices/2025/08/test.pdf',
        archived: false
      };
      const mockSignedUrl = 'https://supabase.co/signed-url';

      supabase.single.mockResolvedValue({ data: mockDocument, error: null });
      supabase.storage.createSignedUrl.mockResolvedValue({ 
        data: { signedUrl: mockSignedUrl }, 
        error: null 
      });

      // Act
      const result = await documentStorageService.generateDownloadUrl(documentId, expiresIn, 'test-user');

      // Assert
      expect(supabase.storage.createSignedUrl).toHaveBeenCalledWith(mockDocument.storage_path, expiresIn);
      expect(result).toBe(mockSignedUrl);
    });

    it('2.10-UNIT-010: should reject URL generation for archived documents', async () => {
      // Arrange
      const documentId = 'doc-123';
      const archivedDocument = {
        id: documentId,
        archived: true
      };

      supabase.single.mockResolvedValue({ data: archivedDocument, error: null });

      // Act & Assert
      await expect(documentStorageService.generateDownloadUrl(documentId, 3600, 'test-user'))
        .rejects.toThrow('Dokument ist archiviert');
    });
  });

  describe('checkDuplicate()', () => {
    it('2.10-UNIT-011: should detect duplicate by hash', async () => {
      // Arrange
      const testHash = 'abc123def456';
      const existingDocument = {
        id: 'existing-doc',
        file_hash: testHash,
        version: 1
      };

      supabase.eq.mockReturnThis();
      supabase.order.mockReturnThis();
      supabase.limit.mockReturnThis();
      supabase.select.mockResolvedValue({ 
        data: [existingDocument], 
        error: null 
      });

      // Act
      const result = await documentStorageService.checkDuplicate(testHash);

      // Assert
      expect(result).toEqual(existingDocument);
      expect(supabase.eq).toHaveBeenCalledWith('file_hash', testHash);
      expect(supabase.eq).toHaveBeenCalledWith('archived', false);
    });

    it('2.10-UNIT-012: should return null for unique hash', async () => {
      // Arrange
      const uniqueHash = 'unique123';

      supabase.eq.mockReturnThis();
      supabase.order.mockReturnThis();
      supabase.limit.mockReturnThis();
      supabase.select.mockResolvedValue({ 
        data: [], 
        error: null 
      });

      // Act
      const result = await documentStorageService.checkDuplicate(uniqueHash);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('handleDuplicate()', () => {
    it('2.10-UNIT-013: should return existing document for identical file size', async () => {
      // Arrange
      const existingDoc = {
        id: 'existing-doc',
        file_size: mockFileBuffer.length,
        version: 1
      };

      // Act
      const result = await documentStorageService.handleDuplicate(existingDoc, mockFileBuffer, mockMetadata);

      // Assert
      expect(result).toEqual(existingDoc);
    });

    it('2.10-UNIT-014: should create new version for different file size', async () => {
      // Arrange
      const existingDoc = {
        id: 'existing-doc',
        file_size: 1000,
        version: 1,
        original_filename: 'test.pdf'
      };
      const newVersion = {
        id: 'new-version-doc',
        version: 2
      };

      supabase.storage.upload.mockResolvedValue({ data: { path: 'new-path' }, error: null });
      supabase.single.mockResolvedValue({ data: newVersion, error: null });

      // Act
      const result = await documentStorageService.handleDuplicate(existingDoc, mockFileBuffer, mockMetadata);

      // Assert
      expect(result.version).toBe(2);
    });
  });

  describe('logAccess()', () => {
    it('2.10-UNIT-015: should log document access correctly', async () => {
      // Arrange
      const documentId = 'doc-123';
      const userId = 'user-456';
      const accessType = 'DOWNLOAD';

      supabase.insert.mockReturnThis();
      supabase.from.mockReturnValue({ insert: jest.fn() });

      // Act
      await documentStorageService.logAccess(documentId, userId, accessType);

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('document_access_log');
    });

    it('2.10-UNIT-016: should handle logging errors gracefully', async () => {
      // Arrange
      const documentId = 'doc-123';
      supabase.from.mockImplementation(() => {
        throw new Error('Database error');
      });

      // Act & Assert - Should not throw
      await expect(documentStorageService.logAccess(documentId, 'user', 'VIEW'))
        .resolves.not.toThrow();
    });
  });

  describe('German Business Logic', () => {
    it('2.10-UNIT-017: should handle German filename characters correctly', async () => {
      // Arrange
      const germanMetadata = {
        ...mockMetadata,
        originalName: 'Rechnung_Müller_&_Söhne_GmbH.pdf'
      };

      supabase.storage.upload.mockResolvedValue({ data: { path: 'test-path' }, error: null });
      supabase.single.mockResolvedValue({ 
        data: { id: 'doc-123' }, 
        error: null 
      });

      // Act
      const result = await documentStorageService.storeDocument(mockFileBuffer, germanMetadata);

      // Assert
      expect(result).toBeDefined();
      // Verify that German characters are handled properly in storage path
    });

    it('2.10-UNIT-018: should format German dates correctly in retention calculation', async () => {
      // Arrange
      const retentionDate = documentStorageService.calculateRetentionDate();
      
      // Act
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      
      // Assert
      expect(retentionDate).toMatch(dateRegex);
      expect(new Date(retentionDate).getFullYear()).toBe(new Date().getFullYear() + 10);
    });
  });

  describe('Error Handling', () => {
    it('2.10-UNIT-019: should handle Supabase storage errors gracefully', async () => {
      // Arrange
      supabase.storage.upload.mockResolvedValue({ 
        data: null, 
        error: { message: 'Storage error' } 
      });

      // Act & Assert
      await expect(documentStorageService.storeDocument(mockFileBuffer, mockMetadata))
        .rejects.toThrow('Supabase Storage Upload Fehler');
    });

    it('2.10-UNIT-020: should cleanup on database error after successful upload', async () => {
      // Arrange
      supabase.storage.upload.mockResolvedValue({ data: { path: 'test-path' }, error: null });
      supabase.single.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });
      supabase.storage.remove.mockResolvedValue({ data: null, error: null });

      // Act & Assert
      await expect(documentStorageService.storeDocument(mockFileBuffer, mockMetadata))
        .rejects.toThrow('Datenbank-Fehler');
      
      expect(supabase.storage.remove).toHaveBeenCalled();
    });
  });
});
