const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://uaaxenhtrysvqubxhbin.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhYXhlbmh0cnlzdnF1YnhoYmluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTE5NDYxNiwiZXhwIjoyMTA2NzcwNjE2fQ.PIDJZqv2t8XaUblfKY3jW2T6q3ijzLE690vtf87C2zs',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function run() {
  console.log('Creating admin user...');
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'admin@aarohilavapublications.com',
    password: 'AdminPassword123!',
    email_confirm: true,
  });
  
  if (error) {
    console.error('Error creating user:', error);
    return;
  }
  
  console.log('User created:', data.user.id);
  
  console.log('Assigning admin role in public.profiles...');
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', data.user.id);
    
  if (profileError) {
    console.error('Error assigning role:', profileError);
  } else {
    console.log('Admin role assigned successfully!');
  }
}

run();
