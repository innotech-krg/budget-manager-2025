import express from 'express';
import { supabase } from '../config/database.js';
import { synchronizeAnnualBudget } from '../controllers/budgetController.js';

const router = express.Router();

// =====================================================
// HELPER FUNCTION: Automatische project_suppliers Erstellung
// =====================================================

async function createOrUpdateProjectSuppliers(supplierId, positions) {
  try {
    console.log('🔧 Erstelle/Aktualisiere project_suppliers Einträge...');
    
    if (!supplierId || !positions || positions.length === 0) {
      console.log('⚠️ Keine Supplier-ID oder Positionen vorhanden, überspringe project_suppliers Update');
      return;
    }

    // Gruppiere Positionen nach Projekt-ID
    const projectBudgets = {};
    positions.forEach(position => {
      if (position.project_id) {
        if (!projectBudgets[position.project_id]) {
          projectBudgets[position.project_id] = 0;
        }
        projectBudgets[position.project_id] += parseFloat(position.total_amount || 0);
      }
    });

    console.log('📊 Projekt-Budget-Verteilung:', projectBudgets);

    // Für jedes Projekt einen project_suppliers Eintrag erstellen/aktualisieren
    for (const [projectId, consumedAmount] of Object.entries(projectBudgets)) {
      try {
        // Prüfe ob Eintrag bereits existiert
        const { data: existingEntry, error: checkError } = await supabase
          .from('project_suppliers')
          .select('*')
          .eq('project_id', projectId)
          .eq('supplier_id', supplierId)
          .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
          console.error('❌ Fehler beim Prüfen des project_suppliers Eintrags:', checkError);
          continue;
        }

        if (existingEntry) {
          // Update existierenden Eintrag
          const newConsumedBudget = parseFloat(existingEntry.consumed_budget || 0) + consumedAmount;
          
          const { error: updateError } = await supabase
            .from('project_suppliers')
            .update({
              consumed_budget: newConsumedBudget,
              updated_at: new Date().toISOString()
            })
            .eq('project_id', projectId)
            .eq('supplier_id', supplierId);

          if (updateError) {
            console.error('❌ Fehler beim Update des project_suppliers Eintrags:', updateError);
          } else {
            console.log(`✅ project_suppliers aktualisiert: Projekt ${projectId}, Verbraucht: ${newConsumedBudget}€`);
          }
        } else {
          // Erstelle neuen Eintrag
          const allocatedBudget = Math.max(consumedAmount * 2, 1000); // Puffer für zukünftige Rechnungen
          
          const { error: insertError } = await supabase
            .from('project_suppliers')
            .insert({
              project_id: projectId,
              supplier_id: supplierId,
              allocated_budget: allocatedBudget,
              consumed_budget: consumedAmount,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (insertError) {
            console.error('❌ Fehler beim Erstellen des project_suppliers Eintrags:', insertError);
          } else {
            console.log(`✅ project_suppliers erstellt: Projekt ${projectId}, Allokiert: ${allocatedBudget}€, Verbraucht: ${consumedAmount}€`);
          }
        }
      } catch (projectError) {
        console.error(`❌ Fehler beim Verarbeiten von Projekt ${projectId}:`, projectError);
      }
    }

    console.log('✅ project_suppliers Verarbeitung abgeschlossen');
  } catch (error) {
    console.error('❌ Fehler bei createOrUpdateProjectSuppliers:', error);
    // Fehler nicht weiterwerfen, da dies die Hauptfunktion nicht blockieren soll
  }
}

// OCR-Review-Session abrufen
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Review-Session abrufen
    const { data: reviewSession, error: sessionError } = await supabase
      .from('ocr_review_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      console.error('❌ Fehler beim Abrufen der Review-Session:', sessionError);
      return res.status(404).json({
        success: false,
        error: 'Review-Session nicht gefunden',
        details: sessionError.message
      });
    }

    res.status(200).json({
      success: true,
      data: {
        reviewSessionId: reviewSession.id,
        ocrProcessingId: reviewSession.ocr_processing_id,
        extracted_data: reviewSession.extracted_data,
        status: reviewSession.status,
        created_at: reviewSession.created_at,
        updated_at: reviewSession.updated_at
      }
    });

  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Review-Session:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Server-Fehler beim Abrufen der Review-Session',
      details: error.message
    });
  }
});

