# Naming Conventions - Budget Manager 2025

## Überblick
Dieses Dokument definiert die Namenskonventionen für das Budget Manager 2025 Projekt, um Konsistenz und Verständlichkeit im gesamten Codebase sicherzustellen.

## 🌍 Sprach-Strategie

### Grundprinzip: Englisch für Code, Deutsch für UI
- **Code, Variablen, Funktionen**: Englisch
- **Datenbank-Felder**: Englisch
- **API-Endpunkte**: Englisch
- **UI-Labels, Fehlermeldungen**: Deutsch
- **Dokumentation**: Deutsch (interne Docs), Englisch (Code-Kommentare)

### Beispiel der Sprach-Trennung
```typescript
// ✅ Gut: Englische Code-Struktur mit deutschen UI-Labels
interface ProjectFormData {
  name: string;              // Code: Englisch
  description: string;       // Code: Englisch
  planned_budget: number;    // Code: Englisch
}

const ProjectForm = () => (
  <form>
    <label>Projektname</label>           {/* UI: Deutsch */}
    <input name="name" />
    
    <label>Beschreibung</label>          {/* UI: Deutsch */}
    <textarea name="description" />
    
    <label>Geplantes Budget</label>      {/* UI: Deutsch */}
    <input name="planned_budget" />
  </form>
);
```

## 📁 Datei- und Verzeichnis-Namen

### 1. Verzeichnisse
```
✅ Gut: Englisch, kebab-case
components/
  - dashboard/
  - projects/
  - budget-tracking/
  - transfers/

❌ Schlecht: Gemischt oder deutsch
components/
  - Dashboard/
  - projekte/
  - budget_tracking/
```

### 2. Dateien

#### Frontend (React/TypeScript)
```
✅ Gut: PascalCase für Komponenten
ProjectCard.tsx
BudgetOverview.tsx
TransferDashboard.tsx

✅ Gut: camelCase für Utilities
formatCurrency.ts
dataMapping.ts
apiClient.ts

✅ Gut: kebab-case für Konfiguration
vite.config.ts
tailwind.config.js
```

#### Backend (Node.js)
```
✅ Gut: camelCase für alle Dateien
projectController.js
budgetService.js
advancedValidation.js
server.js
```

## 🔤 Variablen und Funktionen

### 1. JavaScript/TypeScript Variablen
```typescript
// ✅ Gut: camelCase, beschreibend, englisch
const projectData = await fetchProjects();
const isLoadingBudgets = true;
const totalAllocatedBudget = calculateTotal(projects);
const budgetStatusIndicator = getBudgetStatus(allocation);

// ❌ Schlecht: Deutsche Namen oder unklare Abkürzungen
const projektDaten = await fetchProjects();
const isLdgBdgts = true;
const totAllocBdgt = calculateTotal(projects);
const bsi = getBudgetStatus(allocation);
```

### 2. Funktionen
```typescript
// ✅ Gut: Verben, beschreibend, englisch
const calculateBudgetUtilization = (allocated: number, consumed: number) => {
  return (consumed / allocated) * 100;
};

const formatGermanCurrency = (amount: number) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

const validateProjectBudget = async (projectData: ProjectFormData) => {
  // Validation logic
};

// ❌ Schlecht: Unklare oder deutsche Namen
const calc = (a, b) => (b / a) * 100;
const formatGeld = (amount) => { /* ... */ };
const prüfeProjektBudget = async (data) => { /* ... */ };
```

### 3. React Components
```typescript
// ✅ Gut: PascalCase, beschreibend
const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  return <div>{project.name}</div>;
};

const BudgetAllocationSlider: React.FC<SliderProps> = ({ value, onChange }) => {
  return <input type="range" value={value} onChange={onChange} />;
};

const TransferRequestForm: React.FC<FormProps> = ({ onSubmit }) => {
  return <form onSubmit={onSubmit}>{/* form fields */}</form>;
};

// ❌ Schlecht: Unklare oder deutsche Namen
const Card = ({ data }) => <div>{data.name}</div>;
const ProjektKarte = ({ projekt }) => <div>{projekt.name}</div>;
const Form1 = ({ onSubmit }) => <form onSubmit={onSubmit}></form>;
```

## 🗄️ Datenbank-Konventionen

### 1. Tabellennamen
```sql
-- ✅ Gut: Englisch, Plural, snake_case
projects
annual_budgets
budget_transfers
team_members
project_tags

-- ❌ Schlecht: Deutsch oder inkonsistent
projekte
jahresbudgets
BudgetTransfers
teamMitglieder
```

### 2. Spaltennamen
```sql
-- ✅ Gut: Englisch, snake_case, beschreibend
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  planned_budget DECIMAL(12,2),
  consumed_budget DECIMAL(12,2),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- ❌ Schlecht: Deutsch oder inkonsistent
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  projektname VARCHAR(255),
  beschreibung TEXT,
  geplantes_budget DECIMAL(12,2),
  verbrauchtes_budget DECIMAL(12,2),
  startDatum DATE,
  end_date DATE
);
```

