# Coding Conventions - Budget Manager 2025

## Überblick
Dieses Dokument definiert die Coding-Standards für das Budget Manager 2025 Projekt, um Konsistenz, Wartbarkeit und Qualität des Codes sicherzustellen.

## 🏗️ Architektur-Prinzipien

### 1. Separation of Concerns
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + ES Modules
- **Datenbank**: Supabase (PostgreSQL)
- **Real-time**: WebSocket für Live-Updates

### 2. API-First Design
- RESTful API-Endpunkte mit konsistenter Struktur
- Englische Feldnamen in der Datenbank und API
- Deutsche UI-Labels für Benutzerfreundlichkeit

## 📁 Dateistruktur

### Backend Structure
```
backend/
├── src/
│   ├── controllers/     # Business Logic
│   ├── routes/         # API Route Definitions
│   ├── services/       # Data Access Layer
│   ├── middleware/     # Express Middleware
│   ├── utils/          # Helper Functions
│   └── config/         # Configuration Files
```

### Frontend Structure
```
frontend/
├── src/
│   ├── components/     # React Components
│   │   ├── dashboard/  # Dashboard-spezifische Komponenten
│   │   ├── projects/   # Projekt-spezifische Komponenten
│   │   ├── budget/     # Budget-spezifische Komponenten
│   │   └── transfers/  # Transfer-spezifische Komponenten
│   ├── pages/          # Page-Level Komponenten
│   ├── utils/          # Helper Functions
│   └── hooks/          # Custom React Hooks
```

## 🎯 TypeScript Standards

### 1. Interface Definitionen
```typescript
// ✅ Gut: Klare, beschreibende Interface-Namen
interface ProjectFormData {
  name: string;
  description: string;
  planned_budget: number;
  start_date: string;
  end_date: string;
}

// ❌ Schlecht: Vage oder zu generische Namen
interface Data {
  stuff: any;
}
```

### 2. Type Safety
```typescript
// ✅ Gut: Strikte Typisierung
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

// ❌ Schlecht: Any-Types vermeiden
const formatCurrency = (amount: any): any => {
  // ...
};
```

### 3. Enum Usage
```typescript
// ✅ Gut: Enums für feste Werte
enum ProjectStatus {
  PLANNED = 'planned',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused'
}

// ✅ Gut: String Literal Types als Alternative
type BudgetStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'EXCEEDED';
```

## 🎨 React Component Standards

### 1. Component Structure
```typescript
// ✅ Gut: Funktionale Komponenten mit TypeScript
interface ProjectCardProps {
  project: Project;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ 
  project, 
  onEdit, 
  onDelete 
}) => {
  // Hooks zuerst
  const [isLoading, setIsLoading] = useState(false);
  
  // Event Handlers
  const handleEdit = () => {
    onEdit?.(project.id);
  };
  
  // Render
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Component content */}
    </div>
  );
};

export default ProjectCard;
```

