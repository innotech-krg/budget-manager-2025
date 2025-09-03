// =====================================================
// Budget Manager 2025 - E-Mail-Service
// Story 1.4: Budget-Transfer-Benachrichtigungen
// =====================================================

import nodemailer from 'nodemailer';
import { toGermanCurrency } from '../config/database.js';

// =====================================================
// E-MAIL CONFIGURATION
// =====================================================

// E-Mail-Transporter konfigurieren (für Demo: Console-Output)
const createEmailTransporter = () => {
  // In Produktion: Echte SMTP-Konfiguration
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  
  // Für Demo: Console-Transporter
  return nodemailer.createTransporter({
    streamTransport: true,
    newline: 'unix',
    buffer: true
  });
};

// =====================================================
// E-MAIL TEMPLATES
// =====================================================

/**
 * E-Mail-Template für Transfer-Antrag
 */
function getTransferRequestTemplate(transfer) {
  return {
    subject: `🔄 Neuer Budget-Transfer-Antrag: ${transfer.from_project?.name} → ${transfer.to_project?.name}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Budget-Transfer-Antrag</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; }
          .footer { background: #64748b; color: white; padding: 15px; border-radius: 0 0 8px 8px; font-size: 12px; }
          .transfer-details { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .amount { font-size: 24px; font-weight: bold; color: #059669; }
          .button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 5px; }
          .button:hover { background: #1d4ed8; }
          .status-pending { color: #d97706; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Budget Manager 2025</h1>
            <h2>Neuer Budget-Transfer-Antrag</h2>
          </div>
          
          <div class="content">
            <p>Ein neuer Budget-Transfer-Antrag wurde eingereicht und wartet auf Ihre Genehmigung:</p>
            
            <div class="transfer-details">
              <h3>📋 Transfer-Details</h3>
              <p><strong>Transfer-ID:</strong> ${transfer.id}</p>
              <p><strong>Von Projekt:</strong> ${transfer.from_project?.name} (${transfer.from_project?.projektnummer})</p>
              <p><strong>Zu Projekt:</strong> ${transfer.to_project?.name} (${transfer.to_project?.projektnummer})</p>
              <p><strong>Betrag:</strong> <span class="amount">${toGermanCurrency(transfer.transfer_amount)}</span></p>
              <p><strong>Status:</strong> <span class="status-pending">🟡 Ausstehend</span></p>
              <p><strong>Antragsdatum:</strong> ${new Date(transfer.requested_at).toLocaleDateString('de-DE')}</p>
            </div>
            
            <div class="transfer-details">
              <h3>📝 Begründung</h3>
              <p><em>"${transfer.reason}"</em></p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" class="button" style="background: #059669;">✅ Genehmigen</a>
              <a href="#" class="button" style="background: #dc2626;">❌ Ablehnen</a>
              <a href="#" class="button">👁️ Details anzeigen</a>
            </div>
            
            <p><strong>⚠️ Wichtig:</strong> Dieser Transfer erfordert eine manuelle Genehmigung. Bitte prüfen Sie die Details sorgfältig.</p>
          </div>
          
          <div class="footer">
            <p>Budget Manager 2025 - Deutsche Geschäfts-Budget-Verwaltung</p>
            <p>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Budget-Transfer-Antrag

Ein neuer Budget-Transfer-Antrag wurde eingereicht:

Transfer-ID: ${transfer.id}
Von Projekt: ${transfer.from_project?.name} (${transfer.from_project?.projektnummer})
Zu Projekt: ${transfer.to_project?.name} (${transfer.to_project?.projektnummer})
Betrag: ${toGermanCurrency(transfer.transfer_amount)}
Status: Ausstehend
Antragsdatum: ${new Date(transfer.requested_at).toLocaleDateString('de-DE')}

Begründung: "${transfer.reason}"

Bitte loggen Sie sich in das Budget Manager System ein, um den Antrag zu bearbeiten.

Budget Manager 2025 - Deutsche Geschäfts-Budget-Verwaltung
    `
  };
}

/**
 * E-Mail-Template für Transfer-Genehmigung
 */
