/**
 * PDF-zu-Bild-Konverter-Service
 * Konvertiert PDFs zu Bildern für KI-Analyse
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

class PDFConverterService {
  constructor() {
    this.tempDir = path.join(__dirname, '../../temp/pdf-conversion');
    this.ensureTempDir();
  }

  async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Fehler beim Erstellen des Temp-Verzeichnisses:', error);
    }
  }

  /**
   * Konvertiert PDF zu Bild(ern) mit ImageMagick
   * @param {string} pdfPath - Pfad zur PDF-Datei
   * @param {Object} options - Konvertierungsoptionen
   * @returns {Promise<Array>} Array von Bild-Pfaden
   */
  async convertPdfToImages(pdfPath, options = {}) {
    const timestamp = Date.now();
    const outputPath = path.join(this.tempDir, `pdf_${timestamp}.jpg`);

    try {
      console.log(`📄 Konvertiere PDF zu Bild: ${path.basename(pdfPath)}`);
      
      // ImageMagick magick command - nur erste Seite, hohe Qualität
      const command = `magick -density 300 -quality 95 "${pdfPath}[0]" "${outputPath}"`;
      
      console.log(`🔧 Führe aus: ${command}`);
      
      // Führe Konvertierung aus mit Timeout
      const { stdout, stderr } = await execAsync(command, { 
        timeout: 30000 // 30 Sekunden Timeout
      });
      
      if (stderr && !stderr.includes('Warning')) {
        console.warn('⚠️ ImageMagick Warnung:', stderr);
      }
      
      // Prüfe ob Datei erstellt wurde
      try {
        await fs.access(outputPath);
        console.log(`✅ PDF erfolgreich konvertiert: ${path.basename(outputPath)}`);
        return [outputPath];
      } catch (accessError) {
        throw new Error('Konvertierte Datei wurde nicht gefunden');
      }
      
    } catch (error) {
      console.error('❌ Fehler bei PDF-Konvertierung:', error);
      
      // Cleanup bei Fehler
      try {
        await fs.unlink(outputPath);
      } catch (cleanupError) {
        // Ignoriere Cleanup-Fehler
      }
      
      throw new Error(`PDF-Konvertierung fehlgeschlagen: ${error.message}`);
    }
  }

  /**
   * Konvertiert PDF zur ersten Seite als Bild (für OCR)
   * @param {string} pdfPath - Pfad zur PDF-Datei
   * @returns {Promise<string>} Pfad zum ersten Bild
   */
  async convertPdfToFirstPageImage(pdfPath) {
    try {
      const imagePaths = await this.convertPdfToImages(pdfPath);
      return imagePaths[0]; // Erste (und einzige) Seite
    } catch (error) {
      console.error('❌ Fehler bei PDF-zu-Bild-Konvertierung:', error);
      throw error;
    }
  }

  /**
   * Konvertiert Bild zu Base64 für KI-APIs
   * @param {string} imagePath - Pfad zum Bild
   * @returns {Promise<Object>} Base64-Daten und MIME-Type
   */
  async imageToBase64(imagePath) {
    try {
      const imageBuffer = await fs.readFile(imagePath);
      const base64Data = imageBuffer.toString('base64');
      const mimeType = 'image/jpeg'; // Da wir immer JPEG konvertieren
      
      return {
        base64Data,
        mimeType
      };
    } catch (error) {
      console.error('❌ Fehler bei Base64-Konvertierung:', error);
      throw new Error(`Base64-Konvertierung fehlgeschlagen: ${error.message}`);
    }
  }

  /**
   * Vollständige PDF-zu-Base64-Konvertierung für KI-Analyse
   * @param {string} pdfPath - Pfad zur PDF-Datei
   * @returns {Promise<Object>} Base64-Daten und MIME-Type
   */
  async convertPdfToBase64(pdfPath) {
    let tempImagePath = null;
    
    try {
      // 1. PDF zur ersten Seite als Bild konvertieren
      tempImagePath = await this.convertPdfToFirstPageImage(pdfPath);
      
      // 2. Bild zu Base64 konvertieren
      const result = await this.imageToBase64(tempImagePath);
      
      console.log(`✅ PDF erfolgreich zu Base64 konvertiert: ${path.basename(pdfPath)}`);
      return result;
      
    } catch (error) {
      console.error('❌ Fehler bei PDF-zu-Base64-Konvertierung:', error);
      throw error;
    } finally {
      // Temporäres Bild löschen
      if (tempImagePath) {
        try {
          await fs.unlink(tempImagePath);
          console.log(`🗑️ Temporäres Bild gelöscht: ${path.basename(tempImagePath)}`);
        } catch (cleanupError) {
          console.warn('⚠️ Warnung: Temporäres Bild konnte nicht gelöscht werden:', cleanupError.message);
        }
      }
    }
  }

  /**
   * Bereinigt alte temporäre Dateien
   * @param {number} maxAgeHours - Maximales Alter in Stunden (Standard: 24h)
   */
  async cleanupTempFiles(maxAgeHours = 24) {
    try {
      const files = await fs.readdir(this.tempDir);
      const maxAge = maxAgeHours * 60 * 60 * 1000; // In Millisekunden
      const now = Date.now();
      
      let deletedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }
      
      if (deletedCount > 0) {
        console.log(`🗑️ ${deletedCount} alte temporäre Dateien gelöscht`);
      }
    } catch (error) {
      console.warn('⚠️ Warnung bei Temp-Datei-Bereinigung:', error.message);
    }
  }

  /**
   * Prüft, ob eine Datei eine PDF ist
   * @param {string} filePath - Pfad zur Datei
   * @param {string} mimeType - MIME-Type der Datei
   * @returns {boolean} True wenn PDF
   */
  isPdf(filePath, mimeType) {
    return mimeType === 'application/pdf' || 
           path.extname(filePath).toLowerCase() === '.pdf';
  }
}

export default PDFConverterService;
