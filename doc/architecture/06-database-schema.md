# Datenbankschema - Budget Manager 2025

## Kern-Tabellen (PostgreSQL)

### Master-Daten - Deutsche Geschäfts-Taxonomie

```sql
-- Kategorien für deutsche Geschäfts-Klassifikation (Erweitert für Soft-Delete)
CREATE TABLE kategorien (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    kategorie_typ VARCHAR(50) NOT NULL DEFAULT 'Hauptkategorie',
    beschreibung TEXT,
    sortierung INTEGER DEFAULT 0,
    parent_id UUID REFERENCES kategorien(id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMPTZ NULL,
    deleted_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Teams (Erweitert für Soft-Delete)
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    beschreibung TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMPTZ NULL,
    deleted_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rollen-Stammdaten (Master Data für Team-Rollen)
CREATE TABLE rollen_stammdaten (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    kategorie VARCHAR(50) NOT NULL, -- z.B. 'Development', 'Design', 'Management'
    standard_stundensatz DECIMAL(8,2) NOT NULL,
    min_stundensatz DECIMAL(8,2),
    max_stundensatz DECIMAL(8,2),
    beschreibung TEXT,
    farbe VARCHAR(7), -- Hex-Farbcode für UI
    ist_aktiv BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Team-Rollen-Zuordnung (Many-to-Many)
CREATE TABLE team_rollen (
    id SERIAL PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    rolle_id INTEGER NOT NULL REFERENCES rollen_stammdaten(id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, rolle_id)
);

-- Kostenarten-Taxonomie
CREATE TABLE kostenarten (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER DEFAULT 0
);

-- Lieferanten/Suppliers (Österreichische Geschäftsfelder, Erweitert für Soft-Delete)
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    business_sector VARCHAR(100),
    legal_form VARCHAR(50), -- GmbH, AG, KG, OG, Einzelunternehmen
    uid_number VARCHAR(20), -- ATU12345678 Format
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    postal_code VARCHAR(10),
    city VARCHAR(100),
    country VARCHAR(50) DEFAULT 'Österreich',
    iban VARCHAR(34), -- Internationale Bankkontonummer
    bic VARCHAR(11), -- Bank Identifier Code
    tax_number VARCHAR(50),
    commercial_register VARCHAR(100),
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, PENDING
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMPTZ NULL,
    deleted_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tags für flexible Kategorisierung (Erweitert für Soft-Delete)
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(7), -- Hex-Farbcode
    category VARCHAR(50), -- Kategorie des Tags
    beschreibung TEXT,
    usage_count INTEGER DEFAULT 0, -- Verwendungsstatistik
    is_active BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMPTZ NULL,
    deleted_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Legacy: Dienstleister/Lieferanten (wird durch suppliers ersetzt)
CREATE TABLE dienstleister (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    vat_id VARCHAR(50),
    contact_email VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Geschäfts-Metadaten
    payment_terms VARCHAR(100),
    preferred_currency CHAR(3) DEFAULT 'EUR',
    average_processing_time_hours INTEGER,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Impact-Levels
CREATE TABLE impact_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(20) NOT NULL UNIQUE CHECK (name IN ('Low', 'Medium', 'High')),
    description TEXT,
    sort_order INTEGER DEFAULT 0
);

-- Prioritäten
CREATE TABLE prioritaeten (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(20) NOT NULL UNIQUE CHECK (name IN ('Low', 'Medium', 'High')),
    description TEXT,
    sort_order INTEGER DEFAULT 0
);
```

### Jahresbudgets

```sql
CREATE TABLE annual_budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year INTEGER NOT NULL UNIQUE,
    total_budget DECIMAL(15,2) NOT NULL,
    reserve_percentage DECIMAL(5,2) NOT NULL DEFAULT 10.0,
    reserve_amount DECIMAL(15,2) GENERATED ALWAYS AS (total_budget * reserve_percentage / 100) STORED,
    available_budget DECIMAL(15,2) GENERATED ALWAYS AS (total_budget - reserve_amount) STORED,
    
    -- Berechnete Felder
    allocated_budget DECIMAL(15,2) DEFAULT 0.00,
    consumed_budget DECIMAL(15,2) DEFAULT 0.00,
    
    currency CHAR(3) NOT NULL DEFAULT 'EUR',
    status VARCHAR(10) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'CLOSED')),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL -- Referenz zu Benutzer-Tabelle
);

-- Index für Performance
CREATE INDEX idx_annual_budgets_year ON annual_budgets(year);
CREATE INDEX idx_annual_budgets_status ON annual_budgets(status);
```