function getTransferApprovedTemplate(transfer) {
  return {
    subject: `✅ Budget-Transfer genehmigt: ${toGermanCurrency(transfer.transfer_amount)}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Budget-Transfer genehmigt</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f0fdf4; padding: 20px; border: 1px solid #bbf7d0; }
          .footer { background: #64748b; color: white; padding: 15px; border-radius: 0 0 8px 8px; font-size: 12px; }
          .transfer-details { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .amount { font-size: 24px; font-weight: bold; color: #059669; }
          .status-approved { color: #059669; font-weight: bold; }
          .success-icon { font-size: 48px; text-align: center; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Budget Manager 2025</h1>
            <h2>Budget-Transfer genehmigt</h2>
          </div>
          
          <div class="content">
            <div class="success-icon">🎉</div>
            <p>Ihr Budget-Transfer-Antrag wurde <strong>genehmigt</strong> und erfolgreich ausgeführt!</p>
            
            <div class="transfer-details">
              <h3>📋 Transfer-Details</h3>
              <p><strong>Transfer-ID:</strong> ${transfer.id}</p>
              <p><strong>Von Projekt:</strong> ${transfer.from_project?.name} (${transfer.from_project?.projektnummer})</p>
              <p><strong>Zu Projekt:</strong> ${transfer.to_project?.name} (${transfer.to_project?.projektnummer})</p>
              <p><strong>Betrag:</strong> <span class="amount">${toGermanCurrency(transfer.transfer_amount)}</span></p>
              <p><strong>Status:</strong> <span class="status-approved">🟢 Genehmigt & Ausgeführt</span></p>
              <p><strong>Genehmigt am:</strong> ${new Date(transfer.reviewed_at).toLocaleDateString('de-DE')}</p>
              ${transfer.executed_at ? `<p><strong>Ausgeführt am:</strong> ${new Date(transfer.executed_at).toLocaleDateString('de-DE')}</p>` : ''}
            </div>
            
            ${transfer.review_comment ? `
            <div class="transfer-details">
              <h3>💬 Kommentar des Genehmigers</h3>
              <p><em>"${transfer.review_comment}"</em></p>
            </div>
            ` : ''}
            
            <p><strong>✅ Das Budget wurde erfolgreich zwischen den Projekten transferiert.</strong></p>
          </div>
          
          <div class="footer">
            <p>Budget Manager 2025 - Deutsche Geschäfts-Budget-Verwaltung</p>
            <p>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Budget-Transfer genehmigt

Ihr Budget-Transfer-Antrag wurde genehmigt und erfolgreich ausgeführt!

Transfer-ID: ${transfer.id}
Von Projekt: ${transfer.from_project?.name} (${transfer.from_project?.projektnummer})
Zu Projekt: ${transfer.to_project?.name} (${transfer.to_project?.projektnummer})
Betrag: ${toGermanCurrency(transfer.transfer_amount)}
Status: Genehmigt & Ausgeführt
Genehmigt am: ${new Date(transfer.reviewed_at).toLocaleDateString('de-DE')}
${transfer.executed_at ? `Ausgeführt am: ${new Date(transfer.executed_at).toLocaleDateString('de-DE')}` : ''}

${transfer.review_comment ? `Kommentar: "${transfer.review_comment}"` : ''}

Das Budget wurde erfolgreich zwischen den Projekten transferiert.

Budget Manager 2025 - Deutsche Geschäfts-Budget-Verwaltung
    `
  };
}

/**
 * E-Mail-Template für Transfer-Ablehnung
 */
function getTransferRejectedTemplate(transfer) {
  return {
    subject: `❌ Budget-Transfer abgelehnt: ${toGermanCurrency(transfer.transfer_amount)}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Budget-Transfer abgelehnt</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #fef2f2; padding: 20px; border: 1px solid #fecaca; }
          .footer { background: #64748b; color: white; padding: 15px; border-radius: 0 0 8px 8px; font-size: 12px; }
          .transfer-details { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .amount { font-size: 24px; font-weight: bold; color: #dc2626; }
          .status-rejected { color: #dc2626; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Budget Manager 2025</h1>
            <h2>Budget-Transfer abgelehnt</h2>
          </div>
          
          <div class="content">
            <p>Ihr Budget-Transfer-Antrag wurde <strong>abgelehnt</strong>.</p>
            
            <div class="transfer-details">
              <h3>📋 Transfer-Details</h3>
              <p><strong>Transfer-ID:</strong> ${transfer.id}</p>
              <p><strong>Von Projekt:</strong> ${transfer.from_project?.name} (${transfer.from_project?.projektnummer})</p>
              <p><strong>Zu Projekt:</strong> ${transfer.to_project?.name} (${transfer.to_project?.projektnummer})</p>
              <p><strong>Betrag:</strong> <span class="amount">${toGermanCurrency(transfer.transfer_amount)}</span></p>
              <p><strong>Status:</strong> <span class="status-rejected">🔴 Abgelehnt</span></p>
              <p><strong>Abgelehnt am:</strong> ${new Date(transfer.reviewed_at).toLocaleDateString('de-DE')}</p>
            </div>
            
            ${transfer.review_comment ? `
            <div class="transfer-details">
              <h3>💬 Ablehnungsgrund</h3>
              <p><em>"${transfer.review_comment}"</em></p>
            </div>
            ` : ''}
            
            <p>Sie können bei Bedarf einen neuen Transfer-Antrag mit angepassten Parametern stellen.</p>
          </div>
          
          <div class="footer">
            <p>Budget Manager 2025 - Deutsche Geschäfts-Budget-Verwaltung</p>
            <p>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Budget-Transfer abgelehnt

Ihr Budget-Transfer-Antrag wurde abgelehnt.

Transfer-ID: ${transfer.id}
Von Projekt: ${transfer.from_project?.name} (${transfer.from_project?.projektnummer})
Zu Projekt: ${transfer.to_project?.name} (${transfer.to_project?.projektnummer})
Betrag: ${toGermanCurrency(transfer.transfer_amount)}
Status: Abgelehnt
Abgelehnt am: ${new Date(transfer.reviewed_at).toLocaleDateString('de-DE')}

${transfer.review_comment ? `Ablehnungsgrund: "${transfer.review_comment}"` : ''}

Sie können bei Bedarf einen neuen Transfer-Antrag mit angepassten Parametern stellen.

Budget Manager 2025 - Deutsche Geschäfts-Budget-Verwaltung
    `
  };
}

