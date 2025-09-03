# Project Conventions - Budget Manager 2025

## Überblick
Dieses Dokument definiert die Projekt-Konventionen für das Budget Manager 2025 Projekt, einschließlich Workflow, Entwicklungsprozesse und Qualitätsstandards.

## 🎯 Projekt-Vision und Ziele

### Vision
Ein modernes, deutsches Budget-Management-System, das Unternehmen dabei hilft, ihre Budgets effizient zu planen, zu verwalten und zu überwachen.

### Kernziele
1. **Deutsche Geschäftslogik**: Anpassung an deutsche Buchhaltungs- und Geschäftspraktiken
2. **Echtzeit-Überwachung**: Live-Updates für Budget-Status und Projekt-Fortschritt
3. **Benutzerfreundlichkeit**: Intuitive deutsche Benutzeroberfläche
4. **Skalierbarkeit**: Modulare Architektur für zukünftige Erweiterungen
5. **Datenintegrität**: Robuste Validierung und Audit-Trails

## 🏗️ Projekt-Architektur

### Technology Stack
```
Frontend:  React 18 + TypeScript + Tailwind CSS + Vite
Backend:   Node.js + Express + ES Modules
Database:  Supabase (PostgreSQL)
Real-time: WebSocket (Socket.io)
Testing:   Jest + React Testing Library + Supertest
Linting:   ESLint + Prettier
```

### Architektur-Prinzipien
1. **Separation of Concerns**: Klare Trennung zwischen Frontend, Backend und Datenbank
2. **API-First**: RESTful API als zentrale Schnittstelle
3. **Component-Based**: Wiederverwendbare React-Komponenten
4. **Service Layer**: Geschäftslogik in separaten Service-Schichten
5. **Type Safety**: Vollständige TypeScript-Abdeckung

## 📁 Projekt-Struktur

```
budget-manager-2025/
├── frontend/                 # React Frontend
│   ├── src/
│   │   ├── components/      # Wiederverwendbare Komponenten
│   │   │   ├── dashboard/   # Dashboard-spezifisch
│   │   │   ├── projects/    # Projekt-Management
│   │   │   ├── budget/      # Budget-Verwaltung
│   │   │   └── transfers/   # Budget-Transfers
│   │   ├── pages/           # Seiten-Komponenten
│   │   ├── hooks/           # Custom React Hooks
│   │   ├── utils/           # Helper-Funktionen
│   │   └── types/           # TypeScript Definitionen
│   ├── public/              # Statische Assets
│   └── tests/               # Frontend Tests
├── backend/                 # Node.js Backend
│   ├── src/
│   │   ├── controllers/     # Request Handler
│   │   ├── services/        # Business Logic
│   │   ├── routes/          # API Routes
│   │   ├── middleware/      # Express Middleware
│   │   ├── utils/           # Helper-Funktionen
│   │   └── config/          # Konfiguration
│   └── tests/               # Backend Tests
├── doc/                     # Dokumentation
│   ├── stories/             # User Stories
│   ├── conventions/         # Projekt-Konventionen
│   └── api/                 # API-Dokumentation
├── scripts/                 # Build & Deploy Scripts
└── tests/                   # Integration Tests
```

## 🔄 Development Workflow

### 1. Git Workflow (Feature Branch)
```bash
# 1. Neuen Feature Branch erstellen
git checkout -b feature/budget-allocation-slider

# 2. Entwicklung durchführen
# - Code schreiben
# - Tests hinzufügen
# - Dokumentation aktualisieren

# 3. Commits mit aussagekräftigen Messages
git commit -m "feat: add budget allocation slider component"

# 4. Push und Pull Request erstellen
git push origin feature/budget-allocation-slider

# 5. Code Review durchführen lassen
# 6. Nach Approval: Merge in main branch
```

### 2. Branch-Naming Konventionen
```bash
feature/feature-name        # Neue Features
bugfix/bug-description      # Bug Fixes
hotfix/critical-fix         # Kritische Fixes
refactor/component-name     # Code Refactoring
docs/documentation-update   # Dokumentation
test/test-improvements      # Test-Verbesserungen
```