### Deutsche Geschäftsprojekte

```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    projekt_nr VARCHAR(50) NOT NULL UNIQUE,
    annual_budget_id UUID NOT NULL REFERENCES annual_budgets(id),
    
    -- Deutsche Geschäfts-Pflichtfelder
    kategorie_id UUID NOT NULL REFERENCES kategorien(id),
    start_datum DATE NOT NULL,
    ende_datum DATE NOT NULL,
    team_id UUID NOT NULL REFERENCES teams(id),
    projekt_name VARCHAR(300) NOT NULL,
    kurzbeschreibung TEXT,
    prioritaet_id UUID NOT NULL REFERENCES prioritaeten(id),
    
    -- Auto-berechnete Durchlaufzeit
    durchlaufzeit_wochen DECIMAL(5,1) GENERATED ALWAYS AS (
        EXTRACT(DAYS FROM (ende_datum - start_datum)) / 7.0
    ) STORED,
    
    kostenart_id UUID NOT NULL REFERENCES kostenarten(id),
    dienstleister_id UUID REFERENCES dienstleister(id), -- Legacy, wird durch project_suppliers ersetzt
    impact_id UUID NOT NULL REFERENCES impact_levels(id),
    
    -- Erweiterte Budget-Felder für Multi-Dienstleister-System
    external_budget DECIMAL(12,2) DEFAULT 0.00, -- Manuell einstellbares externes Budget
    
    -- Finanz-Tracking
    reale_kosten DECIMAL(12,2) DEFAULT 0.00,
    externe_kosten DECIMAL(12,2) DEFAULT 0.00,
    impact_unternehmenserfolg TEXT,
    anmerkung TEXT,
    
    -- Interne Stunden nach Teams
    interne_stunden_design DECIMAL(8,2) DEFAULT 0.00,
    interne_stunden_content DECIMAL(8,2) DEFAULT 0.00,
    interne_stunden_dev DECIMAL(8,2) DEFAULT 0.00,
    
    -- Status und Metadaten
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_date_range CHECK (ende_datum > start_datum),
    CONSTRAINT positive_costs CHECK (reale_kosten >= 0 AND externe_kosten >= 0),
    CONSTRAINT positive_hours CHECK (
        interne_stunden_design >= 0 AND 
        interne_stunden_content >= 0 AND 
        interne_stunden_dev >= 0
    )
);

-- Performance-Indizes
CREATE INDEX idx_projects_annual_budget ON projects(annual_budget_id);
CREATE INDEX idx_projects_team ON projects(team_id);
CREATE INDEX idx_projects_kategorie ON projects(kategorie_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_dates ON projects(start_datum, ende_datum);

-- Automatische Projektnummer-Generierung
CREATE OR REPLACE FUNCTION generate_projekt_nr()
RETURNS TRIGGER AS $$
DECLARE
    year_suffix VARCHAR(4);
    next_number INTEGER;
    new_projekt_nr VARCHAR(50);
BEGIN
    -- Jahr aus dem Startdatum extrahieren
    year_suffix := EXTRACT(YEAR FROM NEW.start_datum)::VARCHAR;
    
    -- Nächste Nummer für das Jahr ermitteln
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(projekt_nr FROM '\d+$') AS INTEGER)
    ), 0) + 1
    INTO next_number
    FROM projects
    WHERE projekt_nr LIKE 'WD-' || year_suffix || '-%';
    
    -- Neue Projektnummer generieren (WD-2025-001)
    new_projekt_nr := 'WD-' || year_suffix || '-' || LPAD(next_number::VARCHAR, 3, '0');
    
    NEW.projekt_nr := new_projekt_nr;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_projekt_nr
    BEFORE INSERT ON projects
    FOR EACH ROW
    EXECUTE FUNCTION generate_projekt_nr();
```

### Multi-Dienstleister-System (Epic 9)

