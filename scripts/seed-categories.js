import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const globalCategories = [
  // RECEITAS
  { name: 'Salário', type: 'INCOME', color: '#10b981', icon: '💰' },
  { name: 'Freelance', type: 'INCOME', color: '#059669', icon: '💻' },
  { name: 'Investimentos', type: 'INCOME', color: '#047857', icon: '📈' },
  { name: 'Aluguel Recebido', type: 'INCOME', color: '#065f46', icon: '🏠' },
  { name: 'Vendas', type: 'INCOME', color: '#064e3b', icon: '🛍️' },
  
  // DESPESAS - MORADIA
  { name: 'Aluguel', type: 'EXPENSE', color: '#ef4444', icon: '🏠' },
  { name: 'Financiamento Imóvel', type: 'EXPENSE', color: '#dc2626', icon: '🏡' },
  { name: 'Condomínio', type: 'EXPENSE', color: '#b91c1c', icon: '🏢' },
  { name: 'IPTU', type: 'EXPENSE', color: '#991b1b', icon: '📄' },
  { name: 'Energia Elétrica', type: 'EXPENSE', color: '#fbbf24', icon: '⚡' },
  { name: 'Água', type: 'EXPENSE', color: '#3b82f6', icon: '💧' },
  { name: 'Gás', type: 'EXPENSE', color: '#f59e0b', icon: '🔥' },
  { name: 'Internet', type: 'EXPENSE', color: '#6366f1', icon: '🌐' },
  { name: 'Telefone', type: 'EXPENSE', color: '#8b5cf6', icon: '📞' },
  
  // DESPESAS - ALIMENTAÇÃO
  { name: 'Supermercado', type: 'EXPENSE', color: '#84cc16', icon: '🛒' },
  { name: 'Restaurantes', type: 'EXPENSE', color: '#eab308', icon: '🍽️' },
  { name: 'Delivery', type: 'EXPENSE', color: '#f97316', icon: '🛵' },
  { name: 'Lanche/Café', type: 'EXPENSE', color: '#a3a3a3', icon: '☕' },
  
  // DESPESAS - TRANSPORTE
  { name: 'Combustível', type: 'EXPENSE', color: '#525252', icon: '⛽' },
  { name: 'Transporte Público', type: 'EXPENSE', color: '#0ea5e9', icon: '🚌' },
  { name: 'Uber/Taxi', type: 'EXPENSE', color: '#06b6d4', icon: '🚗' },
  { name: 'Estacionamento', type: 'EXPENSE', color: '#0891b2', icon: '🅿️' },
  { name: 'Manutenção Veículo', type: 'EXPENSE', color: '#0e7490', icon: '🔧' },
  
  // DESPESAS - SAÚDE
  { name: 'Plano de Saúde', type: 'EXPENSE', color: '#ec4899', icon: '🏥' },
  { name: 'Médico', type: 'EXPENSE', color: '#db2777', icon: '👨‍⚕️' },
  { name: 'Dentista', type: 'EXPENSE', color: '#be185d', icon: '🦷' },
  { name: 'Farmácia', type: 'EXPENSE', color: '#9d174d', icon: '💊' },
  
  // DESPESAS - EDUCAÇÃO
  { name: 'Escola/Universidade', type: 'EXPENSE', color: '#7c3aed', icon: '🎓' },
  { name: 'Cursos', type: 'EXPENSE', color: '#6d28d9', icon: '📚' },
  { name: 'Livros', type: 'EXPENSE', color: '#5b21b6', icon: '📖' },
  
  // DESPESAS - LAZER
  { name: 'Cinema', type: 'EXPENSE', color: '#dc2626', icon: '🎬' },
  { name: 'Streaming', type: 'EXPENSE', color: '#b91c1c', icon: '📺' },
  { name: 'Academia', type: 'EXPENSE', color: '#991b1b', icon: '💪' },
  { name: 'Viagens', type: 'EXPENSE', color: '#7f1d1d', icon: '✈️' },
  { name: 'Jogos', type: 'EXPENSE', color: '#6b7280', icon: '🎮' },
  
  // DESPESAS - FINANCEIRAS
  { name: 'Banco/Tarifas', type: 'EXPENSE', color: '#374151', icon: '🏦' },
  { name: 'Cartão de Crédito', type: 'EXPENSE', color: '#1f2937', icon: '💳' },
  { name: 'Empréstimos', type: 'EXPENSE', color: '#111827', icon: '💰' },
  { name: 'Seguros', type: 'EXPENSE', color: '#0f172a', icon: '🛡️' },
  
  // DESPESAS - PESSOAIS
  { name: 'Roupas', type: 'EXPENSE', color: '#f472b6', icon: '👕' },
  { name: 'Beleza/Cuidados', type: 'EXPENSE', color: '#e879f9', icon: '💄' },
  { name: 'Presentes', type: 'EXPENSE', color: '#c084fc', icon: '🎁' },
  
  // DESPESAS - CASA
  { name: 'Móveis', type: 'EXPENSE', color: '#a78bfa', icon: '🪑' },
  { name: 'Eletrodomésticos', type: 'EXPENSE', color: '#8b5cf6', icon: '🔌' },
  { name: 'Limpeza', type: 'EXPENSE', color: '#7c3aed', icon: '🧽' },
  
  // OUTRAS
  { name: 'Outros', type: 'EXPENSE', color: '#6b7280', icon: '❓' },
  { name: 'Emergência', type: 'EXPENSE', color: '#dc2626', icon: '🚨' }
];

async function createGlobalCategories() {
  try {
    console.log('🔍 Conectando ao banco de dados...');
    await prisma.$connect();
    console.log('✅ Conexão estabelecida!');
    
    console.log('\n🌍 CRIANDO CATEGORIAS GLOBAIS...');
    console.log('================================');
    
    let created = 0;
    let skipped = 0;
    
    for (const category of globalCategories) {
      try {
        // Verificar se já existe
        const existing = await prisma.category.findFirst({
          where: {
            name: category.name,
            isGlobal: true
          }
        });
        
        if (existing) {
          console.log(`⏭️  Categoria "${category.name}" já existe`);
          skipped++;
        } else {
          await prisma.category.create({
            data: {
              name: category.name,
              type: category.type,
              color: category.color,
              icon: category.icon,
              isGlobal: true,
              userId: null // Categoria global
            }
          });
          console.log(`✅ Criada: ${category.icon} ${category.name} (${category.type})`);
          created++;
        }
      } catch (error) {
        console.error(`❌ Erro ao criar "${category.name}":`, error.message);
      }
    }
    
    console.log('\n📊 RESUMO:');
    console.log(`✅ Criadas: ${created} categorias`);
    console.log(`⏭️  Ignoradas: ${skipped} categorias (já existiam)`);
    console.log(`📦 Total: ${created + skipped} categorias globais`);
    
    // Verificar total de categorias no banco
    const totalCategories = await prisma.category.count();
    const globalCount = await prisma.category.count({ where: { isGlobal: true } });
    const userCount = await prisma.category.count({ where: { isGlobal: false } });
    
    console.log('\n🗃️  ESTATÍSTICAS DO BANCO:');
    console.log(`🌍 Categorias globais: ${globalCount}`);
    console.log(`👤 Categorias de usuários: ${userCount}`);
    console.log(`📦 Total: ${totalCategories}`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Conexão encerrada');
  }
}

createGlobalCategories();