// =====================================================
// E-MAIL SENDING FUNCTIONS
// =====================================================

/**
 * Sende Transfer-Benachrichtigungs-E-Mail
 * Story 1.4 - E-Mail-Benachrichtigungen
 */
export const sendTransferNotificationEmail = async ({ type, transfer, recipient }) => {
  try {
    const transporter = createEmailTransporter();
    
    let emailTemplate;
    
    // Wähle Template basierend auf Typ
    switch (type) {
      case 'TRANSFER_REQUESTED':
        emailTemplate = getTransferRequestTemplate(transfer);
        break;
      case 'TRANSFER_APPROVED':
        emailTemplate = getTransferApprovedTemplate(transfer);
        break;
      case 'TRANSFER_REJECTED':
        emailTemplate = getTransferRejectedTemplate(transfer);
        break;
      default:
        throw new Error(`Unbekannter E-Mail-Typ: ${type}`);
    }
    
    const mailOptions = {
      from: process.env.SMTP_FROM || 'budget-manager@company.com',
      to: recipient,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text
    };
    
    // E-Mail senden
    const result = await transporter.sendMail(mailOptions);
    
    // Für Demo: Log in Console
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n📧 E-MAIL-BENACHRICHTIGUNG GESENDET:');
      console.log('='.repeat(50));
      console.log(`An: ${recipient}`);
      console.log(`Betreff: ${emailTemplate.subject}`);
      console.log(`Typ: ${type}`);
      console.log(`Transfer-ID: ${transfer.id}`);
      console.log('='.repeat(50));
      console.log(emailTemplate.text);
      console.log('='.repeat(50));
    }
    
    return {
      success: true,
      messageId: result.messageId,
      type,
      recipient
    };
    
  } catch (error) {
    console.error('❌ E-Mail-Versand fehlgeschlagen:', error);
    
    return {
      success: false,
      error: error.message,
      type,
      recipient
    };
  }
};

/**
 * Sende Batch-E-Mails für mehrere Empfänger
 */
export const sendBatchTransferNotifications = async (notifications) => {
  const results = [];
  
  for (const notification of notifications) {
    const result = await sendTransferNotificationEmail(notification);
    results.push(result);
    
    // Kurze Pause zwischen E-Mails um Rate-Limiting zu vermeiden
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
};

/**
 * E-Mail-Template testen (für Entwicklung)
 */
export const testEmailTemplate = async (type, sampleData) => {
  try {
    const sampleTransfer = {
      id: 'test-transfer-123',
      from_project: { name: 'Website Redesign', projektnummer: 'WD-2025-001' },
      to_project: { name: 'Marketing Kampagne', projektnummer: 'WD-2025-002' },
      transfer_amount: 15000,
      reason: 'Budget-Umschichtung aufgrund geänderter Prioritäten',
      requested_at: new Date().toISOString(),
      reviewed_at: new Date().toISOString(),
      executed_at: new Date().toISOString(),
      review_comment: 'Genehmigt nach Rücksprache mit Projektleitung',
      ...sampleData
    };
    
    let template;
    switch (type) {
      case 'TRANSFER_REQUESTED':
        template = getTransferRequestTemplate(sampleTransfer);
        break;
      case 'TRANSFER_APPROVED':
        template = getTransferApprovedTemplate(sampleTransfer);
        break;
      case 'TRANSFER_REJECTED':
        template = getTransferRejectedTemplate(sampleTransfer);
        break;
      default:
        throw new Error(`Unbekannter Template-Typ: ${type}`);
    }
    
    console.log('\n📧 E-MAIL-TEMPLATE TEST:');
    console.log('='.repeat(50));
    console.log(`Typ: ${type}`);
    console.log(`Betreff: ${template.subject}`);
    console.log('='.repeat(50));
    console.log(template.text);
    console.log('='.repeat(50));
    
    return template;
    
  } catch (error) {
    console.error('❌ Template-Test fehlgeschlagen:', error);
    throw error;
  }
};

export default {
  sendTransferNotificationEmail,
  sendBatchTransferNotifications,
  testEmailTemplate
};

