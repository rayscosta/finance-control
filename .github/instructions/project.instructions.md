# Finance Control - Project Instructions

## Overview

A complete web-based financial control system (with PWA capabilities) for:
- Managing income and expenses (transactions, categories, recurring entries)
- Tracking assets and liabilities (bank accounts, investments, credit cards)
- Cash flow forecasting and balance projection (moving averages, linear regression)
- Generating reports, dashboards, and data export/import (CSV, OFX)
- Bank statement and credit card invoice import with intelligent processing

---

## Current Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt password hashing
- **Security**: Helmet, CORS, rate limiting, audit logs
- **Validation**: Joi schemas
- **Email**: Nodemailer for notifications
- **Logging**: Winston for structured logs
- **File Processing**: Multer for uploads, pdf-parse for PDF extraction

### Frontend
- **Core**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Charts**: Chart.js for data visualization
- **Date Handling**: date-fns and Moment.js
- **Server**: live-server for development
- **Architecture**: SPA-style navigation with modular components

### Database Architecture
- **ORM**: Prisma Client
- **Migrations**: Prisma Migrate
- **Seeding**: Automated seed scripts for categories
- **Schema**: Relational model with optimized hybrid category system

### Development Tools
- **TypeScript Compiler**: tsc with watch mode
- **Hot Reload**: nodemon for backend, live-server for frontend
- **Testing**: Jest with ts-jest
- **Concurrent Tasks**: concurrently for running multiple dev processes
- **Code Quality**: TypeScript strict mode

---

## Core Features (Implemented)

### ✅ Authentication & User Management
- Email/password registration with strong password validation
- JWT-based authentication with secure token storage
- Session management (localStorage/sessionStorage)
- Password reset flow with email tokens
- User profile management
- Audit logging for security events

### ✅ Account Management
- Multiple account types: checking, savings, credit, investment, crypto
- Account balance tracking
- Account metadata (bank, agency, account number)
- Active/inactive status management
- Multi-account support per user

### ✅ Transaction System
- Income and expense tracking
- Transfer between accounts
- Category assignment
- Recurring transactions (daily, weekly, monthly, yearly)
- Transaction metadata (reference numbers, extract data)
- Date-based filtering and queries
- Full CRUD operations

### ✅ Hybrid Category System
- **47 pre-configured global categories** (isGlobal=true, userId=null)
- **User-specific custom categories** (isGlobal=false, userId=userX)
- Performance optimized: 90%+ fewer database records
- Supports income and expense types
- Color and icon customization
- Soft delete (isActive flag)

### ✅ Credit Card Management
- Credit card registration with bank details
- Spending limit tracking
- Billing cycle management (closing day, due day)
- Credit card transactions with installments
- Bill generation and payment tracking
- Statement import capability

### ✅ Budget System
- Monthly budgets per category
- Spending vs budget tracking
- Alert thresholds (90% notification)
- Multi-category budget management
- Year-over-year budget comparison

### ✅ Dashboard & Analytics
- Consolidated balance view
- Transaction statistics (last 30/90 days)
- Category breakdown charts
- Financial health score
- Recent transaction feed
- Quick action shortcuts

### ✅ Import/Export
- CSV import with column mapping
- OFX file support
- PDF bank statement parsing
- Credit card invoice extraction
- Drag-and-drop file upload
- Import history tracking
- Data validation and preview

### ✅ Reporting
- Filterable transaction lists (date, account, category)
- Category spending analysis
- Cash flow projections
- Export to CSV
- Monthly/yearly summaries

---

## Business Rules

### User Management
- Users can create multiple accounts and custom categories
- Each user has isolated data (multi-tenant architecture)
- Global categories are shared across all users (read-only)
- User can create unlimited custom categories

### Transactions
- Must be linked to an account and user
- Optional category assignment
- Support for recurring patterns
- Can store metadata from import sources
- Date cannot be in future for completed transactions

### Category System
- Global categories cannot be edited/deleted by users
- Users can create categories only for themselves
- Category names must be unique per user
- Categories can be marked inactive but not deleted (soft delete)

### Budget System
- One budget per category per month
- Alerts trigger at 90% of budget limit
- Spent amount auto-calculated from transactions
- Cannot set negative budget amounts

### Credit Cards
- Billing cycle must be valid (closing day < due day)
- Transactions assigned to appropriate billing cycle
- Installments tracked individually
- Payment marks entire bill as paid

