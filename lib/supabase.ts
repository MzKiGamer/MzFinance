
import { createClient } from '@supabase/supabase-js';

// As chaves são injetadas via ambiente.
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

// Inicializa apenas se houver valores válidos para evitar o erro "supabaseUrl is required"
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

if (!supabase) {
  console.warn("Supabase não configurado. O sistema funcionará apenas localmente (sem persistência na nuvem). Configure SUPABASE_URL e SUPABASE_ANON_KEY.");
}
