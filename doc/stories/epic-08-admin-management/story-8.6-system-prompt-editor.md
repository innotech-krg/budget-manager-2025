# Story 8.6: System-Prompt-Editor

## 📋 **STORY DETAILS**

**Epic:** 8 - Admin-Management-System  
**Story ID:** 8.6  
**Titel:** System-Prompt-Editor für AI  
**Priorität:** MITTEL  
**Aufwand:** 1 Woche  
**Abhängigkeiten:** Story 8.5

---

## 🎯 **USER STORY**

**Als** SuperAdmin  
**möchte ich** die AI-System-Prompts bearbeiten können  
**damit** ich die OCR-Genauigkeit und AI-Verhalten optimieren kann.

---

## ✅ **AKZEPTANZKRITERIEN**

### **KI-Provider Management:**
- [ ] Übersicht aller konfigurierten KI-Provider (OpenAI, Anthropic, zukünftige)
- [ ] Status-Anzeige für jeden Provider (aktiv/inaktiv, letzte Nutzung, Kosten)
- [ ] Provider aktivieren/deaktivieren und konfigurieren
- [ ] Konfiguration von Provider-spezifischen Einstellungen (Modell, Limits)
- [ ] Plugin-System für neue KI-Provider

### **System-Prompt-Editor:**
- [ ] Liste aller AI-Prompts (OCR, Supplier-Recognition, etc.)
- [ ] WYSIWYG-Editor mit Syntax-Highlighting
- [ ] Prompt-Vorschau und Test-Funktionalität
- [ ] Versionierung und Rollback-Möglichkeit
- [ ] A/B-Testing für verschiedene Prompt-Versionen
- [ ] Prompt-Templates für häufige Anwendungsfälle

### **Backend Integration:**
- [ ] Prompts in Datenbank speichern
- [ ] API für Prompt-Management
- [ ] Live-Reload ohne Server-Neustart
- [ ] Audit-Log für Prompt-Änderungen

---

## 🔧 **TECHNISCHE SPEZIFIKATION**

### **Prompt-Editor Komponente:**
```typescript
// frontend/src/components/admin/PromptEditor.tsx
export const PromptEditor: React.FC = () => {
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<AIPrompt | null>(null);
  const [editorContent, setEditorContent] = useState('');
  
  // Monaco Editor für Code-Editing
  // Test-Funktionalität für Prompts
};
```

### **Database Schema:**
```sql
-- AI-Prompts Tabelle
CREATE TABLE public.ai_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  prompt_text TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 📋 **DEFINITION OF DONE**

- [ ] Prompt-Editor funktional
- [ ] AI-Integration aktualisiert Prompts live
- [ ] Versionierung implementiert
- [ ] Test-Funktionalität verfügbar