### Cash Flow Projection
- MVP: Moving average by category + recurring transaction adjustment
- Considers confirmed recurring income (salary, subscriptions)
- Projects 30/90 day outlook
- Future: Linear regression, Prophet/ARIMA models

---

## Security & Compliance

### Implemented Security Measures
- ✅ Password hashing with bcrypt (cost factor 10)
- ✅ JWT token authentication with expiration
- ✅ HTTPS enforcement via Helmet middleware
- ✅ Rate limiting on authentication endpoints
- ✅ CORS configuration for frontend origin
- ✅ SQL injection prevention via Prisma ORM
- ✅ Input validation with Joi schemas
- ✅ Audit logging for sensitive operations
- ✅ User agent and IP tracking

### Required Security Enhancements
- [ ] Implement TLS/SSL certificates for production
- [ ] Add 2FA support (TOTP)
- [ ] Implement data encryption at rest for sensitive fields
- [ ] Add brute force protection with exponential backoff
- [ ] Set up automated backup system
- [ ] Implement data retention policies
- [ ] Add GDPR compliance features (data export, account deletion)

---

## API Endpoints (Implemented)

### Authentication (`/api/auth`)
- `POST /register` - Create new user account
- `POST /login` - Authenticate user, return JWT
- `GET /me` - Get authenticated user profile (protected)
- `PUT /profile` - Update user profile (protected)
- `POST /forgot-password` - Request password reset email
- `POST /reset-password` - Reset password with token

### Accounts (`/api/accounts`)
- `GET /` - List all accounts for user (protected)
- `GET /:id` - Get specific account details (protected)
- `POST /` - Create new account (protected)
- `PUT /:id` - Update account (protected)
- `DELETE /:id` - Delete account (protected)

### Transactions (`/api/transactions`)
- `GET /` - List transactions with filters (protected)
- `GET /:id` - Get transaction details (protected)
- `POST /` - Create transaction (protected)
- `PUT /:id` - Update transaction (protected)
- `DELETE /:id` - Delete transaction (protected)
- `GET /stats` - Get transaction statistics (protected)
- `GET /categories` - Get spending by category (protected)
- `GET /trend` - Get transaction trend data (protected)

### Categories (`/api/categories`)
- `GET /available` - Get global + user categories (protected)
- `GET /global` - Get only global categories (protected)
- `GET /user` - Get only user custom categories (protected)
- `GET /stats` - Get category statistics (protected)
- `POST /` - Create custom category (protected)
- `PUT /:id` - Update user category (protected)
- `DELETE /:id` - Soft delete user category (protected)

### Credit Cards (`/api/credit-cards`)
- `GET /` - List user credit cards (protected)
- `GET /:id` - Get card details (protected)
- `POST /` - Create credit card (protected)
- `PUT /:id` - Update credit card (protected)
- `DELETE /:id` - Delete credit card (protected)
- `GET /:id/bills` - Get card bills (protected)
- `POST /:id/transactions` - Add card transaction (protected)

### Budgets (`/api/budgets`)
- `GET /` - List budgets (protected)
- `GET /:id` - Get budget details (protected)
- `POST /` - Create budget (protected)
- `PUT /:id` - Update budget (protected)
- `DELETE /:id` - Delete budget (protected)
- `GET /month/:month/year/:year` - Get budgets for specific period (protected)

### Import/Export (`/api/import`, `/api/export`)
- `POST /import/csv` - Import CSV file (protected)
- `POST /import/ofx` - Import OFX file (protected)
- `POST /import/pdf` - Import PDF statement (protected)
- `GET /export/transactions` - Export transactions as CSV (protected)
- `GET /import/history` - Get import history (protected)

---

## Database Schema (Prisma)

### Key Models
- **User**: Authentication and profile data
- **Account**: Bank accounts, credit cards, investment accounts
- **Transaction**: Income/expense records with category links
- **Category**: Hybrid system (global + user-specific)
- **CreditCard**: Credit card details and limits
- **CreditCardTransaction**: Card-specific transactions
- **CreditCardBill**: Monthly card statements
- **Budget**: Monthly budget allocations by category
- **AuditLog**: Security and change tracking

### Enumerations
- `AccountType`: CHECKING, SAVINGS, CREDIT, INVESTMENT, CRYPTO
- `CategoryType`: INCOME, EXPENSE
- `TransactionType`: INCOME, EXPENSE, TRANSFER
- `RecurringType`: DAILY, WEEKLY, MONTHLY, YEARLY