```sql
-- Projekt-Dienstleister Many-to-Many Tabelle
CREATE TABLE project_suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    
    -- Budget-Management
    allocated_budget DECIMAL(12,2) NOT NULL DEFAULT 0,
    consumed_budget DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- Status und Soft-Delete
    is_active BOOLEAN NOT NULL DEFAULT true,
    removed_at TIMESTAMPTZ NULL,
    available_at_removal DECIMAL(12,2) NULL, -- Budget das zurückgeflossen ist
    removal_reason TEXT NULL,
    removed_by UUID REFERENCES auth.users(id),
    
    -- Metadaten
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(project_id, supplier_id),
    CHECK (allocated_budget >= 0),
    CHECK (consumed_budget >= 0),
    CHECK (consumed_budget <= allocated_budget)
);

-- Audit-Trail für Budget-Änderungen
CREATE TABLE budget_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    supplier_id UUID REFERENCES suppliers(id),
    
    -- Action Details
    action VARCHAR(50) NOT NULL, -- 'SUPPLIER_ADDED', 'SUPPLIER_REMOVED', 'BUDGET_CHANGED'
    old_budget DECIMAL(12,2),
    new_budget DECIMAL(12,2),
    consumed_budget DECIMAL(12,2),
    available_budget DECIMAL(12,2),
    
    -- Context
    reason TEXT,
    metadata JSONB, -- Zusätzliche Daten
    
    -- Audit-Felder
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indizes für Performance
CREATE INDEX idx_project_suppliers_project ON project_suppliers(project_id);
CREATE INDEX idx_project_suppliers_supplier ON project_suppliers(supplier_id);
CREATE INDEX idx_project_suppliers_active ON project_suppliers(is_active);
CREATE INDEX idx_budget_audit_log_project ON budget_audit_log(project_id);
CREATE INDEX idx_budget_audit_log_action ON budget_audit_log(action);
CREATE INDEX idx_budget_audit_log_created ON budget_audit_log(created_at);
```

### Dreidimensionales Budget-Tracking

```sql
CREATE TABLE project_budget_tracking (
    project_id UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Drei Dimensionen des Budget-Trackings
    veranschlagt_budget DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    zugewiesen_budget DECIMAL(12,2) NOT NULL DEFAULT 0.00,  
    verbraucht_budget DECIMAL(12,2) NOT NULL DEFAULT 0.00,   
    
    -- Auto-berechnete Schwellenwerte
    warning_threshold_80 DECIMAL(12,2) GENERATED ALWAYS AS (zugewiesen_budget * 0.80) STORED,
    warning_threshold_90 DECIMAL(12,2) GENERATED ALWAYS AS (zugewiesen_budget * 0.90) STORED,
    critical_threshold DECIMAL(12,2) GENERATED ALWAYS AS (zugewiesen_budget * 1.00) STORED,
    
    -- Budget-Status
    budget_status VARCHAR(20) NOT NULL DEFAULT 'HEALTHY' 
        CHECK (budget_status IN ('HEALTHY', 'WARNING', 'CRITICAL', 'EXCEEDED')),
    
    -- Transfer-Tracking
    transfers_in DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    transfers_out DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    net_transfers DECIMAL(12,2) GENERATED ALWAYS AS (transfers_in - transfers_out) STORED,
    
    -- Metadaten
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT positive_budgets CHECK (
        veranschlagt_budget >= 0 AND 
        zugewiesen_budget >= 0 AND 
        verbraucht_budget >= 0
    ),
    CONSTRAINT logical_budget_flow CHECK (zugewiesen_budget <= (veranschlagt_budget + net_transfers))
);

-- Trigger für automatische Budget-Status-Aktualisierung
CREATE OR REPLACE FUNCTION update_budget_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.zugewiesen_budget = 0 THEN
        NEW.budget_status := 'HEALTHY';
    ELSIF NEW.verbraucht_budget > NEW.zugewiesen_budget THEN
        NEW.budget_status := 'EXCEEDED';
    ELSIF NEW.verbraucht_budget >= (NEW.zugewiesen_budget * 0.90) THEN
        NEW.budget_status := 'CRITICAL';
    ELSIF NEW.verbraucht_budget >= (NEW.zugewiesen_budget * 0.80) THEN
        NEW.budget_status := 'WARNING';
    ELSE
        NEW.budget_status := 'HEALTHY';
    END IF;
    
    NEW.last_updated := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_budget_status
    BEFORE UPDATE ON project_budget_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_budget_status();
```

### Budget-Transfers

