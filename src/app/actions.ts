'use server';

import { createClient } from '@supabase/supabase-js';

// We create a server-side client here using the service role key or anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function fetchAllData() {
  const [users, farms, truckTypes, expenseCategories, truckRegistrations, expenses, transactions, closures] = await Promise.all([
    supabase.from('User').select('*'),
    supabase.from('Farm').select('*'),
    supabase.from('TruckType').select('*'),
    supabase.from('ExpenseCategory').select('*'),
    supabase.from('TruckRegistration').select('*'),
    supabase.from('Expense').select('*'),
    supabase.from('Transaction').select('*'),
    supabase.from('DailyClosure').select('*'),
  ]);

  return {
    users: users.data || [],
    farms: farms.data || [],
    truckTypes: truckTypes.data || [],
    expenseCategories: expenseCategories.data || [],
    truckRegistrations: truckRegistrations.data || [],
    expenses: expenses.data || [],
    transactions: transactions.data || [],
    closures: closures.data || [],
  };
}

export async function supabaseMutation(table: string, method: 'insert' | 'update' | 'delete', data: any, matchQuery?: any) {
  try {
    let query: any = supabase.from(table);
    
    if (method === 'insert') {
      query = query.insert(data);
    } else if (method === 'update') {
      query = query.update(data).match(matchQuery);
    } else if (method === 'delete') {
      query = query.delete().match(matchQuery);
    }

    const { data: result, error } = await query.select();
    if (error) throw error;
    
    return result;
  } catch (error) {
    console.error(`Supabase Error (${table}.${method}):`, error);
    throw error;
  }
}
