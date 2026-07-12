const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  const { data: users } = await supabase.from('User').select('*');
  const { data: farms } = await supabase.from('Farm').select('*');
  
  console.log("Users count:", users?.length);
  console.log("Farms count:", farms?.length);

  if (users?.length > 0 && farms?.length > 0) {
    const tx = {
      referenceNumber: 'TEST-' + Date.now(),
      type: 'RECEIPT',
      amount: 100,
      description: 'Test',
      farmId: farms[0].id,
      workerId: users[0].id,
      date: new Date().toISOString(),
    };
    
    console.log("Inserting transaction:", tx);
    const { data, error } = await supabase.from('Transaction').insert(tx).select();
    if (error) {
      console.error("Insert error:", error);
    } else {
      console.log("Insert success:", data);
    }
  }
}

testInsert();