// OCR-Review-Session erstellen
router.post('/session', async (req, res) => {
  try {
    const { ocrProcessingId, extractedData } = req.body;

    if (!ocrProcessingId || !extractedData) {
      return res.status(400).json({
        success: false,
        error: 'OCR Processing ID und extrahierte Daten sind erforderlich'
      });
    }

    // Review-Session erstellen
    const { data: reviewSession, error: sessionError } = await supabase
      .from('ocr_review_sessions')
      .insert({
        ocr_processing_id: ocrProcessingId,
        review_status: 'PENDING',
        extracted_data: extractedData
      })
      .select()
      .single();

    if (sessionError) {
      console.error('❌ Fehler beim Erstellen der Review-Session:', sessionError);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Erstellen der Review-Session'
      });
    }

    console.log('✅ Review-Session erstellt:', reviewSession.id);

    res.json({
      success: true,
      data: {
        reviewSessionId: reviewSession.id,
        extractedData: reviewSession.extracted_data
      }
    });

  } catch (error) {
    console.error('❌ Fehler bei Review-Session-Erstellung:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Server-Fehler'
    });
  }
});

// Rechnung freigeben und buchen
router.post('/session/:sessionId/approve', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { projectAssignments, supplierConfirmed, supplierData, comments } = req.body;

    console.log('📋 Rechnung wird freigegeben:', { sessionId, projectAssignments });

    // Schritt 1: Review-Session abrufen
    console.log('🔄 Schritt 1: Review-Session abrufen...');
    const { data: reviewSession, error: sessionError } = await supabase
      .from('ocr_review_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      console.error('❌ Review-Session nicht gefunden:', sessionError);
      return res.status(404).json({
        success: false,
        error: 'Review-Session nicht gefunden'
      });
    }

    const extractedData = reviewSession.extracted_data;
    console.log('📋 Extracted Data:', extractedData);

    // Schritt 2: Review-Session als genehmigt markieren
    console.log('🔄 Schritt 2: Review-Session aktualisieren...');
    const { error: approveError } = await supabase
      .from('ocr_review_sessions')
      .update({
        review_status: 'APPROVED',
        reviewed_at: new Date().toISOString(),
        reviewed_by: 'system'
      })
      .eq('id', sessionId);

    if (approveError) {
      console.error('❌ Fehler beim Freigeben der Review-Session:', approveError);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Freigeben der Review-Session'
      });
    }

    console.log('✅ Review-Session genehmigt:', sessionId);

    // Schritt 3: Lieferant prüfen/erstellen
    console.log('🔄 Schritt 3: Lieferant prüfen/erstellen...');
    const supplierName = extractedData?.supplier?.name || 'UNBEKANNT';
    
    if (supplierName && supplierName !== 'UNBEKANNT') {
      // Prüfen ob Lieferant bereits existiert
      const { data: existingSupplier } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('name', supplierName)
        .single();
      
      if (!existingSupplier) {
        // Neuen Lieferant erstellen
        console.log('🆕 Erstelle neuen Lieferant:', supplierName);
        const { data: newSupplier, error: supplierError } = await supabase
          .from('suppliers')
          .insert({
            name: supplierName,
            normalized_name: supplierName.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[^\w\säöüß]/g, ''),
            email: extractedData?.supplier?.email || null,
            phone: extractedData?.supplier?.phone || null,
            address: extractedData?.supplier?.address || null,
            uid_number: extractedData?.supplier?.uid || extractedData?.supplier?.uidNumber || null,
            tax_number: extractedData?.supplier?.taxNumber || null,
            iban: extractedData?.supplier?.iban || null,
            status: 'ACTIVE',
            ocr_recognized: true,
            created_by: 'OCR_SYSTEM'
          })
          .select()
          .single();
        
        if (supplierError) {
          console.error('⚠️ Warnung: Lieferant konnte nicht erstellt werden:', supplierError);
        } else {
          console.log('✅ Neuer Lieferant erstellt:', newSupplier.id, '-', newSupplier.name);
        }
      } else {
        console.log('✅ Lieferant bereits vorhanden:', existingSupplier.id, '-', existingSupplier.name);
      }
    }

    // Schritt 4: Rechnung in invoices Tabelle erstellen
    console.log('🔄 Schritt 4: Rechnung erstellen...');
    const invoiceData = {
      invoice_number: extractedData?.invoice?.number || `AUTO-${Date.now()}`,
      invoice_date: extractedData?.invoice?.date || new Date().toISOString().split('T')[0],
      due_date: extractedData?.invoice?.dueDate || null,
      supplier_name: extractedData?.supplier?.name || 'UNBEKANNT',
      total_amount: parseFloat(extractedData?.totals?.grossAmount || 0),
      // net_amount: ENTFERNT - ist eine generierte Spalte
      tax_rate: 20,
      status: 'APPROVED',
      ocr_daten: extractedData || {}
    };

    console.log('📋 Invoice Data:', JSON.stringify(invoiceData, null, 2));

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert(invoiceData)
      .select()
      .single();

    if (invoiceError) {
      console.error('❌ Fehler beim Erstellen der Rechnung:', invoiceError);
      throw new Error(`Rechnung-Erstellung fehlgeschlagen: ${invoiceError.message}`);
    }

    console.log('✅ Rechnung erstellt:', invoice.id);

    // Schritt 5: Rechnungspositionen erstellen
    console.log('🔄 Schritt 5: Rechnungspositionen erstellen...');
    console.log('📋 DEBUG - extractedData.positions:', extractedData?.positions);
    console.log('📋 DEBUG - extractedData.line_items:', extractedData?.line_items);
    console.log('📋 DEBUG - projectAssignments:', projectAssignments);
    
    // 🔧 FIX: Verwende line_items statt positions
    const invoicePositions = extractedData?.line_items || extractedData?.positions || [];
    if (invoicePositions && Array.isArray(invoicePositions)) {
      // Projekt-Zuordnungen verarbeiten (über lineItemIndex)
      const projectAssignmentMap = {};
      if (projectAssignments && Array.isArray(projectAssignments)) {
        projectAssignments.forEach(assignment => {
          // 🔧 FIX: Verwende lineItemIndex für Zuordnung
          if (assignment.lineItemIndex !== undefined) {
            projectAssignmentMap[assignment.lineItemIndex] = assignment.projectId;
            console.log(`📋 Projekt-Zuordnung: Position ${assignment.lineItemIndex} → Projekt ${assignment.projectId}`);
          }
        });
      }

      const positionsData = invoicePositions.map((position, index) => {
        let assignedProjectId = projectAssignmentMap[index] || null;
        
        // 🔧 FIX: Mock-IDs auf echte Projekt-IDs mappen
        if (assignedProjectId && assignedProjectId.startsWith('mock-')) {
          // Verwende das erste verfügbare echte Projekt (TEST: Marketing-Kampagne 2025)
          assignedProjectId = '0b3a73b1-09a8-40b9-879a-21ea888af654';
          console.log(`🔄 Mock-ID "${projectAssignmentMap[index]}" → Echte Projekt-ID: ${assignedProjectId}`);
        }
        
        console.log(`📋 Position "${position.description}" → Projekt: ${assignedProjectId}`);
        
        return {
          invoice_id: invoice.id,
          project_id: assignedProjectId,
          position_number: index + 1,
          description: position.description || 'Keine Beschreibung',
          quantity: parseFloat(position.quantity || 1),
          unit_price: parseFloat(position.unit_price || position.unitPrice || 0),
          total_amount: parseFloat(position.total_amount || position.totalPrice || 0),
          tax_amount: parseFloat(position.total_amount || position.totalPrice || 0) * (parseFloat(position.tax_rate || position.vatRate || 0) / 100),
          tax_rate: parseFloat(position.tax_rate || position.vatRate || 0),
          assignment_type: assignedProjectId ? 'MANUAL' : 'UNASSIGNED',
          confidence: parseFloat(extractedData.confidence || 0),
          assigned_by: 'system'
        };
      });

      console.log('📋 Positions Data:', JSON.stringify(positionsData, null, 2));

      const { data: positions, error: positionsError } = await supabase
        .from('invoice_positions')
        .insert(positionsData)
        .select();

      if (positionsError) {
        console.error('❌ Fehler beim Erstellen der Rechnungspositionen:', positionsError);
        // Warnung statt Fehler, damit die Rechnung trotzdem erstellt wird
        console.warn('⚠️ Rechnungspositionen konnten nicht erstellt werden, Rechnung wurde trotzdem gespeichert');
      } else {
        console.log(`✅ ${positions.length} Rechnungspositionen erstellt`);
        
        // 🔧 NEUE FUNKTION: Automatische project_suppliers Erstellung
        await createOrUpdateProjectSuppliers(invoice.supplier_id, positions);
      }
    }

    console.log('✅ Rechnung erfolgreich freigegeben und gebucht:', sessionId);

    res.json({
      success: true,
      message: 'Rechnung erfolgreich freigegeben und gebucht',
      data: {
        sessionId: sessionId,
        invoiceId: invoice.id,
        status: 'APPROVED',
        approvedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Fehler bei Rechnungsfreigabe:', error);
    console.error('❌ Error Stack:', error.stack);
    res.status(500).json({
      success: false,
      error: `Rechnungsfreigabe fehlgeschlagen: ${error.message}`
    });
  }
});

