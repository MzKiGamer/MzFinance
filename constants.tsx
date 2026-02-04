
import React from 'react';
import { Category } from './types';

export const MONTHS = [
  { code: 'dez-25', name: 'Dezembro 2025' },
  { code: 'jan-26', name: 'Janeiro 2026' },
  { code: 'fev-26', name: 'Fevereiro 2026' },
  { code: 'mar-26', name: 'Março 2026' },
  { code: 'abr-26', name: 'Abril 2026' },
  { code: 'mai-26', name: 'Maio 2026' },
  { code: 'jun-26', name: 'Junho 2026' },
  { code: 'jul-26', name: 'Julho 2026' },
  { code: 'ago-26', name: 'Agosto 2026' },
  { code: 'set-26', name: 'Setembro 2026' },
  { code: 'out-26', name: 'Outubro 2026' },
  { code: 'nov-26', name: 'Novembro 2026' },
  { code: 'dez-26', name: 'Dezembro 2026' },
];

export const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Receita', icon: '💸', subcategories: 'Salário, renda extra, rendimentos', isSystem: true },
];

export const PAYMENT_METHODS = [
  "Dinheiro",
  "PIX",
  "Débito",
  "Crédito",
  "Boleto",
  "Transferência"
];

export const INVESTMENT_TYPES = [
  "Renda Fixa",
  "Renda Variável",
  "Fundo Imobiliário",
  "Criptomoedas",
  "Previdência Privada",
  "Tesouro Direto",
  "CDB",
  "LCI/LCA",
  "Ações",
  "Outros"
];
