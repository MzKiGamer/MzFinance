
import { createClient } from '@supabase/supabase-js';

/**
 * IMPORTANTE: 
 * No ambiente do navegador, o process.env pode não estar disponível ou o arquivo .env.local 
 * pode não ser lido automaticamente dependendo da ferramenta de build.
 * 
 * Se você receber o erro "Conexão com banco de dados não disponível", você deve:
 * 1. Ir na aba "Secrets" ou "Environment Variables" do seu editor.
 * 2. Adicionar SUPABASE_URL e SUPABASE_ANON_KEY manualmente.
 */
const getEnv = (key: string): string => {
  try {
    // Tenta buscar do process.env (Vite, Webpack, etc)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
    // Caso contrário, retorna string vazia
    return '';
  } catch {
    return '';
  }
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

// Validação para evitar inicializar com URLs de exemplo/placeholders
const isValidUrl = (url: string) => {
  try {
    if (!url) return false;
    const parsed = new URL(url);
    // Verifica se não é a URL de placeholder que passei no exemplo anterior
    return parsed.protocol.startsWith('http') && !url.includes('seu-projeto.supabase.co');
  } catch {
    return false;
  }
};

export const supabase = (supabaseUrl && isValidUrl(supabaseUrl) && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Diagnóstico no console do navegador para ajudar o usuário
if (!supabase) {
  console.warn(
    "⚠️ Mz Finance: Supabase NÃO configurado corretamente.\n" +
    "Causa Provável: Variáveis de ambiente SUPABASE_URL ou SUPABASE_ANON_KEY ausentes ou ainda com valores de exemplo.\n" +
    "Ação Necessária: Cadastre as chaves reais na aba 'Secrets' ou 'Environment Variables' do editor."
  );
} else {
  console.log("✅ Mz Finance: Supabase conectado e pronto.");
}
