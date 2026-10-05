const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://uaaxenhtrysvqubxhbin.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhYXhlbmh0cnlzdnF1YnhoYmluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTE5NDYxNiwiZXhwIjoyMTA2NzcwNjE2fQ.PIDJZqv2t8XaUblfKY3jW2T6q3ijzLE690vtf87C2zs',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function run() {
  await supabase.from('products').update({
    mrp_paise: 89900,
    price_paise: 80900
  }).eq('slug', 'target-police-general-studies-tslprb-tgpsc');
  console.log('Price updated to 899 MRP with 10% discount (809 selling price)');
}
run();
