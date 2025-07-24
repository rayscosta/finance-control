import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000/api';

async function createTestUser() {
  try {
    console.log('👤 TENTANDO LOGIN COM USUÁRIO EXISTENTE...\n');
    
    // Primeiro tentar login
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'rhmg@proton.me',
        password: 'CostaRay23!'
      })
    });

    const loginData = await loginResponse.json();
    
    if (loginResponse.ok) {
      console.log('✅ Login realizado com sucesso!');
      console.log('📧 Email:', loginData.user?.email);
      console.log('👤 Nome:', loginData.user?.name);
      console.log('🔑 Token:', loginData.token?.substring(0, 20) + '...');
      return loginData.token;
    } else {
      console.log('❌ Login falhou, tentando criar novo usuário...');
      
      // Se login falhar, criar novo usuário
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Usuário Teste Categoria',
          email: 'teste.categoria@exemplo.com',
          password: '123456789'
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ Usuário criado com sucesso!');
        console.log('📧 Email:', data.user?.email);
        console.log('👤 Nome:', data.user?.name);
        console.log('🔑 Token:', data.token?.substring(0, 20) + '...');
        return data.token;
      } else {
        console.log('❌ Erro ao criar usuário:', data.message);
        return null;
      }
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
    return null;
  }
}

async function testCategoryAPIs(token) {
  console.log('\n🏷️  TESTANDO APIs DE CATEGORIA...\n');

  try {
    // 1. Testar categorias globais
    console.log('1️⃣ Buscando categorias globais...');
    const globalResponse = await fetch(`${API_BASE}/categories/global`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const globalData = await globalResponse.json();
    
    if (globalResponse.ok) {
      console.log(`✅ ${globalData.data.length} categorias globais encontradas`);
      console.log('Primeiras 3:', globalData.data.slice(0, 3).map(c => `${c.icon} ${c.name} (${c.type})`));
    } else {
      console.log('❌ Erro:', globalData.message);
    }

    // 2. Testar categorias disponíveis
    console.log('\n2️⃣ Buscando categorias disponíveis...');
    const availableResponse = await fetch(`${API_BASE}/categories`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const availableData = await availableResponse.json();
    
    if (availableResponse.ok) {
      console.log(`✅ ${availableData.data.length} categorias disponíveis para o usuário`);
      const incomeCategories = availableData.data.filter(c => c.type === 'INCOME');
      const expenseCategories = availableData.data.filter(c => c.type === 'EXPENSE');
      console.log(`💰 Receitas: ${incomeCategories.length}`);
      console.log(`💸 Despesas: ${expenseCategories.length}`);
    } else {
      console.log('❌ Erro:', availableData.message);
    }

    // 3. Testar estatísticas
    console.log('\n3️⃣ Buscando estatísticas...');
    const statsResponse = await fetch(`${API_BASE}/categories/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const statsData = await statsResponse.json();
    
    if (statsResponse.ok) {
      console.log('📊 Estatísticas:');
      console.log(`   🌍 Globais: ${statsData.data.global}`);
      console.log(`   👤 Do usuário: ${statsData.data.user}`);
      console.log(`   📦 Total: ${statsData.data.total}`);
      console.log(`   💰 Receitas: ${statsData.data.income}`);
      console.log(`   💸 Despesas: ${statsData.data.expense}`);
    } else {
      console.log('❌ Erro:', statsData.message);
    }

    // 4. Criar categoria personalizada
    console.log('\n4️⃣ Criando categoria personalizada...');
    const createResponse = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Renda Extra',
        type: 'INCOME',
        color: '#10b981',
        icon: '💎'
      })
    });
    const createData = await createResponse.json();
    
    if (createResponse.ok) {
      console.log('✅ Categoria criada com sucesso!');
      console.log(`   ${createData.data.icon} ${createData.data.name} (${createData.data.type})`);
      console.log(`   🎨 Cor: ${createData.data.color}`);
      
      // 5. Verificar categorias do usuário
      console.log('\n5️⃣ Verificando categorias do usuário...');
      const userResponse = await fetch(`${API_BASE}/categories/user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const userData = await userResponse.json();
      
      if (userResponse.ok) {
        console.log(`✅ ${userData.data.length} categoria(s) personalizada(s)`);
        userData.data.forEach(c => console.log(`   ${c.icon} ${c.name} (${c.type})`));
      }
    } else {
      console.log('❌ Erro ao criar categoria:', createData.message);
    }

  } catch (error) {
    console.error('❌ Erro nas APIs:', error.message);
  }
}

async function main() {
  console.log('🧪 TESTE COMPLETO DO SISTEMA DE CATEGORIAS');
  console.log('==========================================\n');
  
  const token = await createTestUser();
  
  if (token) {
    await testCategoryAPIs(token);
    console.log('\n🎉 Teste concluído com sucesso!');
  } else {
    console.log('\n❌ Falha no teste - usuário não foi criado');
  }
}

main();
