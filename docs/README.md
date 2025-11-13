# 📊 Diagramas do Finance Control

Este diretório contém a documentação visual do sistema usando diagramas Mermaid.

## 📚 Conteúdo

- **entity-relationship.md** - Diagrama Entidade-Relacionamento (ERD) do banco de dados
- **class-diagram.md** - Diagrama de Classes UML da arquitetura
- **sequence-diagrams.md** - Diagramas de Sequência dos principais fluxos
- **architecture.md** - Visão geral da arquitetura do sistema

## 🔍 Como Visualizar

Os diagramas Mermaid podem ser visualizados:
1. Diretamente no GitHub (renderização automática)
2. No VS Code com a extensão "Markdown Preview Mermaid Support"
3. Em [mermaid.live](https://mermaid.live) (copie e cole o código)

## 🎨 Tipos de Diagramas

### Entity Relationship Diagram (ERD)
Mostra a estrutura do banco de dados PostgreSQL com Prisma:
- Tabelas e seus campos
- Tipos de dados
- Relacionamentos (1:N, N:M)
- Constraints e índices

### Class Diagram (UML)
Mostra a arquitetura backend em TypeScript:
- Controllers
- Services  
- Middleware
- Models
- Repositories

### Sequence Diagrams
Mostra fluxos de execução:
- Autenticação (Login/Registro)
- Criação de transações
- Geração de relatórios
- Importação de extratos

### Architecture Diagram
Visão macro do sistema:
- Frontend (HTML/JS)
- Backend (Node.js + Express)
- Database (PostgreSQL)
- Integrações externas
