# Story 8.4: SuperAdmin Benutzerverwaltung

## 📋 **STORY DETAILS**

**Epic:** 8 - Admin-Management-System  
**Story ID:** 8.4  
**Titel:** SuperAdmin Benutzerverwaltung  
**Priorität:** HOCH  
**Aufwand:** 1 Woche  
**Abhängigkeiten:** Story 8.1, 8.2, 8.3

---

## 🎯 **USER STORY**

**Als** SuperAdmin  
**möchte ich** Benutzer anlegen, bearbeiten und verwalten können  
**damit** ich die Systemzugriffe kontrollieren und neue Mitarbeiter hinzufügen kann.

---

## ✅ **AKZEPTANZKRITERIEN**

### **Benutzerverwaltung UI:**
- [ ] ❌ **NICHT IMPLEMENTIERT** - Benutzer-Liste mit Suche und Filterung
- [ ] ❌ **NICHT IMPLEMENTIERT** - Neuen Benutzer anlegen (E-Mail, Name, Rolle)
- [ ] ❌ **NICHT IMPLEMENTIERT** - Benutzer bearbeiten (Name, Rolle, Status)
- [ ] ❌ **NICHT IMPLEMENTIERT** - Benutzer deaktivieren/aktivieren
- [ ] ❌ **NICHT IMPLEMENTIERT** - Rollen-Änderung mit Bestätigung
- [ ] ❌ **NICHT IMPLEMENTIERT** - Audit-Log für alle Änderungen anzeigen

### **Backend API:**
- [ ] ❌ **NICHT IMPLEMENTIERT** - `GET /api/admin/users` - Alle Benutzer auflisten
- [ ] ❌ **NICHT IMPLEMENTIERT** - `POST /api/admin/users` - Neuen Benutzer erstellen
- [ ] ❌ **NICHT IMPLEMENTIERT** - `PUT /api/admin/users/:id` - Benutzer aktualisieren
- [ ] ❌ **NICHT IMPLEMENTIERT** - `DELETE /api/admin/users/:id` - Benutzer deaktivieren
- [ ] ❌ **NICHT IMPLEMENTIERT** - `GET /api/admin/users/:id/audit` - Benutzer Audit-Log

### **Sicherheit:**
- [ ] ❌ **NICHT IMPLEMENTIERT** - Nur SuperAdmin Zugriff
- [ ] ❌ **NICHT IMPLEMENTIERT** - Passwort-Generierung für neue Benutzer
- [ ] ❌ **NICHT IMPLEMENTIERT** - E-Mail-Benachrichtigung bei Konto-Erstellung
- [ ] ❌ **NICHT IMPLEMENTIERT** - Selbst-Löschung verhindern

---

## 🔧 **TECHNISCHE SPEZIFIKATION**

### **Frontend Komponente:**
```typescript
// frontend/src/components/admin/UserManagement.tsx
export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // CRUD-Operationen für Benutzer
};
```

### **Backend Controller:**
```javascript
// backend/src/controllers/adminUserController.js
class AdminUserController {
  async getAllUsers(req, res) {
    // Alle Benutzer mit Rollen abrufen
  }
  
  async createUser(req, res) {
    // Neuen Benutzer über Supabase Auth erstellen
    // User-Profile in Datenbank anlegen
    // E-Mail-Benachrichtigung senden
  }
  
  async updateUser(req, res) {
    // Benutzer-Daten aktualisieren
    // Rollen-Änderung loggen
  }
  
  async deactivateUser(req, res) {
    // Benutzer deaktivieren (nicht löschen)
  }
}
```

---

## 📋 **DEFINITION OF DONE**

- [ ] ❌ **NICHT ERFÜLLT** - Alle Akzeptanzkriterien erfüllt
- [ ] ❌ **NICHT ERFÜLLT** - SuperAdmin kann Benutzer vollständig verwalten
- [ ] ❌ **NICHT ERFÜLLT** - Sicherheitstests bestehen
- [ ] ❌ **NICHT ERFÜLLT** - E-Mail-Benachrichtigungen funktionieren
- [ ] ❌ **NICHT ERFÜLLT** - Audit-Log vollständig implementiert

---

## 🚨 **AKTUELLER STATUS (Nach Konsolidierung)**

**Story Status:** ❌ **NICHT IMPLEMENTIERT** (0%)

### **Problem:**
Nach der Code-Konsolidierung ist die Benutzerverwaltung nicht mehr verfügbar. Der Admin-Bereich zeigt keine Benutzerverwaltung an.

### **Fehlende Komponenten:**
- `UserManagement.tsx` - Benutzerverwaltung UI
- `AdminUserController.js` - Backend API für User-CRUD
- Admin-Routen für Benutzerverwaltung
- Integration mit Supabase Auth für User-Erstellung

### **Nächste Schritte:**
1. UserManagement Komponente implementieren
2. Backend APIs für User-CRUD entwickeln
3. Admin-Bereich Integration
4. Sicherheitstests durchführen
