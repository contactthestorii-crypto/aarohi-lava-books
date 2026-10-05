const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://uaaxenhtrysvqubxhbin.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhYXhlbmh0cnlzdnF1YnhoYmluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTE5NDYxNiwiZXhwIjoyMTA2NzcwNjE2fQ.PIDJZqv2t8XaUblfKY3jW2T6q3ijzLE690vtf87C2zs',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function run() {
  const mockup3D = fs.readFileSync('public/images/ecommerce/target-police-3d.jpg');

  console.log('Uploading 3D book mockup to Supabase Storage...');
  const { data, error } = await supabase.storage
    .from('product-images')
    .upload('target-police-3d-mockup.jpg', mockup3D, { contentType: 'image/jpeg', upsert: true });

  if (error) {
    console.error('Storage upload error:', error);
  } else {
    console.log('Storage upload successful:', data);
  }

  // Get English product ID
  const { data: prod } = await supabase
    .from('products')
    .select('id')
    .eq('slug', 'target-police-general-studies-tslprb-tgpsc')
    .single();

  if (prod) {
    console.log('Updating product_images for English product:', prod.id);
    await supabase.from('product_images').delete().eq('product_id', prod.id);

    // Insert 3D mockup as primary, and flat cover as secondary
    await supabase.from('product_images').insert([
      {
        product_id: prod.id,
        storage_path: 'target-police-3d-mockup.jpg',
        alt_text: 'Target Police 360 Explanation General Studies 3D Book Mockup',
        is_primary: true,
        sort_order: 0
      },
      {
        product_id: prod.id,
        storage_path: 'target-police-english-cover.jpg',
        alt_text: 'Target Police English Cover Details',
        is_primary: false,
        sort_order: 1
      }
    ]);

    // Ensure price and stock are set
    await supabase.from('products').update({
      mrp_paise: 89900,
      price_paise: 80900,
      status: 'published'
    }).eq('id', prod.id);

    await supabase.from('inventory_levels').upsert({
      product_id: prod.id,
      quantity_on_hand: 500
    });

    console.log('English book updated with 3D mockup, price 809, and active stock!');
  }
}

run();