### 3. Commit Message Format
```bash
# Format: <type>(<scope>): <description>
feat(budget): add allocation slider component
fix(projects): resolve form validation errors
docs(api): update budget endpoints documentation
test(dashboard): add unit tests for budget overview
refactor(services): improve error handling
style(components): fix linting issues
```

### Commit Types:
- `feat`: Neue Features
- `fix`: Bug Fixes
- `docs`: Dokumentation
- `style`: Code-Formatierung
- `refactor`: Code-Umstrukturierung
- `test`: Tests
- `chore`: Build/Tooling

## 🧪 Testing Strategy

### 1. Test-Pyramide
```
                    E2E Tests (10%)
                 ↗                ↖
            Integration Tests (20%)
          ↗                        ↖
     Unit Tests (70%)
```

### 2. Test-Kategorien

#### Unit Tests (70%)
```typescript
// Beispiel: Utility-Funktionen testen
describe('formatGermanCurrency', () => {
  it('should format positive amounts correctly', () => {
    expect(formatGermanCurrency(150000)).toBe('150.000,00 €');
  });
});

// Beispiel: React-Komponenten testen
describe('ProjectCard', () => {
  it('should display project information correctly', () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText(mockProject.name)).toBeInTheDocument();
  });
});
```

#### Integration Tests (20%)
```typescript
// Beispiel: API-Endpunkt testen
describe('GET /api/projects', () => {
  it('should return all projects with correct structure', async () => {
    const response = await request(app)
      .get('/api/projects')
      .expect(200);
      
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toBeInstanceOf(Array);
  });
});
```

#### E2E Tests (10%)
```typescript
// Beispiel: User Journey testen
describe('Project Creation Flow', () => {
  it('should allow user to create a new project', async () => {
    await page.goto('/projects');
    await page.click('[data-testid="create-project-button"]');
    await page.fill('[data-testid="project-name"]', 'Test Project');
    await page.fill('[data-testid="project-budget"]', '50000');
    await page.click('[data-testid="submit-button"]');
    
    await expect(page.locator('.success-message')).toBeVisible();
  });
});
```

### 3. Test-Ausführung
```bash
# Alle Tests ausführen
npm test

# Frontend Tests
npm run test:frontend

# Backend Tests  
npm run test:backend

# E2E Tests
npm run test:e2e

# Test Coverage
npm run test:coverage
```

### 4. Test-Qualitätsziele
- **Unit Test Coverage**: Mindestens 80%
- **Integration Test Coverage**: Kritische API-Endpunkte
- **E2E Test Coverage**: Hauptbenutzer-Workflows
- **Performance Tests**: API-Response-Zeiten < 500ms

## 🔍 Code Quality Standards

### 1. Linting und Formatting
```json
// .eslintrc.js
{
  "extends": [
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "no-console": "warn",
    "prefer-const": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "react/prop-types": "off"
  }
}
```

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### 2. Pre-commit Hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run test"
    }
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ]
  }
}
```

### 3. Code Review Checklist
#### Funktionalität
- [ ] Code erfüllt die Anforderungen
- [ ] Edge Cases sind behandelt
- [ ] Error Handling ist implementiert
- [ ] Performance ist angemessen

#### Code-Qualität
- [ ] Code ist lesbar und verständlich
- [ ] Naming Conventions werden befolgt
- [ ] DRY-Prinzip wird eingehalten
- [ ] SOLID-Prinzipien werden befolgt

#### Tests
- [ ] Unit Tests sind vorhanden
- [ ] Tests decken wichtige Szenarien ab
- [ ] Tests sind aussagekräftig benannt
- [ ] Alle Tests bestehen

#### Sicherheit
- [ ] Input-Validierung ist implementiert
- [ ] Keine Secrets im Code
- [ ] SQL-Injection-Schutz
- [ ] XSS-Schutz

## 📊 Performance Standards

### 1. Frontend Performance
```typescript
// Performance-Metriken
const PERFORMANCE_TARGETS = {
  FIRST_CONTENTFUL_PAINT: 1500,    // ms
  LARGEST_CONTENTFUL_PAINT: 2500,  // ms
  CUMULATIVE_LAYOUT_SHIFT: 0.1,    // score
  FIRST_INPUT_DELAY: 100,           // ms
};

