import { CategoryType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const globalCategories = [
  // Categorias de RECEITA (INCOME)
  { name: 'Salário', type: CategoryType.INCOME, color: '#10b981', icon: '💰', isGlobal: true },
  { name: 'Freelance', type: CategoryType.INCOME, color: '#3b82f6', icon: '💼', isGlobal: true },
  { name: 'Investimentos', type: CategoryType.INCOME, color: '#8b5cf6', icon: '📈', isGlobal: true },
  { name: 'Aluguel Recebido', type: CategoryType.INCOME, color: '#06b6d4', icon: '🏠', isGlobal: true },
  { name: 'Venda', type: CategoryType.INCOME, color: '#14b8a6', icon: '🏷️', isGlobal: true },
  { name: 'Prêmio', type: CategoryType.INCOME, color: '#f59e0b', icon: '🏆', isGlobal: true },
  { name: 'Reembolso', type: CategoryType.INCOME, color: '#84cc16', icon: '💵', isGlobal: true },
  { name: 'Bônus', type: CategoryType.INCOME, color: '#22c55e', icon: '🎁', isGlobal: true },
  { name: 'Presente', type: CategoryType.INCOME, color: '#ec4899', icon: '🎀', isGlobal: true },
  { name: 'Pensão', type: CategoryType.INCOME, color: '#6366f1', icon: '👥', isGlobal: true },
  { name: 'Dividendos', type: CategoryType.INCOME, color: '#a855f7', icon: '💎', isGlobal: true },
  { name: 'Royalties', type: CategoryType.INCOME, color: '#d946ef', icon: '🎵', isGlobal: true },
  { name: 'Outras Receitas', type: CategoryType.INCOME, color: '#64748b', icon: '📊', isGlobal: true },

  // Categorias de DESPESA (EXPENSE)
  { name: 'Alimentação', type: CategoryType.EXPENSE, color: '#ef4444', icon: '🍔', isGlobal: true },
  { name: 'Supermercado', type: CategoryType.EXPENSE, color: '#f97316', icon: '🛒', isGlobal: true },
  { name: 'Restaurante', type: CategoryType.EXPENSE, color: '#f59e0b', icon: '🍽️', isGlobal: true },
  { name: 'Transporte', type: CategoryType.EXPENSE, color: '#eab308', icon: '🚗', isGlobal: true },
  { name: 'Combustível', type: CategoryType.EXPENSE, color: '#84cc16', icon: '⛽', isGlobal: true },
  { name: 'Transporte Público', type: CategoryType.EXPENSE, color: '#22c55e', icon: '🚌', isGlobal: true },
  { name: 'Moradia', type: CategoryType.EXPENSE, color: '#10b981', icon: '🏠', isGlobal: true },
  { name: 'Aluguel', type: CategoryType.EXPENSE, color: '#14b8a6', icon: '🏘️', isGlobal: true },
  { name: 'Condomínio', type: CategoryType.EXPENSE, color: '#06b6d4', icon: '🏢', isGlobal: true },
  { name: 'Energia', type: CategoryType.EXPENSE, color: '#0ea5e9', icon: '💡', isGlobal: true },
  { name: 'Água', type: CategoryType.EXPENSE, color: '#3b82f6', icon: '💧', isGlobal: true },
  { name: 'Internet', type: CategoryType.EXPENSE, color: '#6366f1', icon: '🌐', isGlobal: true },
  { name: 'Telefone', type: CategoryType.EXPENSE, color: '#8b5cf6', icon: '📱', isGlobal: true },
  { name: 'Saúde', type: CategoryType.EXPENSE, color: '#a855f7', icon: '🏥', isGlobal: true },
  { name: 'Farmácia', type: CategoryType.EXPENSE, color: '#d946ef', icon: '💊', isGlobal: true },
  { name: 'Médico', type: CategoryType.EXPENSE, color: '#ec4899', icon: '👨‍⚕️', isGlobal: true },
  { name: 'Dentista', type: CategoryType.EXPENSE, color: '#f43f5e', icon: '🦷', isGlobal: true },
  { name: 'Plano de Saúde', type: CategoryType.EXPENSE, color: '#be123c', icon: '🏥', isGlobal: true },
  { name: 'Educação', type: CategoryType.EXPENSE, color: '#0891b2', icon: '📚', isGlobal: true },
  { name: 'Cursos', type: CategoryType.EXPENSE, color: '#0284c7', icon: '🎓', isGlobal: true },
  { name: 'Livros', type: CategoryType.EXPENSE, color: '#0369a1', icon: '📖', isGlobal: true },
  { name: 'Material Escolar', type: CategoryType.EXPENSE, color: '#075985', icon: '✏️', isGlobal: true },
  { name: 'Entretenimento', type: CategoryType.EXPENSE, color: '#7c3aed', icon: '🎬', isGlobal: true },
  { name: 'Cinema', type: CategoryType.EXPENSE, color: '#6d28d9', icon: '🎥', isGlobal: true },
  { name: 'Streaming', type: CategoryType.EXPENSE, color: '#5b21b6', icon: '📺', isGlobal: true },
  { name: 'Jogos', type: CategoryType.EXPENSE, color: '#4c1d95', icon: '🎮', isGlobal: true },
  { name: 'Viagem', type: CategoryType.EXPENSE, color: '#ea580c', icon: '✈️', isGlobal: true },
  { name: 'Vestuário', type: CategoryType.EXPENSE, color: '#dc2626', icon: '👕', isGlobal: true },
  { name: 'Beleza', type: CategoryType.EXPENSE, color: '#db2777', icon: '💄', isGlobal: true },
  { name: 'Pet', type: CategoryType.EXPENSE, color: '#9333ea', icon: '🐾', isGlobal: true },
  { name: 'Seguros', type: CategoryType.EXPENSE, color: '#4f46e5', icon: '🛡️', isGlobal: true },
  { name: 'Impostos', type: CategoryType.EXPENSE, color: '#1e40af', icon: '📋', isGlobal: true },
  { name: 'Doações', type: CategoryType.EXPENSE, color: '#059669', icon: '🤲', isGlobal: true },
  { name: 'Outras Despesas', type: CategoryType.EXPENSE, color: '#475569', icon: '📊', isGlobal: true },
];

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpar categorias globais existentes
  console.log('🗑️  Limpando categorias globais antigas...');
  await prisma.category.deleteMany({
    where: { isGlobal: true },
  });

  // Criar categorias globais
  console.log('📦 Criando 47 categorias globais...');
  for (const category of globalCategories) {
    await prisma.category.create({
      data: {
        ...category,
        userId: null, // Categorias globais não têm userId
      },
    });
  }

  console.log('✅ Seed concluído com sucesso!');
  console.log(`📊 ${globalCategories.length} categorias globais criadas`);
  console.log(`💰 ${globalCategories.filter(c => c.type === CategoryType.INCOME).length} categorias de receita`);
  console.log(`💸 ${globalCategories.filter(c => c.type === CategoryType.EXPENSE).length} categorias de despesa`);
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