```sql
CREATE TABLE budget_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_project_id UUID NOT NULL REFERENCES projects(id),
    to_project_id UUID NOT NULL REFERENCES projects(id),
    amount DECIMAL(12,2) NOT NULL,
    reason TEXT NOT NULL,
    
    -- Workflow-Status
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' 
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    
    -- Antragsdaten
    requested_by UUID NOT NULL,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Genehmigungsdaten
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT different_projects CHECK (from_project_id != to_project_id),
    CONSTRAINT positive_amount CHECK (amount > 0),
    CONSTRAINT approval_data_consistency CHECK (
        (status = 'APPROVED' AND approved_by IS NOT NULL AND approved_at IS NOT NULL) OR
        (status != 'APPROVED')
    )
);

-- Indizes für Performance
CREATE INDEX idx_budget_transfers_from_project ON budget_transfers(from_project_id);
CREATE INDEX idx_budget_transfers_to_project ON budget_transfers(to_project_id);
CREATE INDEX idx_budget_transfers_status ON budget_transfers(status);
CREATE INDEX idx_budget_transfers_requested_by ON budget_transfers(requested_by);
```

### Rechnungsverarbeitung

```sql
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_filename VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    storage_path VARCHAR(1000) NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    uploaded_by UUID NOT NULL,
    
    -- OCR-Verarbeitungs-Status
    ocr_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' 
        CHECK (ocr_status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    ocr_provider VARCHAR(20) CHECK (ocr_provider IN ('google-vision', 'aws-textract', 'manual')),
    ocr_confidence DECIMAL(5,2),
    ocr_processed_at TIMESTAMPTZ,
    processing_duration_seconds INTEGER,
    
    -- Extrahierte Rechnungsdaten
    supplier_name VARCHAR(300),
    supplier_vat_id VARCHAR(50),
    invoice_number VARCHAR(100),
    invoice_date DATE,
    total_amount DECIMAL(12,2),
    vat_amount DECIMAL(12,2),
    net_amount DECIMAL(12,2),
    currency CHAR(3) DEFAULT 'EUR',
    
    -- Verarbeitungs-Metadaten
    ai_suggestions_generated BOOLEAN DEFAULT false,
    manual_validation_required BOOLEAN DEFAULT true,
    validated_at TIMESTAMPTZ,
    validated_by UUID,
    
    -- Lieferanten-Pattern-Referenz
    supplier_pattern_id UUID,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT positive_amounts CHECK (
        (total_amount IS NULL OR total_amount >= 0) AND
        (vat_amount IS NULL OR vat_amount >= 0) AND
        (net_amount IS NULL OR net_amount >= 0)
    )
);

CREATE INDEX idx_invoices_ocr_status ON invoices(ocr_status);
CREATE INDEX idx_invoices_supplier_name ON invoices(supplier_name);
CREATE INDEX idx_invoices_uploaded_by ON invoices(uploaded_by);
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date);
```

### Rechnungspositionen

```sql
CREATE TABLE invoice_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    
    -- Positionsdetails
    line_number INTEGER NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10,3),
    unit_price DECIMAL(12,2),
    total_price DECIMAL(12,2) NOT NULL,
    vat_rate DECIMAL(5,2),
    
    -- Projekt-Zuordnung
    assigned_project_id UUID REFERENCES projects(id),
    assigned_team_id UUID REFERENCES teams(id),
    assignment_method VARCHAR(20) DEFAULT 'MANUAL' 
        CHECK (assignment_method IN ('AI_SUGGESTED', 'MANUAL', 'RULE_BASED')),
    assignment_confidence DECIMAL(5,2),
    
    -- Validierungs-Tracking
    needs_validation BOOLEAN DEFAULT true,
    validated_at TIMESTAMPTZ,
    validated_by UUID,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT positive_price CHECK (total_price >= 0),
    CONSTRAINT valid_quantity CHECK (quantity IS NULL OR quantity > 0),
    CONSTRAINT consistent_assignment CHECK (
        (assigned_project_id IS NOT NULL AND assigned_team_id IS NOT NULL) OR
        (assigned_project_id IS NULL AND assigned_team_id IS NULL)
    )
);

CREATE INDEX idx_line_items_invoice ON invoice_line_items(invoice_id);
CREATE INDEX idx_line_items_project ON invoice_line_items(assigned_project_id);
CREATE INDEX idx_line_items_team ON invoice_line_items(assigned_team_id);
CREATE INDEX idx_line_items_validation ON invoice_line_items(needs_validation);
```

### Lieferanten-Pattern-Learning

