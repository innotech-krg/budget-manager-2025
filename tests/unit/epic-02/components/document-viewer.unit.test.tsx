// =====================================================
// Budget Manager 2025 - DocumentViewer Component Unit Tests
// Epic 2 - Story 2.10: Original-Rechnungen Speicherung
// =====================================================

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import DocumentViewer from '../../../../frontend/src/components/documents/DocumentViewer';

// Mock fetch
global.fetch = vi.fn();

describe('DocumentViewer.unit', () => {
  const mockProps = {
    ocrProcessingId: 'ocr-123',
    showUpload: true,
    onDocumentUploaded: vi.fn()
  };

  const mockDocuments = [
    {
      id: 'doc-1',
      originalFilename: 'test-invoice.pdf',
      fileSize: 1024000,
      mimeType: 'application/pdf',
      version: 1,
      uploadDate: '2025-08-30T10:00:00Z',
      uploadedBy: 'test-user',
      accessCount: 5,
      lastAccessed: '2025-08-30T09:00:00Z',
      retentionUntil: '2035-08-30',
      fileHash: 'abc123def456'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful API response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          documents: mockDocuments,
          totalCount: 1
        }
      })
    });
  });

  describe('Component Rendering', () => {
    it('2.10-UNIT-021: should render loading state initially', () => {
      // Act
      render(<DocumentViewer {...mockProps} />);

      // Assert
      expect(screen.getByText('Lade Dokumente...')).toBeInTheDocument();
    });

    it('2.10-UNIT-022: should render documents after loading', async () => {
      // Act
      render(<DocumentViewer {...mockProps} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('test-invoice.pdf')).toBeInTheDocument();
      });
    });

    it('2.10-UNIT-023: should show upload button when showUpload is true', async () => {
      // Act
      render(<DocumentViewer {...mockProps} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('📤 Hochladen')).toBeInTheDocument();
      });
    });

    it('2.10-UNIT-024: should hide upload button when showUpload is false', async () => {
      // Act
      render(<DocumentViewer {...mockProps} showUpload={false} />);

      // Assert
      await waitFor(() => {
        expect(screen.queryByText('📤 Hochladen')).not.toBeInTheDocument();
      });
    });

    it('2.10-UNIT-025: should display document metadata correctly', async () => {
      // Act
      render(<DocumentViewer {...mockProps} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('test-invoice.pdf')).toBeInTheDocument();
        expect(screen.getByText('1.000,0 KB')).toBeInTheDocument(); // German number format
        expect(screen.getByText('5x aufgerufen')).toBeInTheDocument();
      });
    });
  });

  describe('Document Loading', () => {
    it('2.10-UNIT-026: should load documents by OCR processing ID', async () => {
      // Act
      render(<DocumentViewer ocrProcessingId="ocr-123" />);

      // Assert
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/documents/by-ocr/ocr-123');
      });
    });

    it('2.10-UNIT-027: should load documents by invoice ID', async () => {
      // Act
      render(<DocumentViewer invoiceId="invoice-456" />);

      // Assert
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/documents/by-invoice/invoice-456');
      });
    });

    it('2.10-UNIT-028: should load single document by ID', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: mockDocuments[0]
        })
      });

      // Act
      render(<DocumentViewer documentId="doc-123" />);

      // Assert
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/documents/doc-123/metadata');
      });
    });

    it('2.10-UNIT-029: should handle API errors gracefully', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404
      });

      // Act
      render(<DocumentViewer {...mockProps} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Dokumente nicht gefunden/)).toBeInTheDocument();
      });
    });

    it('2.10-UNIT-030: should show empty state when no documents', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            documents: [],
            totalCount: 0
          }
        })
      });

      // Act
      render(<DocumentViewer {...mockProps} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Noch keine Dokumente hochgeladen')).toBeInTheDocument();
      });
    });
  });

  describe('Document Actions', () => {
    it('2.10-UNIT-031: should handle document download', async () => {
      // Arrange
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { documents: mockDocuments } })
        })
        .mockResolvedValueOnce({
          ok: true,
          blob: () => Promise.resolve(mockBlob)
        });

      // Mock URL.createObjectURL
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();

      // Mock document.createElement and appendChild
      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn()
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor as any);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor as any);

      render(<DocumentViewer {...mockProps} />);

      // Wait for documents to load
      await waitFor(() => {
        expect(screen.getByText('test-invoice.pdf')).toBeInTheDocument();
      });

      // Act
      const downloadButton = screen.getByTitle('Dokument herunterladen');
      fireEvent.click(downloadButton);

      // Assert
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/documents/doc-1/download');
        expect(mockAnchor.click).toHaveBeenCalled();
        expect(mockAnchor.download).toBe('test-invoice.pdf');
      });
    });

    it('2.10-UNIT-032: should handle document view', async () => {
      // Arrange
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { documents: mockDocuments } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { downloadUrl: 'https://signed-url.com/doc' }
          })
        });

      // Mock window.open
      global.open = vi.fn();

      render(<DocumentViewer {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('test-invoice.pdf')).toBeInTheDocument();
      });

      // Act
      const viewButton = screen.getByTitle('Dokument anzeigen');
      fireEvent.click(viewButton);

      // Assert
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/documents/doc-1/url?expiresIn=3600');
        expect(global.open).toHaveBeenCalledWith('https://signed-url.com/doc', '_blank');
      });
    });

    it('2.10-UNIT-033: should toggle document details', async () => {
      // Act
      render(<DocumentViewer {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('test-invoice.pdf')).toBeInTheDocument();
      });

      // Act
      const detailsButton = screen.getByTitle('Details anzeigen');
      fireEvent.click(detailsButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Hochgeladen von:')).toBeInTheDocument();
        expect(screen.getByText('test-user')).toBeInTheDocument();
        expect(screen.getByText('Aufbewahrung bis:')).toBeInTheDocument();
      });
    });
  });

  describe('File Upload', () => {
    it('2.10-UNIT-034: should handle file upload successfully', async () => {
      // Arrange
      const mockFile = new File(['PDF content'], 'new-invoice.pdf', { type: 'application/pdf' });
      
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { documents: [] } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { documentId: 'new-doc-123' }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { documents: mockDocuments } })
        });

      render(<DocumentViewer {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('📤 Hochladen')).toBeInTheDocument();
      });

      // Act
      const fileInput = screen.getByRole('button', { name: /hochladen/i }).parentElement?.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      
      fireEvent.change(fileInput!, { target: { files: [mockFile] } });

      // Assert
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/documents/upload', expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData)
        }));
        expect(mockProps.onDocumentUploaded).toHaveBeenCalledWith('new-doc-123');
      });
    });

    it('2.10-UNIT-035: should handle upload errors', async () => {
      // Arrange
      const mockFile = new File(['PDF content'], 'invalid.pdf', { type: 'application/pdf' });
      
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { documents: [] } })
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({
            success: false,
            error: 'Upload fehlgeschlagen'
          })
        });

      render(<DocumentViewer {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('📤 Hochladen')).toBeInTheDocument();
      });

      // Act
      const fileInput = screen.getByRole('button', { name: /hochladen/i }).parentElement?.querySelector('input[type="file"]');
      fireEvent.change(fileInput!, { target: { files: [mockFile] } });

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Upload-Fehler: Upload fehlgeschlagen/)).toBeInTheDocument();
      });
    });

    it('2.10-UNIT-036: should show uploading state during upload', async () => {
      // Arrange
      const mockFile = new File(['PDF content'], 'test.pdf', { type: 'application/pdf' });
      
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { documents: [] } })
        })
        .mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(<DocumentViewer {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('📤 Hochladen')).toBeInTheDocument();
      });

      // Act
      const fileInput = screen.getByRole('button', { name: /hochladen/i }).parentElement?.querySelector('input[type="file"]');
      fireEvent.change(fileInput!, { target: { files: [mockFile] } });

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Uploading...')).toBeInTheDocument();
      });
    });
  });

  describe('German Formatting', () => {
    it('2.10-UNIT-037: should format file sizes in German locale', async () => {
      // Arrange
      const documentsWithSizes = [
        { ...mockDocuments[0], fileSize: 1024 }, // 1 KB
        { ...mockDocuments[0], fileSize: 1048576 }, // 1 MB
        { ...mockDocuments[0], fileSize: 1073741824 } // 1 GB
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { documents: documentsWithSizes }
        })
      });

      // Act
      render(<DocumentViewer {...mockProps} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('1 KB')).toBeInTheDocument();
        expect(screen.getByText('1 MB')).toBeInTheDocument();
        expect(screen.getByText('1 GB')).toBeInTheDocument();
      });
    });

    it('2.10-UNIT-038: should format dates in German locale', async () => {
      // Arrange
      const germanDocument = {
        ...mockDocuments[0],
        uploadDate: '2025-08-30T14:30:00Z',
        lastAccessed: '2025-08-29T09:15:00Z'
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { documents: [germanDocument] }
        })
      });

      // Act
      render(<DocumentViewer {...mockProps} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/30\.08\.2025/)).toBeInTheDocument();
        expect(screen.getByText(/14:30/)).toBeInTheDocument();
      });
    });

    it('2.10-UNIT-039: should display retention period in German format', async () => {
      // Act
      render(<DocumentViewer {...mockProps} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('30.08.2035')).toBeInTheDocument(); // German date format
      });
    });

    it('2.10-UNIT-040: should show German compliance message', async () => {
      // Act
      render(<DocumentViewer {...mockProps} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Original sicher gespeichert (10 Jahre)')).toBeInTheDocument();
      });
    });
  });
});
