// =====================================================
// Budget Manager 2025 - Duplicate Budget Cleanup
// Bereinigt doppelte Budgets (behält neuestes pro Jahr)
// =====================================================

import { supabaseAdmin } from '../src/config/database.js';

/**
 * Bereinigt doppelte Budgets - behält nur das neueste pro Jahr
 */
async function cleanupDuplicateBudgets() {
  console.log('🧹 Starte Bereinigung doppelter Budgets...');
  
  try {
    // 1. Alle Budgets abrufen, sortiert nach Jahr und Erstellungsdatum
    const { data: allBudgets, error: fetchError } = await supabaseAdmin
      .from('annual_budgets')
      .select('*')
      .order('jahr', { ascending: true })
      .order('created_at', { ascending: false }); // Neueste zuerst
    
    if (fetchError) {
      throw new Error(`Fehler beim Abrufen der Budgets: ${fetchError.message}`);
    }
    
    console.log(`📊 Gefunden: ${allBudgets.length} Budgets total`);
    
    // 2. Gruppiere Budgets nach Jahr
    const budgetsByYear = {};
    allBudgets.forEach(budget => {
      if (!budgetsByYear[budget.jahr]) {
        budgetsByYear[budget.jahr] = [];
      }
      budgetsByYear[budget.jahr].push(budget);
    });
    
    // 3. Finde doppelte Budgets
    const duplicatesToDelete = [];
    const budgetsToKeep = [];
    
    Object.entries(budgetsByYear).forEach(([year, budgets]) => {
      console.log(`\n📅 Jahr ${year}: ${budgets.length} Budget(s)`);
      
      if (budgets.length > 1) {
        // Behalte das neueste (erstes in der sortierten Liste)
        const newestBudget = budgets[0];
        const duplicates = budgets.slice(1);
        
        budgetsToKeep.push(newestBudget);
        duplicatesToDelete.push(...duplicates);
        
        console.log(`   ✅ Behalten: ${newestBudget.beschreibung} (${newestBudget.created_at})`);
        duplicates.forEach(duplicate => {
          console.log(`   ❌ Löschen: ${duplicate.beschreibung} (${duplicate.created_at})`);
        });
      } else {
        budgetsToKeep.push(budgets[0]);
        console.log(`   ✅ Einzigartig: ${budgets[0].beschreibung}`);
      }
    });
    
    console.log(`\n📊 Zusammenfassung:`);
    console.log(`   📋 Budgets behalten: ${budgetsToKeep.length}`);
    console.log(`   🗑️  Budgets löschen: ${duplicatesToDelete.length}`);
    
    // 4. Lösche doppelte Budgets
    if (duplicatesToDelete.length > 0) {
      console.log(`\n🗑️ Lösche ${duplicatesToDelete.length} doppelte Budgets...`);
      
      for (const budget of duplicatesToDelete) {
        const { error: deleteError } = await supabaseAdmin
          .from('annual_budgets')
          .delete()
          .eq('id', budget.id);
        
        if (deleteError) {
          console.error(`❌ Fehler beim Löschen von Budget ${budget.id}: ${deleteError.message}`);
        } else {
          console.log(`   ✅ Gelöscht: ${budget.beschreibung} (${budget.jahr})`);
        }
      }
    }
    
    // 5. Validiere Ergebnis
    const { data: finalBudgets, error: finalError } = await supabaseAdmin
      .from('annual_budgets')
      .select('jahr, beschreibung, created_at')
      .order('jahr', { ascending: true });
    
    if (finalError) {
      throw new Error(`Fehler bei der Validierung: ${finalError.message}`);
    }
    
    console.log(`\n✅ Bereinigung abgeschlossen!`);
    console.log(`📊 Verbleibende Budgets: ${finalBudgets.length}`);
    
    // Zeige finale Budget-Liste
    const finalByYear = {};
    finalBudgets.forEach(budget => {
      if (!finalByYear[budget.jahr]) {
        finalByYear[budget.jahr] = [];
      }
      finalByYear[budget.jahr].push(budget);
    });
    
    console.log(`\n📋 Finale Budget-Übersicht:`);
    Object.entries(finalByYear).forEach(([year, budgets]) => {
      console.log(`   📅 ${year}: ${budgets.length} Budget - ${budgets[0].beschreibung}`);
    });
    
    // Prüfe auf verbleibende Duplikate
    const duplicateYears = Object.entries(finalByYear).filter(([year, budgets]) => budgets.length > 1);
    if (duplicateYears.length > 0) {
      console.log(`\n⚠️ Warnung: Noch ${duplicateYears.length} Jahre mit mehreren Budgets:`);
      duplicateYears.forEach(([year, budgets]) => {
        console.log(`   📅 ${year}: ${budgets.length} Budgets`);
      });
    } else {
      console.log(`\n🎯 Perfekt! Jedes Jahr hat genau ein Budget.`);
    }
    
  } catch (error) {
    console.error('❌ Fehler bei der Budget-Bereinigung:', error);
    process.exit(1);
  }
}

// Script ausführen
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupDuplicateBudgets()
    .then(() => {
      console.log('\n🎉 Budget-Bereinigung erfolgreich abgeschlossen!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Budget-Bereinigung fehlgeschlagen:', error);
      process.exit(1);
    });
}

export { cleanupDuplicateBudgets };