// Performance-Optimierungen
const ProjectList = React.memo(({ projects }) => {
  const sortedProjects = useMemo(() => 
    projects.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [projects]
  );
  
  return (
    <div>
      {sortedProjects.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
});
```

### 2. Backend Performance
```javascript
// API-Response-Zeit Ziele
const API_PERFORMANCE_TARGETS = {
  GET_ENDPOINTS: 200,     // ms
  POST_ENDPOINTS: 500,    // ms
  PUT_ENDPOINTS: 300,     // ms
  DELETE_ENDPOINTS: 200,  // ms
};

// Performance-Monitoring
const performanceMonitoring = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`📊 ${req.method} ${req.path} - ${duration}ms`);
    
    if (duration > API_PERFORMANCE_TARGETS[req.method + '_ENDPOINTS']) {
      console.warn(`⚠️ Slow API call: ${req.method} ${req.path} took ${duration}ms`);
    }
  });
  
  next();
};
```

### 3. Database Performance
```sql
-- Index-Strategien für häufige Queries
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_budget_year ON projects(budget_year);
CREATE INDEX idx_annual_budgets_year_status ON annual_budgets(year, status);

-- Query-Performance Ziele
-- Einfache SELECT: < 50ms
-- JOIN Queries: < 200ms
-- Aggregation Queries: < 500ms
```

## 🔒 Security Standards

### 1. Input Validation
```javascript
// Backend Validation
import { body, validationResult } from 'express-validator';

export const createProjectValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .escape()
    .withMessage('Projektname ist erforderlich (1-255 Zeichen)'),
  body('planned_budget')
    .isFloat({ min: 0, max: 999999999 })
    .withMessage('Geplantes Budget muss eine positive Zahl sein'),
];
```

### 2. Environment Security
```bash
# Sichere Environment-Variablen
NODE_ENV=production
SUPABASE_SERVICE_ROLE_KEY=***NEVER_COMMIT_THIS***
JWT_SECRET=***GENERATE_RANDOM_SECRET***
API_RATE_LIMIT=100
```

### 3. API Security
```javascript
// Rate Limiting
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Zu viele Anfragen von dieser IP'
});

// CORS Configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000'],
  credentials: true
};
```

## 📈 Monitoring und Logging

### 1. Application Logging
```javascript
// Strukturiertes Logging
const logger = {
  info: (message, meta = {}) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  },
  
  error: (message, error = {}, meta = {}) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: {
        message: error.message,
        stack: error.stack
      },
      timestamp: new Date().toISOString(),
      ...meta
    }));
  }
};
```

### 2. Performance Monitoring
```javascript
// API-Performance Tracking
const trackApiPerformance = (req, res, next) => {
  const startTime = process.hrtime();
  
  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds * 1000 + nanoseconds / 1000000;
    
    logger.info('API Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: Math.round(duration),
      userAgent: req.get('User-Agent')
    });
  });
  
  next();
};
```

### 3. Error Tracking
```javascript
// Globaler Error Handler
const globalErrorHandler = (error, req, res, next) => {
  logger.error('Unhandled Error', error, {
    method: req.method,
    path: req.path,
    body: req.body,
    query: req.query
  });
  
  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'Ein unerwarteter Fehler ist aufgetreten',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack 
    })
  });
};
```

## 🚀 Deployment Strategy

### 1. Environment Setup
```bash
# Development
NODE_ENV=development
PORT=3001
SUPABASE_URL=https://dev-project.supabase.co

# Staging  
NODE_ENV=staging
PORT=3001
SUPABASE_URL=https://staging-project.supabase.co