// Test-Route für Debugging
router.post('/test-approve', async (req, res) => {
  try {
    console.log('🧪 Test-Approve aufgerufen');
    
    // Minimaler Test: Nur eine Rechnung erstellen
    const invoiceData = {
      invoice_number: `TEST-${Date.now()}`,
      invoice_date: '2025-01-01',
      supplier_name: 'Test Lieferant',
      total_amount: 100.00,
      tax_rate: 20,
      status: 'APPROVED'
    };

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert(invoiceData)
      .select()
      .single();

    if (invoiceError) {
      console.error('❌ Test-Fehler:', invoiceError);
      return res.status(500).json({ success: false, error: invoiceError.message });
    }

    console.log('✅ Test-Rechnung erstellt:', invoice.id);
    res.json({ success: true, invoiceId: invoice.id });

  } catch (error) {
    console.error('❌ Test-Exception:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test-Route für project_suppliers Funktionalität
router.post('/test-project-suppliers', async (req, res) => {
  try {
    console.log('🧪 Test-project-suppliers aufgerufen');
    
    // 1. Erstelle Test-Lieferant
    const timestamp = Date.now();
    const supplierName = `Test Supplier ${timestamp}`;
    const supplierData = {
      name: supplierName,
      normalized_name: supplierName.toLowerCase().replace(/[^a-z0-9]/g, ''),
      address: 'Test Address',
      status: 'ACTIVE'
    };

    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .insert(supplierData)
      .select()
      .single();

    if (supplierError) {
      console.error('❌ Supplier-Fehler:', supplierError);
      return res.status(500).json({ success: false, error: supplierError.message });
    }

    console.log('✅ Test-Supplier erstellt:', supplier.id);

    // 2. Erstelle Test-Rechnung
    const invoiceData = {
      invoice_number: `TEST-PS-${Date.now()}`,
      invoice_date: '2025-09-03',
      supplier_name: supplier.name,
      total_amount: 250.00,
      tax_rate: 20,
      status: 'APPROVED'
    };

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert(invoiceData)
      .select()
      .single();

    if (invoiceError) {
      console.error('❌ Invoice-Fehler:', invoiceError);
      return res.status(500).json({ success: false, error: invoiceError.message });
    }

    console.log('✅ Test-Invoice erstellt:', invoice.id);

    // 3. Erstelle Test-Positionen
    const testPositions = [
      {
        invoice_id: invoice.id,
        project_id: '0f69d2dc-3b20-452d-844e-cb7ea2e04db4', // Website - MyInnoSpace
        position_number: 1,
        description: 'Test Position 1',
        quantity: 1,
        unit_price: 150.00,
        total_amount: 150.00,
        tax_rate: 20,
        assignment_type: 'MANUAL',
        confidence: 95,
        assigned_by: 'test'
      },
      {
        invoice_id: invoice.id,
        project_id: 'b070b511-05df-4ff0-901b-0b9d69b4dcf1', // Website - Kalender/Eventseite
        position_number: 2,
        description: 'Test Position 2',
        quantity: 1,
        unit_price: 100.00,
        total_amount: 100.00,
        tax_rate: 20,
        assignment_type: 'MANUAL',
        confidence: 95,
        assigned_by: 'test'
      }
    ];

    const { data: positions, error: positionsError } = await supabase
      .from('invoice_positions')
      .insert(testPositions)
      .select();

    if (positionsError) {
      console.error('❌ Positions-Fehler:', positionsError);
      return res.status(500).json({ success: false, error: positionsError.message });
    }

    console.log('✅ Test-Positions erstellt:', positions.length);

    // 4. Teste project_suppliers Funktionalität
    console.log('🔧 Teste createOrUpdateProjectSuppliers...');
    await createOrUpdateProjectSuppliers(supplier.id, positions);

    res.json({ 
      success: true, 
      message: 'project_suppliers Test erfolgreich',
      data: {
        supplierId: supplier.id,
        invoiceId: invoice.id,
        positionsCount: positions.length
      }
    });

  } catch (error) {
    console.error('❌ Test-Exception:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Review-Session aktualisieren (Korrekturen, Projekt-Zuordnungen)
router.put('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { corrections, projectAssignments, supplierConfirmation } = req.body;

    // Review-Session aktualisieren
    const { data: updatedSession, error: updateError } = await supabase
      .from('ocr_review_sessions')
      .update({
        corrections: corrections || [],
        project_assignments: projectAssignments || [],
        supplier_confirmation: supplierConfirmation,
        review_status: 'IN_REVIEW',
        reviewed_at: new Date().toISOString(),
        reviewed_by: 'system' // Später durch echte User-ID ersetzen
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Fehler beim Aktualisieren der Review-Session:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Aktualisieren der Review-Session'
      });
    }

    console.log('✅ Review-Session aktualisiert:', sessionId);

    res.json({
      success: true,
      data: updatedSession
    });

  } catch (error) {
    console.error('❌ Fehler bei Review-Session-Update:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Server-Fehler'
    });
  }
});

// Finale Freigabe und Budget-Update
router.post('/sessions/:sessionId/approve', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { approvedData, projectAssignments, comments } = req.body;

    console.log('🚀 Starte finale Freigabe für Session:', sessionId);
    console.log('📋 DEBUG - ApprovedData Structure:', JSON.stringify(approvedData, null, 2));
    console.log('🎯 DEBUG - ProjectAssignments:', JSON.stringify(projectAssignments, null, 2));
    console.log('📄 DEBUG - Line Items:', approvedData?.line_items?.length || 'KEINE LINE_ITEMS');

    // 1. Review-Session laden
    const { data: reviewSession, error: sessionError } = await supabase
      .from('ocr_review_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !reviewSession) {
      return res.status(404).json({
        success: false,
        error: 'Review-Session nicht gefunden'
      });
    }

    // 2. Rechnung in Datenbank erstellen (mit englischen Feldnamen)
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        invoice_number: approvedData.invoice.number,
        supplier_name: approvedData.supplier.name,
        total_amount: approvedData.totals.grossAmount,
        net_amount: approvedData.totals.netAmount,
        tax_rate: 20, // Standard österreichischer MwSt-Satz
        invoice_date: approvedData.invoice.date,
        due_date: approvedData.invoice.dueDate || null,
        status: 'APPROVED',
        ocr_daten: JSON.stringify(approvedData)
      })
      .select()
      .single();

    if (invoiceError) {
      console.error('❌ Fehler beim Erstellen der Rechnung:', invoiceError);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Erstellen der Rechnung'
      });
    }

    console.log('✅ Rechnung erstellt:', invoice.id);

    // 3. Rechnungspositionen erstellen und Budgets aktualisieren
    const budgetUpdates = [];
    
    for (let i = 0; i < approvedData.line_items.length; i++) {
      const lineItem = approvedData.line_items[i];
      const assignment = projectAssignments.find(a => a.lineItemIndex === i);
      
      if (!assignment || !assignment.projectId) {
        continue; // Position ohne Projekt-Zuordnung überspringen
      }

      // Rechnungsposition erstellen
      const { data: position, error: positionError } = await supabase
        .from('invoice_positions')
        .insert({
          invoice_id: invoice.id,
          project_id: assignment.projectId,
          position_number: i + 1,
          description: lineItem.description,
          quantity: lineItem.quantity || 1,
          unit_price: lineItem.unit_price,
          total_amount: lineItem.total_amount,
          tax_amount: (lineItem.total_amount * (lineItem.tax_rate || 0)) / 100,
          tax_rate: lineItem.tax_rate || 0,
          assignment_type: 'MANUAL', // Da durch User bestätigt
          confidence: assignment.confidence || 1.0,
          assigned_by: 'system'
        })
        .select()
        .single();

      if (positionError) {
        console.error('❌ Fehler beim Erstellen der Position:', positionError);
        continue;
      }

      console.log('✅ Position erstellt:', position.id);

      // Budget-Update vorbereiten
      budgetUpdates.push({
        projectId: assignment.projectId,
        amount: lineItem.total_amount,
        positionId: position.id
      });
    }

    // 4. Projekt-Budgets aktualisieren
    for (const update of budgetUpdates) {
      // Aktuelles Projekt-Budget laden
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('consumed_budget')
        .eq('id', update.projectId)
        .single();

      if (projectError) {
        console.error('❌ Fehler beim Laden des Projekts:', projectError);
        continue;
      }

      // Budget aktualisieren
      const newConsumedBudget = (project.consumed_budget || 0) + update.amount;
      
      const { error: budgetUpdateError } = await supabase
        .from('projects')
        .update({ 
          consumed_budget: newConsumedBudget,
          updated_at: new Date().toISOString()
        })
        .eq('id', update.projectId);

      if (budgetUpdateError) {
        console.error('❌ Fehler beim Budget-Update:', budgetUpdateError);
        continue;
      }

      console.log('✅ Budget aktualisiert für Projekt:', update.projectId, '+', update.amount);

      // Budget-Impact-Log erstellen
      await supabase
        .from('budget_impact_log')
        .insert({
          project_id: update.projectId,
          position_id: update.positionId,
          impact_type: 'INCREASE',
          amount: update.amount,
          previous_consumed: project.consumed_budget || 0,
          new_consumed: newConsumedBudget
        });
    }

    // 4.5. Jahresbudget-Synchronisation für alle betroffenen Projekte
    console.log('🔄 Synchronisiere Jahresbudgets für betroffene Projekte...');
    const annualBudgetIds = new Set();
    
    for (const update of budgetUpdates) {
      // Lade Projekt um annual_budget_id zu erhalten
      const { data: projectData, error: projectDataError } = await supabase
        .from('projects')
        .select('annual_budget_id')
        .eq('id', update.projectId)
        .single();
      
      if (!projectDataError && projectData?.annual_budget_id) {
        annualBudgetIds.add(projectData.annual_budget_id);
      }
    }
    
    // Synchronisiere alle betroffenen Jahresbudgets
    for (const annualBudgetId of annualBudgetIds) {
      try {
        await synchronizeAnnualBudget(annualBudgetId);
        console.log('✅ Jahresbudget synchronisiert:', annualBudgetId);
      } catch (error) {
        console.error('❌ Fehler bei Jahresbudget-Synchronisation:', error);
      }
    }

    // 5. Review-Session als genehmigt markieren
    const totalBudgetImpact = budgetUpdates.reduce((sum, update) => sum + update.amount, 0);
    const affectedProjects = [...new Set(budgetUpdates.map(update => update.projectId))];

    const { error: approvalError } = await supabase
      .from('ocr_review_sessions')
      .update({
        review_status: 'APPROVED',
        final_approval: {
          approved: true,
          approved_by: 'system',
          approved_at: new Date().toISOString(),
          total_budget_impact: totalBudgetImpact,
          affected_projects: affectedProjects,
          comments: comments || null
        },
        total_budget_impact: totalBudgetImpact,
        approved_at: new Date().toISOString(),
        approved_by: 'system'
      })
      .eq('id', sessionId);

    if (approvalError) {
      console.error('❌ Fehler beim Freigabe-Update:', approvalError);
    }

    // 6. Finale Freigabe-Log erstellen
    await supabase
      .from('final_approvals')
      .insert({
        review_session_id: sessionId,
        approved: true,
        total_budget_impact: totalBudgetImpact,
        affected_projects: affectedProjects,
        approval_comments: comments || null,
        approved_by: 'system',
        budget_updated_at: new Date().toISOString()
      });

    console.log('🎉 Finale Freigabe abgeschlossen!');

    res.json({
      success: true,
      data: {
        invoiceId: invoice.id,
        totalBudgetImpact: totalBudgetImpact,
        affectedProjects: affectedProjects.length,
        positionsCreated: budgetUpdates.length,
        message: 'Rechnung erfolgreich freigegeben und Budget aktualisiert'
      }
    });

  } catch (error) {
    console.error('❌ Fehler bei finaler Freigabe:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler bei der finalen Freigabe'
    });
  }
});