---

## Frontend Architecture

### Pages (Implemented)
- `index.html` - Landing page with features showcase
- `login.html` - Authentication (login/register tabs)
- `dashboard.html` - Main dashboard with charts and metrics
- `accounts.html` - Account management (CRUD)
- `transactions.html` - Transaction list and filters
- `categories.html` - Category management (view global, create custom)
- `import.html` - File upload and import wizard
- `test-auth.html` - Authentication debugging tool

### JavaScript Modules
- `app.js` - Core utilities, API base URL, notifications
- `auth.js` - Authentication manager (login, register, token handling)
- `accounts.js` - Account CRUD operations
- `transactions.js` - Transaction management
- `dashboard.js` - Dashboard data fetching and chart rendering
- `import.js` - File upload and import logic

### CSS Architecture
- `auth.css` - Authentication pages styling
- `dashboard-base.css` - Common dashboard components
- `accounts.css` - Account-specific styles
- `transactions.css` - Transaction page styles
- `import.css` - Import page styles
- Responsive design with mobile-first approach

---

## Cash Flow Forecasting (Roadmap)

### MVP (Current/Planned)
- Moving average calculation by category
- Recurring transaction projection
- 30/90 day forecast based on historical data
- Simple balance projection

### Intermediate (Future)
- Linear regression for trend analysis
- Seasonal adjustment factors
- Confidence intervals for projections

### Advanced (Future)
- Time series models (Prophet, ARIMA)
- Machine learning predictions
- Anomaly detection
- Smart budget recommendations

---

## TimescaleDB Integration (Planned)

### Why TimescaleDB?
- **Optimized for time-series data** - Perfect for financial transactions
- **PostgreSQL compatibility** - Seamless Prisma ORM integration
- **Automatic data partitioning** - Better performance for large datasets
- **Time-based aggregations** - Fast queries for reports and analytics
- **Data retention policies** - Automatic archiving of old data
- **Continuous aggregates** - Pre-computed rollups for dashboards

### Implementation Plan

#### Phase 1: Setup
```sql
-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Convert transactions table to hypertable
SELECT create_hypertable('transactions', 'date', 
  chunk_time_interval => INTERVAL '1 month'
);

-- Create continuous aggregate for daily summaries
CREATE MATERIALIZED VIEW daily_transaction_summary
WITH (timescaledb.continuous) AS
SELECT 
  time_bucket('1 day', date) AS day,
  "userId",
  "categoryId",
  type,
  COUNT(*) as transaction_count,
  SUM(amount) as total_amount
FROM transactions
GROUP BY day, "userId", "categoryId", type;
```

#### Phase 2: Query Optimization
- Replace date range queries with TimescaleDB time functions
- Use continuous aggregates for dashboard metrics
- Implement data retention policies for old transactions

#### Phase 3: Advanced Features
- Real-time materialized views for instant dashboard updates
- Compression for historical data (older than 6 months)
- Data tiering (hot/warm/cold storage)

### Migration Path
1. Update Prisma schema to support TimescaleDB-specific features
2. Create migration script to convert existing data
3. Update API queries to leverage TimescaleDB functions
4. Add continuous aggregates for common report queries
5. Implement data retention and compression policies

---

## Development Workflow

### Start Development Server
```bash
npm run dev
```
This runs:
- TypeScript compiler in watch mode
- Nodemon to auto-restart server on changes
- Live-server for frontend on port 8080

### Run Tests
```bash
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage report
```

### Database Operations
```bash
npm run migrate         # Run migrations
npm run seed           # Seed database with categories
npx prisma studio      # Open database GUI
```

### Build for Production
```bash
npm run build          # Compile TypeScript
npm start              # Run production server
```

---

## Environment Variables

Create `.env` file:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/finance_control"

# JWT
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV=development

