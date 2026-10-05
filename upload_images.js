const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://uaaxenhtrysvqubxhbin.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhYXhlbmh0cnlzdnF1YnhoYmluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTE5NDYxNiwiZXhwIjoyMTA2NzcwNjE2fQ.PIDJZqv2t8XaUblfKY3jW2T6q3ijzLE690vtf87C2zs', { auth: { autoRefreshToken: false, persistSession: false } });

async function run() {
  const telSlug = 'target-police-general-studies-telugu';
  const { data: cat } = await supabase.from('categories').select('id').eq('slug', 'tslprb').single();
  const catId = cat ? cat.id : null;

  const { data: newTel, error } = await supabase.from('products').insert({
    slug: telSlug,
    title: 'Target Police: 360° Explanation of General Studies (Telugu Medium)',
    primary_category_id: catId,
    status: 'published',
    mrp_paise: 89900,
    price_paise: 80900
  }).select('id').single();
  
  if (error) {
    console.error('Insert error:', error);
    return;
  }
  
  const telId = newTel.id;
  await supabase.from('inventory_levels').insert({ product_id: telId, quantity_on_hand: 1000 });
  await supabase.from('product_images').delete().eq('product_id', telId);
  await supabase.from('product_images').insert({
    product_id: telId,
    storage_path: 'target-police-telugu-cover.jpg',
    alt_text: 'Target Police Telugu Cover',
    is_primary: true
  });
  console.log('Telugu book added!');
}
run();