### 3. Enum-Werte
```sql
-- ✅ Gut: Englisch, UPPER_CASE
CREATE TYPE project_status_enum AS ENUM (
  'PLANNED',
  'ACTIVE', 
  'COMPLETED',
  'PAUSED',
  'CANCELLED'
);

CREATE TYPE budget_status_enum AS ENUM (
  'HEALTHY',
  'WARNING',
  'CRITICAL',
  'EXCEEDED'
);

-- ❌ Schlecht: Deutsch oder inkonsistent
CREATE TYPE project_status_enum AS ENUM (
  'geplant',
  'aktiv',
  'abgeschlossen'
);
```

## 🌐 API-Konventionen

### 1. Endpunkt-Namen
```javascript
// ✅ Gut: RESTful, englisch, kebab-case für zusammengesetzte Begriffe
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id

GET    /api/budget-allocation/available/:year
POST   /api/budget-transfers
GET    /api/dashboard/budget-overview

// ❌ Schlecht: Deutsch oder inkonsistent
GET    /api/projekte
POST   /api/createProject
GET    /api/budget_allocation/verfuegbar/:jahr
```

### 2. Request/Response Felder
```typescript
// ✅ Gut: Englische Feldnamen in API
interface CreateProjectRequest {
  name: string;
  description: string;
  planned_budget: number;
  start_date: string;
  end_date: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  cost_type: 'internal' | 'external';
}

interface ProjectResponse {
  id: string;
  name: string;
  description: string;
  planned_budget: number;
  consumed_budget: number;
  budget_utilization_percentage: number;
  status: 'planned' | 'active' | 'completed';
  created_at: string;
  updated_at: string;
}

// ❌ Schlecht: Deutsche Feldnamen
interface CreateProjectRequest {
  projektname: string;
  beschreibung: string;
  geplantes_budget: number;
  start_datum: string;
}
```

## 🎨 CSS/Styling-Konventionen

### 1. CSS-Klassen (falls Custom CSS verwendet wird)
```css
/* ✅ Gut: BEM-Notation, englisch */
.project-card {
  /* Base styles */
}

.project-card__header {
  /* Header styles */
}

.project-card__title {
  /* Title styles */
}

.project-card--featured {
  /* Featured variant */
}

.budget-status-indicator {
  /* Base styles */
}

.budget-status-indicator--healthy {
  /* Healthy status */
}

/* ❌ Schlecht: Deutsche oder unklare Namen */
.projekt-karte {
  /* ... */
}

.card1 {
  /* ... */
}
```

### 2. Tailwind CSS Klassen
```typescript
// ✅ Gut: Konsistente Tailwind-Verwendung
const ProjectCard = () => (
  <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      {project.name}
    </h3>
    <div className="flex items-center justify-between mt-4">
      <span className="text-sm text-gray-600">Budget:</span>
      <span className="text-lg font-bold text-green-600">
        {formatCurrency(project.planned_budget)}
      </span>
    </div>
  </div>
);
```

## 🔧 Konstanten und Konfiguration

### 1. Konstanten
```typescript
// ✅ Gut: SCREAMING_SNAKE_CASE, englisch, beschreibend
const API_BASE_URL = 'http://localhost:3001/api';
const DEFAULT_CURRENCY = 'EUR';
const MAX_PROJECT_NAME_LENGTH = 255;
const BUDGET_WARNING_THRESHOLD = 0.85;
const BUDGET_CRITICAL_THRESHOLD = 0.95;

// Gruppierung verwandter Konstanten
const BUDGET_THRESHOLDS = {
  WARNING: 0.85,
  CRITICAL: 0.95,
  EXCEEDED: 1.0
} as const;

const PROJECT_STATUSES = {
  PLANNED: 'planned',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  PAUSED: 'paused'
} as const;

// ❌ Schlecht: Unklare oder deutsche Namen
const URL = 'http://localhost:3001/api';
const WAEHRUNG = 'EUR';
const MAX_LEN = 255;
const THRESHOLD = 0.85;
```

### 2. Environment Variables
```bash
# ✅ Gut: SCREAMING_SNAKE_CASE, englisch, beschreibend
NODE_ENV=development
PORT=3001
API_BASE_URL=http://localhost:3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_CONNECTION_TIMEOUT=30000
WEBSOCKET_HEARTBEAT_INTERVAL=30000

# ❌ Schlecht: Unklare oder deutsche Namen
ENV=dev
SUPABASE_SCHLUESSEL=your-key
DB_TIMEOUT=30000
```

## 📝 Kommentar-Konventionen

### 1. Code-Kommentare (Englisch)
```typescript
/**
 * Calculates the budget utilization percentage for a project
 * @param allocatedBudget - The total allocated budget
 * @param consumedBudget - The amount already consumed
 * @returns The utilization percentage (0-100+)
 */
const calculateBudgetUtilization = (
  allocatedBudget: number, 
  consumedBudget: number
): number => {
  if (allocatedBudget === 0) return 0;
  return (consumedBudget / allocatedBudget) * 100;
};

// Check if project is over budget according to German business rules
if (utilizationRate > BUDGET_THRESHOLDS.CRITICAL) {
  // Trigger alert notification
  notifyBudgetExceeded(project);
}
```