# Email (for password reset)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Frontend
FRONTEND_URL="http://localhost:8080"
```

---

## Testing Strategy

### Unit Tests (Jest + ts-jest)
- Service layer business logic
- Utility functions
- Data transformations
- Category hybrid system logic

### Integration Tests
- API endpoint responses
- Database operations
- Authentication flow
- File import processing

### E2E Tests (Planned)
- Complete user workflows
- Frontend integration
- Payment flows
- Report generation

---

## Performance Optimization

### Database
- ✅ Hybrid category system (90% fewer records)
- ✅ Indexed foreign keys
- ✅ Efficient Prisma queries
- [ ] Query result caching with Redis
- [ ] TimescaleDB for time-series optimization
- [ ] Database connection pooling

### API
- ✅ JWT stateless authentication
- ✅ Pagination for large datasets
- [ ] Response compression
- [ ] API rate limiting per user
- [ ] GraphQL for flexible queries

### Frontend
- ✅ Lazy loading of charts
- ✅ Debounced search inputs
- [ ] Service worker for offline capability
- [ ] IndexedDB for local caching
- [ ] Code splitting and tree shaking

---

## Deployment (Planned)

### Containerization
```yaml
# docker-compose.yml
services:
  postgres:
    image: timescale/timescaledb:latest-pg16
    volumes:
      - pgdata:/var/lib/postgresql/data
  
  api:
    build: .
    depends_on:
      - postgres
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/finance
  
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
```

### Cloud Deployment Options
- **Backend**: AWS ECS, Google Cloud Run, or DigitalOcean App Platform
- **Database**: AWS RDS (TimescaleDB), Timescale Cloud, or Supabase
- **Static Assets**: AWS S3 + CloudFront, Vercel, or Netlify
- **Backups**: Automated daily backups to S3

---

## Monitoring & Observability

### Logging (Winston)
- Structured JSON logs
- Log levels: error, warn, info, debug
- Audit trail for sensitive operations
- IP and user agent tracking

### Metrics (Planned)
- Request/response times
- Database query performance
- Authentication success/failure rates
- Import processing times
- Error rates by endpoint

### Alerting (Planned)
- Failed login attempts threshold
- Database connection failures
- High error rates
- Budget threshold alerts

---

## Roadmap & Future Features

### Short-term (Next Sprint)
- [ ] Complete cash flow forecasting MVP
- [ ] Implement TimescaleDB integration
- [ ] Add data export in multiple formats
- [ ] Enhanced mobile responsiveness
- [ ] Dark mode theme

### Medium-term (Next Quarter)
- [ ] Progressive Web App (PWA) capabilities
- [ ] Real-time notifications (WebSocket)
- [ ] Automated bill payment reminders
- [ ] Receipt image upload and OCR
- [ ] Multi-currency support

### Long-term (Next Year)
- [ ] Machine learning for spending insights
- [ ] Integration with banking APIs (Open Banking)
- [ ] Family/shared account management
- [ ] Investment portfolio tracking
- [ ] Tax report generation
- [ ] Mobile app (React Native)

---

## Code Standards

### TypeScript
- Use strict mode
- Explicit return types for functions
- Interface over type when possible
- Avoid `any` type
- Use enums for fixed sets of values

### Naming Conventions
- **Variables/Functions**: camelCase (`calculateBalance`, `userId`)
- **Classes/Interfaces**: PascalCase (`UserService`, `ApiResponse`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_LOGIN_ATTEMPTS`, `JWT_SECRET`)
- **Files**: kebab-case (`user-service.ts`, `auth-controller.ts`)
- **Database tables**: snake_case via Prisma `@@map`

### File Organization
```
src/
├── controllers/    # Request handlers
├── services/       # Business logic
├── routes/         # API routing
├── middleware/     # Express middleware
├── types/          # TypeScript types/interfaces
├── utils/          # Helper functions
├── config/         # Configuration files
└── server.ts       # Application entry point
```

### Error Handling
- Always use try-catch for async operations
- Return proper HTTP status codes
- Log errors with context
- Never expose sensitive data in error messages
- Use custom error classes for domain errors

---

## Contributing Guidelines

### Before Committing
1. Run tests: `npm test`
2. Check TypeScript compilation: `npm run build`
3. Ensure no console.logs in production code
4. Update documentation if API changes
5. Follow commit message conventions

### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example:
```
feat(auth): add 2FA support with TOTP

- Implement TOTP token generation
- Add QR code generation for authenticator apps
- Update login flow to verify TOTP token

Closes #123
```

---

## Support & Documentation

### Internal Documentation
- API documentation: Auto-generated from JSDoc comments
- Database schema: Prisma schema documentation
- Frontend components: Inline comments in code

### External Resources
- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Guide](https://expressjs.com/)
- [Chart.js Documentation](https://www.chartjs.org/)
- [TimescaleDB Documentation](https://docs.timescale.com/)

---

## License

MIT License - See LICENSE file for details

---

**Last Updated**: November 2025  
**Version**: 1.0.0  
**Status**: Production-ready MVP with planned enhancements