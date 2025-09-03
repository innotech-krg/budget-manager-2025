// =====================================================
// Budget Manager 2025 - Create Budget Categories
// =====================================================

import { supabaseAdmin } from './src/config/database.js';

const createBudgetCategories = async () => {
  try {
    console.log('🔄 Creating budget categories...');
    
    const budgetCategories = [
      {
        name: 'Büroausstattung',
        beschreibung: 'Büromöbel, Computer, Software und Zubehör',
        kategorie_typ: 'BUDGET',
        parent_kategorie_id: null,
        aktiv: true
      },
      {
        name: 'Marketing & Werbung',
        beschreibung: 'Werbematerialien, Online-Marketing, Events',
        kategorie_typ: 'BUDGET',
        parent_kategorie_id: null,
        aktiv: true
      },
      {
        name: 'IT & Software',
        beschreibung: 'Software-Lizenzen, Hardware, Cloud-Services',
        kategorie_typ: 'BUDGET',
        parent_kategorie_id: null,
        aktiv: true
      },
      {
        name: 'Facility Management',
        beschreibung: 'Reinigung, Sicherheit, Wartung',
        kategorie_typ: 'BUDGET',
        parent_kategorie_id: null,
        aktiv: true
      },
      {
        name: 'Personal & HR',
        beschreibung: 'Personalkosten, Schulungen, Benefits',
        kategorie_typ: 'BUDGET',
        parent_kategorie_id: null,
        aktiv: true
      },
      {
        name: 'Reisen & Transport',
        beschreibung: 'Geschäftsreisen, Fahrzeuge, Sprit',
        kategorie_typ: 'BUDGET',
        parent_kategorie_id: null,
        aktiv: true
      },
      {
        name: 'Beratung & Services',
        beschreibung: 'Externe Berater, Dienstleistungen',
        kategorie_typ: 'BUDGET',
        parent_kategorie_id: null,
        aktiv: true
      },
      {
        name: 'Materialien & Produktion',
        beschreibung: 'Rohstoffe, Produktionsmaterialien',
        kategorie_typ: 'BUDGET',
        parent_kategorie_id: null,
        aktiv: true
      }
    ];
    
    console.log('📝 Inserting budget categories...');
    const { data: insertedCategories, error: insertError } = await supabaseAdmin
      .from('kategorien')
      .insert(budgetCategories)
      .select();
    
    if (insertError) {
      console.error('❌ Error inserting budget categories:', insertError);
      return;
    }
    
    console.log(`✅ ${insertedCategories.length} budget categories created`);
    
    // Find IT category for subcategories
    const itCategory = insertedCategories.find(cat => cat.name === 'IT & Software');
    if (itCategory) {
      const itSubCategories = [
        {
          name: 'Software-Lizenzen',
          beschreibung: 'Microsoft Office, Adobe, Entwicklungstools',
          kategorie_typ: 'BUDGET',
          parent_kategorie_id: itCategory.id,
          aktiv: true
        },
        {
          name: 'Hardware',
          beschreibung: 'Computer, Server, Netzwerk-Equipment',
          kategorie_typ: 'BUDGET',
          parent_kategorie_id: itCategory.id,
          aktiv: true
        },
        {
          name: 'Cloud-Services',
          beschreibung: 'AWS, Azure, Google Cloud, SaaS',
          kategorie_typ: 'BUDGET',
          parent_kategorie_id: itCategory.id,
          aktiv: true
        }
      ];
      
      console.log('📝 Inserting IT subcategories...');
      const { data: itSubs, error: itError } = await supabaseAdmin
        .from('kategorien')
        .insert(itSubCategories)
        .select();
      
      if (itError) {
        console.error('❌ Error inserting IT subcategories:', itError);
      } else {
        console.log(`✅ ${itSubs.length} IT subcategories created`);
      }
    }
    
    // Check final result
    const { data: allBudgetCategories, error: checkError } = await supabaseAdmin
      .from('kategorien')
      .select('*')
      .eq('kategorie_typ', 'BUDGET')
      .order('name');
    
    if (checkError) {
      console.error('❌ Error checking budget categories:', checkError);
    } else {
      console.log(`🎉 Total budget categories: ${allBudgetCategories.length}`);
      allBudgetCategories.forEach(cat => {
        const parent = cat.parent_kategorie_id ? '  └─ ' : '- ';
        console.log(`${parent}${cat.name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Failed to create budget categories:', error);
  }
};

createBudgetCategories();