### 2. UI-Kommentare (Deutsch)
```typescript
const ProjectForm = () => (
  <form>
    {/* Projekt-Grunddaten */}
    <fieldset>
      <legend>Grundinformationen</legend>
      <input name="name" placeholder="Projektname eingeben..." />
      <textarea name="description" placeholder="Projektbeschreibung..." />
    </fieldset>
    
    {/* Budget-Informationen */}
    <fieldset>
      <legend>Budget-Planung</legend>
      <input name="planned_budget" placeholder="Geplantes Budget..." />
    </fieldset>
  </form>
);
```

## 🧪 Test-Konventionen

### 1. Test-Datei-Namen
```
✅ Gut: .test.ts/.spec.ts Suffix
projectController.test.js
budgetService.spec.js
ProjectCard.test.tsx
formatCurrency.test.ts

❌ Schlecht: Unklare Namen
projectTest.js
budget.js
test-project-card.tsx
```

### 2. Test-Beschreibungen
```typescript
// ✅ Gut: Beschreibend, englisch für Code-Tests
describe('calculateBudgetUtilization', () => {
  it('should return 0 when allocated budget is 0', () => {
    expect(calculateBudgetUtilization(0, 100)).toBe(0);
  });
  
  it('should calculate correct percentage for normal values', () => {
    expect(calculateBudgetUtilization(1000, 250)).toBe(25);
  });
  
  it('should handle over-budget scenarios', () => {
    expect(calculateBudgetUtilization(1000, 1200)).toBe(120);
  });
});

// ✅ Gut: Deutsch für UI-Tests (da UI deutsch ist)
describe('ProjectForm Component', () => {
  it('sollte Fehlermeldung bei leerem Projektnamen anzeigen', () => {
    // Test implementation
  });
  
  it('sollte Budget-Validierung korrekt durchführen', () => {
    // Test implementation
  });
});
```

## 📊 Git-Konventionen

### 1. Branch-Namen
```bash
# ✅ Gut: Englisch, kebab-case, beschreibend
feature/budget-allocation-slider
bugfix/project-form-validation
hotfix/database-connection-timeout
refactor/api-error-handling

# ❌ Schlecht: Deutsch oder unklare Namen
feature/budget-slider
fix/bug1
projekt-formular
```

### 2. Commit-Messages
```bash
# ✅ Gut: Englisch, imperativ, beschreibend
feat: add budget allocation slider component
fix: resolve project form validation errors
refactor: improve error handling in project controller
docs: update API documentation for budget endpoints

# ❌ Schlecht: Deutsch oder unklare Messages
added slider
bug fix
projekt formular repariert
update
```

## 🏷️ Tag- und Label-Konventionen

### 1. HTML/JSX Attribute
```typescript
// ✅ Gut: Englische Attribute, deutsche Labels
<input 
  name="project_name"
  id="project-name-input"
  placeholder="Projektname eingeben..."
  aria-label="Projektname"
  data-testid="project-name-field"
/>

<button 
  type="submit"
  className="submit-button"
  data-testid="create-project-button"
>
  Projekt erstellen
</button>
```

### 2. Form-Validierung
```typescript
// ✅ Gut: Englische Validation-Keys, deutsche Messages
const validationSchema = {
  name: {
    required: 'Projektname ist erforderlich',
    minLength: 'Projektname muss mindestens 3 Zeichen lang sein',
    maxLength: 'Projektname darf maximal 255 Zeichen lang sein'
  },
  planned_budget: {
    required: 'Geplantes Budget ist erforderlich',
    min: 'Budget muss größer als 0 sein',
    max: 'Budget überschreitet verfügbares Jahresbudget'
  }
};
```

## 📋 Checkliste für Naming

### Vor dem Commit prüfen:
- [ ] Alle Code-Elemente verwenden englische Namen
- [ ] UI-Labels und Fehlermeldungen sind deutsch
- [ ] Datenbank-Felder folgen snake_case Konvention
- [ ] API-Endpunkte sind RESTful und englisch
- [ ] Variablen- und Funktionsnamen sind beschreibend
- [ ] Konstanten verwenden SCREAMING_SNAKE_CASE
- [ ] Dateien folgen den Namenskonventionen
- [ ] Test-Beschreibungen sind angemessen benannt
- [ ] Kommentare verwenden die richtige Sprache

### Code Review Checklist:
- [ ] Naming ist konsistent mit bestehender Codebase
- [ ] Keine deutschen Namen in Code-Elementen
- [ ] UI-Texte sind benutzerfreundlich deutsch
- [ ] API-Struktur folgt englischen Konventionen
- [ ] Datenbank-Schema ist konsistent englisch

---

**Letzte Aktualisierung:** 29. August 2025  
**Version:** 1.0  
**Autor:** Budget Manager 2025 Development Team