```sql
CREATE TABLE supplier_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_name VARCHAR(300) NOT NULL,
    supplier_vat_id VARCHAR(50),
    
    -- Pattern-Daten (JSON für Flexibilität)
    document_structure JSONB,
    field_mappings JSONB,
    
    -- Lern-Statistiken
    total_invoices_processed INTEGER DEFAULT 0,
    average_confidence DECIMAL(5,2) DEFAULT 0.0,
    pattern_accuracy DECIMAL(5,2) DEFAULT 0.0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(supplier_name, supplier_vat_id)
);

CREATE INDEX idx_supplier_patterns_name ON supplier_patterns(supplier_name);
CREATE INDEX idx_supplier_patterns_active ON supplier_patterns(is_active);
```

### Audit-Trail

```sql
CREATE TABLE audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(20) NOT NULL 
        CHECK (entity_type IN ('PROJECT', 'BUDGET', 'INVOICE', 'TRANSFER', 'USER')),
    entity_id UUID NOT NULL,
    
    -- Änderungsdetails
    action VARCHAR(20) NOT NULL 
        CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT')),
    field_changes JSONB,
    
    -- Benutzer-Kontext
    performed_by UUID NOT NULL,
    performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    
    -- Deutsche Geschäfts-Compliance
    compliance_note TEXT,
    approval_required BOOLEAN DEFAULT false,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    
    -- Unveränderlichkeits-Schutz
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indizes für Audit-Queries
CREATE INDEX idx_audit_entity ON audit_trail(entity_type, entity_id);
CREATE INDEX idx_audit_performed_by ON audit_trail(performed_by);
CREATE INDEX idx_audit_performed_at ON audit_trail(performed_at);
CREATE INDEX idx_audit_approval_required ON audit_trail(approval_required) WHERE approval_required = true;

-- Unveränderlichkeits-Schutz
CREATE OR REPLACE FUNCTION protect_audit_trail()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit trail entries cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_protect_audit_trail_update
    BEFORE UPDATE ON audit_trail
    FOR EACH ROW
    EXECUTE FUNCTION protect_audit_trail();

CREATE TRIGGER trigger_protect_audit_trail_delete
    BEFORE DELETE ON audit_trail
    FOR EACH ROW
    EXECUTE FUNCTION protect_audit_trail();
```

## Datenbankfunktionen

### Performance-Optimierung

```sql
-- Materialized View für Dashboard-Performance
CREATE MATERIALIZED VIEW dashboard_summary AS
SELECT 
    ab.year,
    ab.total_budget,
    ab.allocated_budget,
    ab.consumed_budget,
    COUNT(p.id) as total_projects,
    COUNT(CASE WHEN pbt.budget_status = 'WARNING' THEN 1 END) as warning_projects,
    COUNT(CASE WHEN pbt.budget_status = 'CRITICAL' THEN 1 END) as critical_projects,
    COUNT(CASE WHEN pbt.budget_status = 'EXCEEDED' THEN 1 END) as exceeded_projects
FROM annual_budgets ab
LEFT JOIN projects p ON p.annual_budget_id = ab.id
LEFT JOIN project_budget_tracking pbt ON pbt.project_id = p.id
WHERE ab.status = 'ACTIVE'
GROUP BY ab.id, ab.year, ab.total_budget, ab.allocated_budget, ab.consumed_budget;

-- Index für Materialized View
CREATE UNIQUE INDEX idx_dashboard_summary_year ON dashboard_summary(year);

-- Refresh-Funktion
CREATE OR REPLACE FUNCTION refresh_dashboard_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_summary;
END;
$$ LANGUAGE plpgsql;
```

### Deutsche Lokalisierung

```sql
-- Deutsche Collation für korrekte Sortierung
CREATE COLLATION german (locale = 'de_DE.UTF-8');

-- Deutsche Datum-Funktionen
CREATE OR REPLACE FUNCTION format_german_date(input_date DATE)
RETURNS TEXT AS $$
BEGIN
    RETURN to_char(input_date, 'DD.MM.YYYY');
END;
$$ LANGUAGE plpgsql;

-- Deutsche Währungsformatierung
CREATE OR REPLACE FUNCTION format_euro_amount(amount DECIMAL)
RETURNS TEXT AS $$
BEGIN
    RETURN to_char(amount, '999G999G999D00 €');
END;
$$ LANGUAGE plpgsql;
```