# Production
NODE_ENV=production
PORT=3001
SUPABASE_URL=https://prod-project.supabase.co
```

### 2. Build Process
```json
// package.json scripts
{
  "scripts": {
    "dev": "node scripts/start-dev.js",
    "build": "npm run build:frontend && npm run build:backend",
    "build:frontend": "cd frontend && npm run build",
    "build:backend": "cd backend && npm run build",
    "test:all": "npm run test:frontend && npm run test:backend",
    "lint:all": "npm run lint:frontend && npm run lint:backend",
    "deploy:staging": "npm run test:all && npm run build && deploy-to-staging.sh",
    "deploy:production": "npm run test:all && npm run build && deploy-to-production.sh"
  }
}
```

### 3. Deployment Checklist
#### Pre-Deployment
- [ ] Alle Tests bestehen
- [ ] Code Review ist abgeschlossen
- [ ] Performance-Tests sind erfolgreich
- [ ] Security-Scan ist durchgeführt
- [ ] Dokumentation ist aktualisiert

#### Deployment
- [ ] Database-Migrationen sind angewendet
- [ ] Environment-Variablen sind konfiguriert
- [ ] SSL-Zertifikate sind gültig
- [ ] Monitoring ist aktiviert
- [ ] Backup-Strategie ist implementiert

#### Post-Deployment
- [ ] Health-Checks sind erfolgreich
- [ ] Performance-Metriken sind normal
- [ ] Error-Logs sind überprüft
- [ ] User-Feedback ist gesammelt
- [ ] Rollback-Plan ist bereit

## 📚 Documentation Standards

### 1. Code Documentation
```typescript
/**
 * Calculates the budget utilization rate for a project
 * 
 * @param allocatedBudget - The total budget allocated to the project
 * @param consumedBudget - The amount of budget already consumed
 * @returns The utilization rate as a percentage (0-100+)
 * 
 * @example
 * ```typescript
 * const rate = calculateBudgetUtilization(100000, 75000);
 * console.log(rate); // 75
 * ```
 */
const calculateBudgetUtilization = (
  allocatedBudget: number,
  consumedBudget: number
): number => {
  if (allocatedBudget === 0) return 0;
  return (consumedBudget / allocatedBudget) * 100;
};
```

### 2. API Documentation
```yaml
# OpenAPI/Swagger Format
paths:
  /api/projects:
    get:
      summary: Alle Projekte abrufen
      description: Ruft eine Liste aller Projekte mit Budget-Informationen ab
      responses:
        200:
          description: Erfolgreiche Antwort
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Project'
```

### 3. User Stories Documentation
```markdown
# Story 1.2.3: Budget-Allocation mit intelligentem Slider

## Beschreibung
Als Projektmanager möchte ich das verfügbare Budget visuell über einen Slider einem Projekt zuweisen können, damit ich schnell und intuitiv Budget-Entscheidungen treffen kann.

## Akzeptanzkriterien
- [ ] Slider zeigt verfügbares Budget an
- [ ] Echtzeit-Validierung der Budget-Verfügbarkeit
- [ ] Visuelle Feedback bei Über-/Unterschreitung
- [ ] Integration mit Jahresbudget-System

## Definition of Done
- [ ] Feature ist implementiert
- [ ] Unit Tests sind geschrieben
- [ ] Integration Tests bestehen
- [ ] Code Review ist abgeschlossen
- [ ] Dokumentation ist aktualisiert
```

## 🔄 Continuous Integration

### 1. GitHub Actions Workflow
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint:all
      - run: npm run test:all
      - run: npm run build
```

### 2. Quality Gates
```yaml
# Qualitäts-Anforderungen für Merge
quality_gates:
  test_coverage: 80%
  lint_errors: 0
  security_vulnerabilities: 0
  performance_regression: 0%
```

---

**Letzte Aktualisierung:** 29. August 2025  
**Version:** 1.0  
**Autor:** Budget Manager 2025 Development Team

