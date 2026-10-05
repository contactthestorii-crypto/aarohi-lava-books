const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://uaaxenhtrysvqubxhbin.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhYXhlbmh0cnlzdnF1YnhoYmluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTE5NDYxNiwiZXhwIjoyMTA2NzcwNjE2fQ.PIDJZqv2t8XaUblfKY3jW2T6q3ijzLE690vtf87C2zs', { auth: { autoRefreshToken: false, persistSession: false } });

async function run() {
  const { data: eng } = await supabase.from('products').select('*').eq('slug', 'target-police-general-studies-tslprb-tgpsc').single();
  
  if (eng) {
    await supabase.from('products').update({
      subtitle: eng.subtitle,
      author: eng.author,
      author_bio: eng.author_bio,
      publisher: eng.publisher,
      edition: eng.edition,
      exams: eng.exams,
      keywords: eng.keywords,
      description: eng.description,
      key_features: eng.key_features,
      exam_coverage: eng.exam_coverage,
      seo_title: 'Target Police: General Studies (Telugu Medium)',
      seo_description: eng.seo_description,
      is_featured: true,
      weight_g: eng.weight_g
    }).eq('slug', 'target-police-general-studies-telugu');
    
    console.log('Telugu book details synced with English!');
  }
}
run();
