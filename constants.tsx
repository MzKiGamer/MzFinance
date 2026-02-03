
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
  { id: '1', name: 'Mercado', icon: '🛒', subcategories: 'Alimentos, bebidas, itens de limpeza etc' },
  { id: '2', name: 'Necessidades', icon: '⚠️', subcategories: 'Farmácia, higiene pessoal' },
  { id: '3', name: 'Eletrônicos', icon: '📱', subcategories: 'Computador, celular, consertos' },
  { id: '4', name: 'Pet', icon: '🐶', subcategories: 'Ração, veterinário' },
  { id: '5', name: 'Roupas', icon: '👚', subcategories: 'Vestuário em geral' },
  { id: '6', name: 'Beleza', icon: '💅', subcategories: 'Salão, cremes, perfumes' },
  { id: '7', name: 'Presente', icon: '🎁', subcategories: 'Presentes para amigos e família' },
  { id: '8', name: 'Saúde', icon: '💊', subcategories: 'Suplementos, academia, consultas' },
  { id: '9', name: 'Outros', icon: '🤷', subcategories: 'Gastos eventuais não planejados' },
  { id: '10', name: 'Desenvolvimento', icon: '🧠', subcategories: 'Cursos, livros, planners' },
  { id: '11', name: 'Transporte', icon: '🚗', subcategories: 'Uber, gasolina' },
  { id: '12', name: 'Comida fora', icon: '🍽️', subcategories: 'Restaurantes, delivery' },
  { id: '13', name: 'Lazer', icon: '🏖️', subcategories: 'Festas, cinema, teatro' },
  { id: '14', name: 'Moradia', icon: '🏠', subcategories: 'Aluguel, internet, água, luz' },
  { id: '15', name: 'Contas', icon: '🧾', subcategories: 'IPVA, IPTU, impostos' },
  { id: '16', name: 'Investimento', icon: '📈', subcategories: 'Aportes, poupança' },
  { id: '17', name: 'Educação', icon: '🎓', subcategories: 'Faculdade, cursos extras' },
  { id: '18', name: 'Divida', icon: '🤝', subcategories: 'Empréstimos, renegociações' },
  { id: '19', name: 'Negócio', icon: '💼', subcategories: 'Projetos pessoais, empresa' },
  { id: '20', name: 'Receita', icon: '💸', subcategories: 'Salário, renda extra', isSystem: true },
  { id: '21', name: 'Fatura do Cartão', icon: '🧾', subcategories: 'Pagamentos de fatura' },
  { id: '22', name: 'Transferência', icon: '🔁', subcategories: 'PIX, TED enviadas' },
  { id: '23', name: 'Uber/99', icon: '🚖', subcategories: 'Transporte por app' },
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
