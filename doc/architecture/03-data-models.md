# Datenmodelle - Budget Manager 2025

## Jahresbudget-Modell

```typescript
interface AnnualBudget {
  id: string;
  year: number;
  totalBudget: Decimal;           
  reservePercentage: number;      
  reserveAmount: Decimal;         
  availableBudget: Decimal;       
  allocatedBudget: Decimal;       
  consumedBudget: Decimal;        
  currency: 'EUR';                
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  
  projects: Project[];
  budgetTransfers: BudgetTransfer[];
}
```

## Projekt-Modell - Deutsche Geschäftsstruktur

```typescript
interface Project {
  // Auto-generierte Felder
  id: string;
  projektNr: string;              
  createdAt: Date;
  updatedAt: Date;
  
  // Deutsche Geschäfts-Pflichtfelder
  kategorie: string;              
  startDatum: Date;               
  endDatum: Date;                 
  team: string;                   
  projektName: string;            
  kurzbeschreibung: string;       
  priorität: 'Low' | 'Medium' | 'High';
  durchlaufzeit: number;          
  kostenart: string;              
  dienstleister?: string;         
  impact: 'Low' | 'Medium' | 'High';
  
  // Finanz-Tracking-Felder
  realeKosten: Decimal;           
  externeKosten: Decimal;         
  impactUnternehmenserfolg: string;
  anmerkung?: string;             
  
  // Interne Stunden-Tracking nach Teams
  interneStundenDesign?: number;  
  interneStundenContent?: number; 
  interneStundenDev?: number;     
  
  // Flexibles Tagging-System
  tags: string[];                 
  
  // Dreidimensionales Budget-Tracking
  budgetTracking: ProjectBudgetTracking;
  
  // Beziehungen
  annualBudgetId: string;
  invoiceLineItems: InvoiceLineItem[];
  budgetTransfers: BudgetTransfer[];
  auditTrail: AuditTrailEntry[];
}

interface ProjectBudgetTracking {
  veranschlagtBudget: Decimal;    
  zugewiesenBudget: Decimal;      
  verbrauchtBudget: Decimal;      
  
  warningThreshold80: Decimal;    
  warningThreshold90: Decimal;    
  criticalThreshold: Decimal;     
  
  budgetStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'EXCEEDED';
  lastUpdated: Date;
  
  transfersIn: Decimal;           
  transfersOut: Decimal;          
  netTransfers: Decimal;          
}
```

## Rechnungsverarbeitungs-Modell

```typescript
interface Invoice {
  id: string;
  originalFileName: string;
  fileSize: number;
  storagePath: string;            
  uploadedAt: Date;
  uploadedBy: string;
  
  // OCR-Verarbeitungs-Ergebnisse
  ocrStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  ocrProvider: 'google-vision' | 'aws-textract' | 'manual';
  ocrConfidence: number;          
  ocrProcessedAt?: Date;
  
  // Extrahierte Rechnungsdaten
  supplierName?: string;
  supplierVatId?: string;
  invoiceNumber?: string;
  invoiceDate?: Date;
  totalAmount?: Decimal;
  vatAmount?: Decimal;
  netAmount?: Decimal;
  currency: string;               
  
  // Verarbeitungs-Metadaten
  processingDuration?: number;    
  aiSuggestionsGenerated: boolean;
  manualValidationRequired: boolean;
  validatedAt?: Date;
  validatedBy?: string;
  
  // Beziehungen
  lineItems: InvoiceLineItem[];
  supplierPattern?: SupplierPattern;
}

interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  
  // Positionsdetails
  description: string;
  quantity?: number;
  unitPrice?: Decimal;
  totalPrice: Decimal;
  vatRate?: number;
  
  // Projekt-Zuordnung (können verschiedene Teams sein)
  assignedProjectId?: string;
  assignedTeam: string;           
  assignmentMethod: 'AI_SUGGESTED' | 'MANUAL' | 'RULE_BASED';
  assignmentConfidence?: number;  
  
  // Validierungs-Tracking
  needsValidation: boolean;
  validatedAt?: Date;
  validatedBy?: string;
  
  project?: Project;
}
```

## Budget-Transfer-Modell

```typescript
interface BudgetTransfer {
  id: string;
  fromProjectId: string;
  toProjectId: string;
  amount: Decimal;
  reason: string;
  
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedBy: string;
  requestedAt: Date;
  
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  
  // Audit-Trail
  auditTrail: AuditTrailEntry[];
  
  // Beziehungen
  fromProject: Project;
  toProject: Project;
}
```

## Lieferanten-Pattern-Modell

```typescript
interface SupplierPattern {
  id: string;
  supplierName: string;
  supplierVatId?: string;
  
  // Gelernte Muster
  documentStructure: PatternStructure;
  fieldMappings: FieldMapping[];
  
  // Lern-Statistiken
  totalInvoicesProcessed: number;
  averageConfidence: number;
  lastUpdated: Date;
  
  // Benutzer-Feedback
  userCorrections: UserCorrection[];
  patternAccuracy: number;
  
  isActive: boolean;
}

interface PatternStructure {
  supplierNamePosition: BoundingBox;
  invoiceNumberPosition: BoundingBox;
  datePosition: BoundingBox;
  totalAmountPosition: BoundingBox;
  lineItemsRegion: BoundingBox;
}

interface FieldMapping {
  fieldName: string;
  extractionRule: string;
  confidence: number;
  validationPattern: string;
}
```

## Audit-Trail-Modell

```typescript
interface AuditTrailEntry {
  id: string;
  entityType: 'PROJECT' | 'BUDGET' | 'INVOICE' | 'TRANSFER';
  entityId: string;
  
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT';
  fieldChanges: FieldChange[];
  
  performedBy: string;
  performedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  
  // Deutsche Geschäfts-Compliance
  complianceNote?: string;
  approvalRequired: boolean;
  approvedBy?: string;
}

interface FieldChange {
  fieldName: string;
  oldValue: any;
  newValue: any;
  changeReason?: string;
}
```

## Master-Daten-Modelle

```typescript
interface Kategorie {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  
  // RBAC-Berechtigungen
  canViewAllBudgets: boolean;
  canTransferBudgets: boolean;
  canApproveTransfers: boolean;
  
  // Team-spezifische Einstellungen
  defaultHourlyRate?: Decimal;
  budgetNotificationThreshold: number;
}

interface Dienstleister {
  id: string;
  name: string;
  vatId?: string;
  contactEmail?: string;
  isActive: boolean;
  
  // OCR-Pattern-Verknüpfung
  supplierPattern?: SupplierPattern;
  
  // Geschäfts-Metadaten
  paymentTerms?: string;
  preferredCurrency: string;
  averageProcessingTime?: number;
}
```