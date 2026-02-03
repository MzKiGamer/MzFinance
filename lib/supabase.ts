
import { createClient } from '@supabase/supabase-js';

/**
 * Mz Finance - Configuração do Banco de Dados
 * As chaves abaixo são as que você forneceu. 
 * O sistema tentará ler do ambiente primeiro, se não encontrar, usará estas.
 */

// Credenciais fornecidas pelo usuário
const DEFAULT_URL = 'https://ngpnbqnesdiduaykwtds.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ncG5icW5lc2RpZHVheWt3dGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNzc0MzEsImV4cCI6MjA4NTY1MzQzMX0.VPAkcXhUyhz15K8tGMBrEs9i-JapOejodxRz5K7zLuI';

const getEnv = (keys: string[]): string => {
  if (typeof process !== 'undefined' && process.env) {
    for (const key of keys) {
      if (process.env[key]) return process.env[key] as string;
    }
  }
  return '';
};

// Tenta pegar do ambiente, senão usa o padrão configurado
const supabaseUrl = getEnv(['SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL']) || DEFAULT_URL;
const supabaseAnonKey = getEnv([
  'SUPABASE_ANON_KEY', 
  'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY'
]) || DEFAULT_KEY;

// Inicialização do cliente
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Diagnóstico no console do desenvolvedor
if (!supabase) {
  console.error("❌ Mz Finance: Falha crítica na configuração do Supabase.");
} else {
  console.log("✅ Mz Finance: Supabase configurado e pronto!");
}
