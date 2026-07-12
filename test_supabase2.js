const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data: users } = await supabase.from('User').select('*');
  const { data: farms } = await supabase.from('Farm').select('*');
  const { data: transactions } = await supabase.from('Transaction').select('*');
  
  console.log("Users:", users);
  console.log("Farms:", farms);
  console.log("Transactions:", transactions);
}

check();