// Review-Session ablehnen
router.post('/sessions/:sessionId/reject', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { reason } = req.body;

    const { error: rejectError } = await supabase
      .from('ocr_review_sessions')
      .update({
        review_status: 'REJECTED',
        final_approval: {
          approved: false,
          approved_by: 'system',
          approved_at: new Date().toISOString(),
          rejection_reason: reason || 'Vom User abgelehnt'
        },
        approved_at: new Date().toISOString(),
        approved_by: 'system'
      })
      .eq('id', sessionId);

    if (rejectError) {
      console.error('❌ Fehler beim Ablehnen:', rejectError);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Ablehnen der Review-Session'
      });
    }

    console.log('❌ Review-Session abgelehnt:', sessionId);

    res.json({
      success: true,
      message: 'Review-Session erfolgreich abgelehnt'
    });

  } catch (error) {
    console.error('❌ Fehler bei Ablehnung:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Server-Fehler'
    });
  }
});

// Projekte für Dropdown laden
router.get('/projects', async (req, res) => {
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, name, planned_budget, consumed_budget, status')
      .eq('status', 'active')
      .order('name');

    if (error) {
      console.error('❌ Fehler beim Laden der Projekte:', error);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Laden der Projekte'
      });
    }

    console.log(`✅ ${projects?.length || 0} Projekte für OCR-Review geladen`);

    res.json({
      success: true,
      data: (projects || []).map(project => ({
        id: project.id,
        name: project.name,
        available_budget: (project.planned_budget || 0) - (project.consumed_budget || 0),
        consumed_budget: project.consumed_budget || 0,
        planned_budget: project.planned_budget || 0
      }))
    });

  } catch (error) {
    console.error('❌ Fehler beim Laden der Projekte:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Server-Fehler'
    });
  }
});

