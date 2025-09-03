// =====================================================
// Budget Manager 2025 - OCR Service Unit Tests
// Epic 2 - Story 2.7: OCR KI-Refactoring
// =====================================================

const ocrService = require('../../../../backend/src/services/ocrService.js');
const { supabase } = require('../../../../backend/src/config/database.js');
const fs = require('fs/promises');

// Mock dependencies
jest.mock('../../../../backend/src/config/database.js');
jest.mock('fs/promises');

describe('OCRService.unit', () => {
  let mockFilePath;
  let mockFileName;
  let mockMimeType;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockFilePath = '/test/path/invoice.pdf';
    mockFileName = 'test-invoice.pdf';
    mockMimeType = 'application/pdf';

    // Mock Supabase
    supabase.from = jest.fn().mockReturnThis();
    supabase.insert = jest.fn().mockReturnThis();
    supabase.select = jest.fn().mockReturnThis();
    supabase.single = jest.fn();
    supabase.update = jest.fn().mockReturnThis();
    supabase.eq = jest.fn().mockReturnThis();

    // Mock file system
    fs.readFile = jest.fn();
    fs.unlink = jest.fn();
  });

  describe('processDocument()', () => {
    it('2.7-UNIT-001: should process PDF document successfully', async () => {
      // Arrange
      const mockOcrProcessing = {
        id: 'ocr-123',
        file_name: mockFileName,
        selected_engine: 'ai-hybrid'
      };
      
      const mockAiAnalysis = {
        supplier: { name: 'Test GmbH', uid_number: 'ATU12345678' },
        invoice: { number: 'R-2025-001', date: '2025-08-30', total_amount: 1000 },
        line_items: [{ description: 'Test Item', quantity: 1, unit_price: 1000 }],
        confidence_score: 95
      };

      supabase.single.mockResolvedValueOnce({ data: mockOcrProcessing, error: null });
      supabase.single.mockResolvedValueOnce({ data: mockOcrProcessing, error: null });
      
      // Mock AI analysis
      jest.spyOn(ocrService, 'analyzeWithAI').mockResolvedValue({
        success: true,
        analysis: mockAiAnalysis,
        confidence: 95
      });

      // Act
      const result = await ocrService.processDocument(mockFilePath, mockFileName, mockMimeType);

      // Assert
      expect(result.success).toBe(true);
      expect(result.ocrProcessingId).toBe('ocr-123');
      expect(result.aiAnalysis).toEqual(mockAiAnalysis);
      expect(result.confidence).toBe(95);
    });

    it('2.7-UNIT-002: should handle PDF to image conversion for AI processing', async () => {
      // Arrange
      const mockOcrProcessing = { id: 'ocr-123' };
      supabase.single.mockResolvedValue({ data: mockOcrProcessing, error: null });
      
      jest.spyOn(ocrService, 'convertPdfToImage').mockResolvedValue('/tmp/converted.jpg');
      jest.spyOn(ocrService, 'analyzeWithAI').mockResolvedValue({
        success: true,
        analysis: { confidence_score: 90 },
        confidence: 90
      });

      // Act
      const result = await ocrService.processDocument(mockFilePath, mockFileName, 'application/pdf');

      // Assert
      expect(ocrService.convertPdfToImage).toHaveBeenCalledWith(mockFilePath);
      expect(result.success).toBe(true);
    });

    it('2.7-UNIT-003: should process image documents directly', async () => {
      // Arrange
      const mockOcrProcessing = { id: 'ocr-123' };
      supabase.single.mockResolvedValue({ data: mockOcrProcessing, error: null });
      
      jest.spyOn(ocrService, 'analyzeWithAI').mockResolvedValue({
        success: true,
        analysis: { confidence_score: 85 },
        confidence: 85
      });

      // Act
      const result = await ocrService.processDocument(mockFilePath, mockFileName, 'image/jpeg');

      // Assert
      expect(result.success).toBe(true);
      expect(result.confidence).toBe(85);
    });

    it('2.7-UNIT-004: should handle unsupported file types', async () => {
      // Act & Assert
      await expect(ocrService.processDocument(mockFilePath, mockFileName, 'text/plain'))
        .rejects.toThrow('Nicht unterstützter Dateityp');
    });

    it('2.7-UNIT-005: should create OCR processing record in database', async () => {
      // Arrange
      const mockOcrProcessing = { id: 'ocr-123' };
      supabase.single.mockResolvedValue({ data: mockOcrProcessing, error: null });
      
      jest.spyOn(ocrService, 'analyzeWithAI').mockResolvedValue({
        success: true,
        analysis: {},
        confidence: 80
      });

      // Act
      await ocrService.processDocument(mockFilePath, mockFileName, mockMimeType);

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('ocr_processing');
      expect(supabase.insert).toHaveBeenCalled();
    });

    it('2.7-UNIT-006: should update processing record with results', async () => {
      // Arrange
      const mockOcrProcessing = { id: 'ocr-123' };
      supabase.single.mockResolvedValue({ data: mockOcrProcessing, error: null });
      
      jest.spyOn(ocrService, 'analyzeWithAI').mockResolvedValue({
        success: true,
        analysis: { test: 'data' },
        confidence: 88
      });

      // Act
      await ocrService.processDocument(mockFilePath, mockFileName, mockMimeType);

      // Assert
      expect(supabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'COMPLETED',
          ai_analysis: { test: 'data' },
          confidence_score: 88
        })
      );
    });
  });

  describe('analyzeWithAI()', () => {
    it('2.7-UNIT-007: should analyze invoice with OpenAI GPT-4', async () => {
      // Arrange
      const mockImagePath = '/tmp/test.jpg';
      const mockResponse = {
        supplier: { name: 'DEFINE GmbH', uid_number: 'ATU2783446' },
        invoice: { number: 'R2502-1269', date: '2025-02-12' },
        line_items: [{ description: 'Design Services', quantity: 1, unit_price: 579.50 }]
      };

      // Mock OpenAI response
      jest.spyOn(ocrService, 'callOpenAI').mockResolvedValue({
        success: true,
        data: mockResponse
      });

      // Act
      const result = await ocrService.analyzeWithAI(mockImagePath, 'openai');

      // Assert
      expect(result.success).toBe(true);
      expect(result.analysis.supplier.name).toBe('DEFINE GmbH');
      expect(result.analysis.invoice.number).toBe('R2502-1269');
    });

    it('2.7-UNIT-008: should analyze invoice with Anthropic Claude', async () => {
      // Arrange
      const mockImagePath = '/tmp/test.jpg';
      const mockResponse = {
        supplier: { name: 'Test Supplier' },
        invoice: { number: 'INV-001' }
      };

      jest.spyOn(ocrService, 'callClaude').mockResolvedValue({
        success: true,
        data: mockResponse
      });

      // Act
      const result = await ocrService.analyzeWithAI(mockImagePath, 'claude');

      // Assert
      expect(result.success).toBe(true);
      expect(result.analysis.supplier.name).toBe('Test Supplier');
    });

    it('2.7-UNIT-009: should fallback to secondary AI on primary failure', async () => {
      // Arrange
      const mockImagePath = '/tmp/test.jpg';
      
      jest.spyOn(ocrService, 'callOpenAI').mockRejectedValue(new Error('API Error'));
      jest.spyOn(ocrService, 'callClaude').mockResolvedValue({
        success: true,
        data: { supplier: { name: 'Fallback Result' } }
      });

      // Act
      const result = await ocrService.analyzeWithAI(mockImagePath, 'openai');

      // Assert
      expect(result.success).toBe(true);
      expect(result.analysis.supplier.name).toBe('Fallback Result');
    });

    it('2.7-UNIT-010: should handle Austrian business data correctly', async () => {
      // Arrange
      const mockImagePath = '/tmp/austrian-invoice.jpg';
      const austrianResponse = {
        supplier: {
          name: 'Müller & Söhne GmbH',
          uid_number: 'ATU12345678',
          firmenbuchnummer: 'FN 123456a',
          legal_form: 'GmbH'
        },
        invoice: {
          number: 'RE-2025-001',
          date: '30.08.2025',
          total_amount: 1234.56,
          currency: 'EUR'
        }
      };

      jest.spyOn(ocrService, 'callOpenAI').mockResolvedValue({
        success: true,
        data: austrianResponse
      });

      // Act
      const result = await ocrService.analyzeWithAI(mockImagePath, 'openai');

      // Assert
      expect(result.analysis.supplier.uid_number).toMatch(/^ATU\d{8}$/);
      expect(result.analysis.supplier.legal_form).toBe('GmbH');
      expect(result.analysis.invoice.currency).toBe('EUR');
    });
  });

  describe('convertPdfToImage()', () => {
    it('2.7-UNIT-011: should convert PDF to image using ImageMagick', async () => {
      // Arrange
      const mockPdfPath = '/tmp/test.pdf';
      const expectedImagePath = '/tmp/test_page_1.jpg';
      
      jest.spyOn(ocrService, 'executeImageMagick').mockResolvedValue(expectedImagePath);

      // Act
      const result = await ocrService.convertPdfToImage(mockPdfPath);

      // Assert
      expect(result).toBe(expectedImagePath);
      expect(ocrService.executeImageMagick).toHaveBeenCalledWith(
        expect.stringContaining('convert'),
        expect.arrayContaining([mockPdfPath])
      );
    });

    it('2.7-UNIT-012: should handle PDF conversion errors', async () => {
      // Arrange
      const mockPdfPath = '/tmp/corrupted.pdf';
      
      jest.spyOn(ocrService, 'executeImageMagick').mockRejectedValue(
        new Error('ImageMagick conversion failed')
      );

      // Act & Assert
      await expect(ocrService.convertPdfToImage(mockPdfPath))
        .rejects.toThrow('PDF-Konvertierung fehlgeschlagen');
    });
  });

  describe('German Business Logic Validation', () => {
    it('2.7-UNIT-013: should validate German UID format', async () => {
      // Arrange
      const validUIDs = ['ATU12345678', 'ATU87654321'];
      const invalidUIDs = ['DE123456789', 'ATU1234567', 'ATU123456789'];

      // Act & Assert
      validUIDs.forEach(uid => {
        expect(ocrService.validateAustrianUID(uid)).toBe(true);
      });

      invalidUIDs.forEach(uid => {
        expect(ocrService.validateAustrianUID(uid)).toBe(false);
      });
    });

    it('2.7-UNIT-014: should detect net vs gross amounts correctly', async () => {
      // Arrange
      const netAmount = { amount: 100, type: 'net' };
      const grossAmount = { amount: 120, type: 'gross', tax_rate: 20 };

      // Act
      const calculatedNet = ocrService.calculateNetAmount(grossAmount);
      const calculatedGross = ocrService.calculateGrossAmount(netAmount, 20);

      // Assert
      expect(calculatedNet).toBe(100);
      expect(calculatedGross).toBe(120);
    });

    it('2.7-UNIT-015: should format German currency correctly', async () => {
      // Arrange
      const amounts = [1234.56, 0, 999999.99];
      const expectedFormats = ['1.234,56 €', '0,00 €', '999.999,99 €'];

      // Act & Assert
      amounts.forEach((amount, index) => {
        const formatted = ocrService.formatGermanCurrency(amount);
        expect(formatted).toBe(expectedFormats[index]);
      });
    });

    it('2.7-UNIT-016: should parse German date formats', async () => {
      // Arrange
      const germanDates = ['30.08.2025', '01.01.2025', '31.12.2024'];
      const expectedISO = ['2025-08-30', '2025-01-01', '2024-12-31'];

      // Act & Assert
      germanDates.forEach((date, index) => {
        const parsed = ocrService.parseGermanDate(date);
        expect(parsed).toBe(expectedISO[index]);
      });
    });
  });

  describe('Error Handling & Recovery', () => {
    it('2.7-UNIT-017: should handle database connection errors', async () => {
      // Arrange
      supabase.single.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(ocrService.processDocument(mockFilePath, mockFileName, mockMimeType))
        .rejects.toThrow('Database connection failed');
    });

    it('2.7-UNIT-018: should cleanup temporary files on error', async () => {
      // Arrange
      const mockOcrProcessing = { id: 'ocr-123' };
      supabase.single.mockResolvedValue({ data: mockOcrProcessing, error: null });
      
      jest.spyOn(ocrService, 'analyzeWithAI').mockRejectedValue(new Error('AI Analysis failed'));
      jest.spyOn(ocrService, 'cleanupTempFiles').mockResolvedValue();

      // Act
      try {
        await ocrService.processDocument(mockFilePath, mockFileName, mockMimeType);
      } catch (error) {
        // Expected to throw
      }

      // Assert
      expect(ocrService.cleanupTempFiles).toHaveBeenCalled();
    });

    it('2.7-UNIT-019: should update processing status to FAILED on error', async () => {
      // Arrange
      const mockOcrProcessing = { id: 'ocr-123' };
      supabase.single.mockResolvedValue({ data: mockOcrProcessing, error: null });
      
      jest.spyOn(ocrService, 'analyzeWithAI').mockRejectedValue(new Error('Processing failed'));

      // Act
      try {
        await ocrService.processDocument(mockFilePath, mockFileName, mockMimeType);
      } catch (error) {
        // Expected to throw
      }

      // Assert
      expect(supabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'FAILED',
          error_message: expect.stringContaining('Processing failed')
        })
      );
    });

    it('2.7-UNIT-020: should handle AI API rate limiting gracefully', async () => {
      // Arrange
      const mockImagePath = '/tmp/test.jpg';
      
      jest.spyOn(ocrService, 'callOpenAI').mockRejectedValue(new Error('Rate limit exceeded'));
      jest.spyOn(ocrService, 'waitAndRetry').mockResolvedValue({
        success: true,
        data: { supplier: { name: 'Retry Success' } }
      });

      // Act
      const result = await ocrService.analyzeWithAI(mockImagePath, 'openai');

      // Assert
      expect(result.success).toBe(true);
      expect(result.analysis.supplier.name).toBe('Retry Success');
    });
  });
});