### 2. Hook Usage
```typescript
// ✅ Gut: Custom Hooks für wiederverwendbare Logik
const useProjectData = (projectId: string) => {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/projects/${projectId}`);
        const data = await response.json();
        setProject(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProject();
  }, [projectId]);
  
  return { project, isLoading, error };
};
```

## 🔧 Backend Standards

### 1. Controller Pattern
```javascript
// ✅ Gut: Klare Controller-Struktur
export const getAllProjects = async (req, res) => {
  try {
    const projects = await projectService.getAllProjects();
    
    res.status(200).json({
      success: true,
      data: projects,
      pagination: {
        total: projects.length,
        page: 1,
        limit: 50
      }
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Projekte:', error);
    res.status(500).json({
      error: 'Interner Serverfehler',
      message: 'Die Projekte konnten nicht abgerufen werden.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};
```

### 2. Service Layer
```javascript
// ✅ Gut: Service für Datenbank-Operationen
export const getAllProjects = async () => {
  const { data: projects, error } = await supabaseAdmin
    .from('projects')
    .select(`
      *,
      kategorien (name, category_type),
      teams (name),
      annual_budgets (year, total_budget)
    `)
    .order('created_at', { ascending: false });
    
  if (error) {
    throw new Error(`Fehler beim Abrufen der Projekte: ${error.message}`);
  }
  
  return projects.map(formatProjectData);
};
```

### 3. Middleware Pattern
```javascript
// ✅ Gut: Wiederverwendbare Middleware
export const validateProjectCreation = async (req, res, next) => {
  try {
    const { planned_budget, budget_year } = req.body;
    
    // Budget-Verfügbarkeit prüfen
    const availableBudget = await budgetService.getAvailableBudget(budget_year);
    
    if (planned_budget > availableBudget.available) {
      return res.status(400).json({
        error: 'INSUFFICIENT_BUDGET',
        message: 'Nicht genügend Budget verfügbar',
        details: {
          requested: planned_budget,
          available: availableBudget.available
        }
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({
      error: 'VALIDATION_ERROR',
      message: 'Fehler bei der Budget-Validierung'
    });
  }
};
```

## 🎨 CSS/Styling Standards

### 1. Tailwind CSS Usage
```typescript
// ✅ Gut: Konsistente Tailwind-Klassen
const ProjectCard = () => (
  <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      {project.name}
    </h3>
    <p className="text-sm text-gray-600 mb-4">
      {project.description}
    </p>
    <div className="flex items-center justify-between">
      <span className="text-2xl font-bold text-green-600">
        {formatCurrency(project.planned_budget)}
      </span>
      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
        Bearbeiten
      </button>
    </div>
  </div>
);
```

### 2. Responsive Design
```typescript
// ✅ Gut: Mobile-first Responsive Design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {projects.map(project => (
    <ProjectCard key={project.id} project={project} />
  ))}
</div>
```

## 🔍 Error Handling

### 1. Frontend Error Handling
```typescript
// ✅ Gut: Strukturiertes Error Handling
const useApiCall = <T>(apiCall: () => Promise<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const execute = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await apiCall();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setIsLoading(false);
    }
  };
  
  return { data, error, isLoading, execute };
};
```

### 2. Backend Error Handling
```javascript
// ✅ Gut: Konsistente Error Response Structure
const handleError = (error, res, context = 'Operation') => {
  console.error(`❌ ${context} Fehler:`, error);
  
  const statusCode = error.statusCode || 500;
  const errorCode = error.code || 'INTERNAL_SERVER_ERROR';
  
  res.status(statusCode).json({
    error: errorCode,
    message: error.message || `Fehler bei ${context}`,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};
```

## 📝 Kommentar-Standards

### 1. JSDoc für Funktionen
```typescript
/**
 * Formatiert einen Geldbetrag in deutsche Währungsdarstellung
 * @param amount - Der zu formatierende Betrag in Cent
 * @param currency - Die Währung (Standard: 'EUR')
 * @returns Formatierter Währungsstring
 * @example
 * formatGermanCurrency(150000) // "150.000,00 €"
 */
const formatGermanCurrency = (
  amount: number, 
  currency: string = 'EUR'
): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency
  }).format(amount);
};
```

### 2. Inline-Kommentare
```typescript
// ✅ Gut: Erklärt das "Warum", nicht das "Was"
const calculateBudgetStatus = (allocated: number, consumed: number): BudgetStatus => {
  const utilizationRate = (consumed / allocated) * 100;
  
  // Deutsche Geschäftslogik: Ampel-System für Budget-Status
  if (utilizationRate <= 70) return 'HEALTHY';
  if (utilizationRate <= 85) return 'WARNING';
  if (utilizationRate <= 100) return 'CRITICAL';
  return 'EXCEEDED';
};
```

## 🧪 Testing Standards

### 1. Unit Tests
```typescript
// ✅ Gut: Beschreibende Test-Namen
describe('formatGermanCurrency', () => {
  it('should format positive amounts correctly', () => {
    expect(formatGermanCurrency(150000)).toBe('150.000,00 €');
  });
  
  it('should handle zero amounts', () => {
    expect(formatGermanCurrency(0)).toBe('0,00 €');
  });
  
  it('should format negative amounts correctly', () => {
    expect(formatGermanCurrency(-50000)).toBe('-50.000,00 €');
  });
});
```

### 2. Integration Tests
```typescript
// ✅ Gut: API-Endpunkt Tests
describe('GET /api/projects', () => {
  it('should return all projects with correct structure', async () => {
    const response = await request(app)
      .get('/api/projects')
      .expect(200);
      
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);
    
    if (response.body.data.length > 0) {
      const project = response.body.data[0];
      expect(project).toHaveProperty('id');
      expect(project).toHaveProperty('name');
      expect(project).toHaveProperty('planned_budget');
    }
  });
});
```

## 🔒 Security Standards

### 1. Input Validation
```javascript
// ✅ Gut: Express-Validator für Input-Validierung
export const createProjectValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Projektname ist erforderlich (1-255 Zeichen)'),
  body('planned_budget')
    .isFloat({ min: 0 })
    .withMessage('Geplantes Budget muss eine positive Zahl sein'),
  body('start_date')
    .isISO8601()
    .withMessage('Startdatum muss ein gültiges Datum sein'),
];
```

### 2. Environment Variables
```javascript
// ✅ Gut: Sichere Konfiguration
const config = {
  port: process.env.PORT || 3001,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  nodeEnv: process.env.NODE_ENV || 'development'
};

// Validierung der erforderlichen Umgebungsvariablen
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Erforderliche Umgebungsvariable ${envVar} fehlt`);
  }
});
```

## 📊 Performance Standards

### 1. Database Queries
```javascript
// ✅ Gut: Optimierte Supabase-Queries
const getProjectsWithBudgetInfo = async () => {
  // Nur benötigte Felder selektieren
  const { data, error } = await supabaseAdmin
    .from('projects')
    .select(`
      id,
      name,
      planned_budget,
      consumed_budget,
      status,
      annual_budgets!inner(year, total_budget)
    `)
    .eq('annual_budgets.status', 'ACTIVE')
    .order('created_at', { ascending: false })
    .limit(50);
    
  return data;
};
```

### 2. Frontend Performance
```typescript
// ✅ Gut: React.memo für Performance-Optimierung
const ProjectCard = React.memo<ProjectCardProps>(({ project, onEdit }) => {
  return (
    <div className="project-card">
      {/* Component content */}
    </div>
  );
});

// ✅ Gut: useMemo für teure Berechnungen
const ProjectList: React.FC = ({ projects }) => {
  const sortedProjects = useMemo(() => {
    return projects.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [projects]);
  
  return (
    <div>
      {sortedProjects.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
};
```

## 🚀 Deployment Standards

### 1. Environment Configuration
```bash
# ✅ Gut: Klare Umgebungstrennung
# .env.development
NODE_ENV=development
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# .env.production
NODE_ENV=production
PORT=3001
SUPABASE_URL=https://your-production-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
```

### 2. Build Process
```json
{
  "scripts": {
    "dev": "node scripts/start-dev.js",
    "build": "npm run build:frontend && npm run build:backend",
    "build:frontend": "cd frontend && npm run build",
    "build:backend": "cd backend && npm run build",
    "test": "npm run test:frontend && npm run test:backend",
    "test:frontend": "cd frontend && npm run test",
    "test:backend": "cd backend && npm run test"
  }
}
```

## 📋 Code Review Checklist

### Vor dem Commit
- [ ] Code folgt den Naming Conventions
- [ ] TypeScript-Typen sind korrekt definiert
- [ ] Error Handling ist implementiert
- [ ] Tests sind geschrieben und bestehen
- [ ] Performance wurde berücksichtigt
- [ ] Security-Aspekte wurden geprüft
- [ ] Dokumentation ist aktualisiert

### Pull Request Review
- [ ] Code ist selbsterklärend und gut kommentiert
- [ ] Keine hardcodierten Werte oder Secrets
- [ ] API-Endpunkte folgen RESTful-Prinzipien
- [ ] Frontend-Komponenten sind wiederverwendbar
- [ ] Database-Queries sind optimiert
- [ ] Responsive Design ist implementiert

---

**Letzte Aktualisierung:** 29. August 2025  
**Version:** 1.0  
**Autor:** Budget Manager 2025 Development Team