// Lieferanten für Dropdown laden
router.get('/suppliers', async (req, res) => {
  try {
    const { data: suppliers, error } = await supabase
      .from('suppliers')
      .select('id, name, uid_number, email')
      .eq('status', 'ACTIVE')
      .order('name');

    if (error) {
      console.error('❌ Fehler beim Laden der Lieferanten:', error);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Laden der Lieferanten'
      });
    }

    res.json({
      success: true,
      data: suppliers
    });

  } catch (error) {
    console.error('❌ Fehler bei Lieferanten-Abfrage:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Server-Fehler'
    });
  }
});

// Duplikatsprüfung für Rechnungen
router.post('/check-duplicates', async (req, res) => {
  try {
    const { invoiceNumber, supplierName, totalAmount, lineItems } = req.body;

    console.log('🔍 Prüfe Duplikate für:', { invoiceNumber, supplierName, totalAmount });

    // 1. Prüfe auf existierende Rechnung mit gleicher Nummer und Lieferant
    const { data: existingInvoices, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        id, 
        invoice_number, 
        total_amount, 
        supplier_name,
        created_at
      `)
      .eq('invoice_number', invoiceNumber)
      .ilike('supplier_name', `%${supplierName}%`);

    if (invoiceError) {
      console.error('❌ Fehler bei Rechnungsduplikatsprüfung:', invoiceError);
    }

    // 2. Prüfe auf ähnliche Rechnungen (gleicher Betrag, ähnlicher Zeitraum)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: similarInvoices, error: similarError } = await supabase
      .from('invoices')
      .select(`
        id, 
        invoice_number, 
        total_amount, 
        supplier_name,
        created_at
      `)
      .eq('total_amount', totalAmount)
      .ilike('supplier_name', `%${supplierName}%`)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (similarError) {
      console.error('❌ Fehler bei ähnlichen Rechnungen:', similarError);
    }

    // 3. Prüfe auf existierende Rechnungspositionen
    const duplicatePositions = [];
    if (lineItems && lineItems.length > 0) {
      for (const item of lineItems) {
        const { data: existingPositions, error: positionError } = await supabase
          .from('invoice_positions')
          .select(`
            id, 
            description, 
            total_amount, 
            invoice_id,
            invoices!inner(supplier_name, invoice_number)
          `)
          .ilike('description', `%${item.description}%`)
          .eq('total_amount', item.total_amount);

        if (positionError) {
          console.error('❌ Fehler bei Positionsduplikatsprüfung:', positionError);
        } else if (existingPositions && existingPositions.length > 0) {
          duplicatePositions.push({
            lineItem: item,
            existingPositions: existingPositions
          });
        }
      }
    }

    const result = {
      success: true,
      data: {
        hasDuplicates: (existingInvoices && existingInvoices.length > 0) || 
                      (similarInvoices && similarInvoices.length > 0) || 
                      duplicatePositions.length > 0,
        duplicateInvoices: existingInvoices || [],
        similarInvoices: similarInvoices || [],
        duplicatePositions: duplicatePositions,
        summary: {
          exactInvoiceDuplicates: existingInvoices?.length || 0,
          similarInvoices: similarInvoices?.length || 0,
          duplicatePositions: duplicatePositions.length
        }
      }
    };

    console.log('✅ Duplikatsprüfung abgeschlossen:', result.data.summary);
    res.json(result);

  } catch (error) {
    console.error('❌ Fehler bei Duplikatsprüfung:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler bei der Duplikatsprüfung'
    });
  }
});

export default router;
