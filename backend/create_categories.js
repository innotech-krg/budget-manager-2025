// =====================================================
// Budget Manager 2025 - Create Categories
// =====================================================

import { supabaseAdmin } from './src/config/database.js';

const createCategories = async () => {
  try {
    console.log('🔄 Creating categories table and data...');
    
    // First, create the table (if it doesn't exist)
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS categories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL,
          description TEXT,
          parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
          level INTEGER NOT NULL DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          
          -- Constraints
          UNIQUE(name, parent_id), -- Eindeutige Namen pro Parent-Level
          CHECK (level >= 0 AND level <= 5), -- Maximale Verschachtelung
          CHECK (id != parent_id) -- Keine Selbstreferenz
      );
    `;
    
    console.log('📝 Creating table...');
    const { error: tableError } = await supabaseAdmin.rpc('exec', { sql: createTableSQL });
    if (tableError) {
      console.log('ℹ️  Table might already exist:', tableError.message);
    }
    
    // Insert main categories
    const mainCategories = [
      { name: 'Büroausstattung', description: 'Büromöbel, Computer, Software und Zubehör', level: 0 },
      { name: 'Marketing & Werbung', description: 'Werbematerialien, Online-Marketing, Events', level: 0 },
      { name: 'IT & Software', description: 'Software-Lizenzen, Hardware, Cloud-Services', level: 0 },
      { name: 'Facility Management', description: 'Reinigung, Sicherheit, Wartung', level: 0 },
      { name: 'Personal & HR', description: 'Personalkosten, Schulungen, Benefits', level: 0 },
      { name: 'Reisen & Transport', description: 'Geschäftsreisen, Fahrzeuge, Sprit', level: 0 },
      { name: 'Beratung & Services', description: 'Externe Berater, Dienstleistungen', level: 0 },
      { name: 'Materialien & Produktion', description: 'Rohstoffe, Produktionsmaterialien', level: 0 }
    ];
    
    console.log('📝 Inserting main categories...');
    const { data: insertedCategories, error: insertError } = await supabaseAdmin
      .from('categories')
      .upsert(mainCategories, { onConflict: 'name,parent_id' })
      .select();
    
    if (insertError) {
      console.error('❌ Error inserting categories:', insertError);
      return;
    }
    
    console.log(`✅ ${insertedCategories.length} main categories created`);
    
    // Find IT category for subcategories
    const itCategory = insertedCategories.find(cat => cat.name === 'IT & Software');
    if (itCategory) {
      const itSubCategories = [
        { name: 'Software-Lizenzen', description: 'Microsoft Office, Adobe, Entwicklungstools', parent_id: itCategory.id, level: 1 },
        { name: 'Hardware', description: 'Computer, Server, Netzwerk-Equipment', parent_id: itCategory.id, level: 1 },
        { name: 'Cloud-Services', description: 'AWS, Azure, Google Cloud, SaaS', parent_id: itCategory.id, level: 1 },
        { name: 'Support & Wartung', description: 'IT-Support, Wartungsverträge', parent_id: itCategory.id, level: 1 }
      ];
      
      console.log('📝 Inserting IT subcategories...');
      const { data: itSubs, error: itError } = await supabaseAdmin
        .from('categories')
        .upsert(itSubCategories, { onConflict: 'name,parent_id' })
        .select();
      
      if (itError) {
        console.error('❌ Error inserting IT subcategories:', itError);
      } else {
        console.log(`✅ ${itSubs.length} IT subcategories created`);
      }
    }
    
    // Find Marketing category for subcategories
    const marketingCategory = insertedCategories.find(cat => cat.name === 'Marketing & Werbung');
    if (marketingCategory) {
      const marketingSubCategories = [
        { name: 'Online-Marketing', description: 'Google Ads, Facebook, SEO-Tools', parent_id: marketingCategory.id, level: 1 },
        { name: 'Print-Werbung', description: 'Flyer, Broschüren, Zeitungsanzeigen', parent_id: marketingCategory.id, level: 1 },
        { name: 'Events & Messen', description: 'Messeauftritte, Veranstaltungen', parent_id: marketingCategory.id, level: 1 },
        { name: 'Corporate Design', description: 'Logo, Website, Branding', parent_id: marketingCategory.id, level: 1 }
      ];
      
      console.log('📝 Inserting Marketing subcategories...');
      const { data: marketingSubs, error: marketingError } = await supabaseAdmin
        .from('categories')
        .upsert(marketingSubCategories, { onConflict: 'name,parent_id' })
        .select();
      
      if (marketingError) {
        console.error('❌ Error inserting Marketing subcategories:', marketingError);
      } else {
        console.log(`✅ ${marketingSubs.length} Marketing subcategories created`);
      }
    }
    
    // Check final result
    const { data: allCategories, error: checkError } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('level')
      .order('name');
    
    if (checkError) {
      console.error('❌ Error checking categories:', checkError);
    } else {
      console.log(`🎉 Total categories created: ${allCategories.length}`);
      allCategories.forEach(cat => {
        const indent = '  '.repeat(cat.level);
        console.log(`${indent}- ${cat.name} (Level ${cat.level})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Failed to create categories:', error);
  }
};

createCategories();





