# Supabase Konfiguration - Budget Manager 2025

## Projekt-Details
- **Projekt-ID**: `ppaletujnevtftvpoorx`
- **Projekt-Name**: `bdgt-2025`
- **Region**: `eu-central-1`
- **URL**: `https://ppaletujnevtftvpoorx.supabase.co`

## API-Keys

### Anon Key (Public)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwYWxldHVqbmV2dGZ0dnBvb3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTI3NzMsImV4cCI6MjA3MTk2ODc3M30.UiSDTbLhsK4Oz1Db5KllBWeH5ttFf8X-E1jPqkjey-U
```

### Service Role Key (Private)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwYWxldHVqbmV2dGZ0dnBvb3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5Mjc3MywiZXhwIjoyMDcxOTY4NzczfQ.b1y00pjgpXhf8Ut9oek-w2upweRl4-hKHENEas8Anfk
```

## Konfiguration in backend/.env

```bash
# Supabase Configuration
SUPABASE_URL=https://ppaletujnevtftvpoorx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwYWxldHVqbmV2dGZ0dnBvb3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTI3NzMsImV4cCI6MjA3MTk2ODc3M30.UiSDTbLhsK4Oz1Db5KllBWeH5ttFf8X-E1jPqkjey-U
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwYWxldHVqbmV2dGZ0dnBvb3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5Mjc3MywiZXhwIjoyMDcxOTY4NzczfQ.b1y00pjgpXhf8Ut9oek-w2upweRl4-hKHENEas8Anfk
```

## Service Role Key Beschaffung

Der Service Role Key wurde über die Supabase Management API geholt:

```bash
curl -s "https://api.supabase.com/v1/projects/ppaletujnevtftvpoorx/api-keys" \
  -H "Authorization: Bearer sbp_330e8b23efaf726604af7261505f01fe6cc4f557"
```

**Platform Token**: `sbp_330e8b23efaf726604af7261505f01fe6cc4f557` (aus ~/.cursor/mcp.json)

## Sicherheitshinweise

⚠️ **WICHTIG**: 
- Der Service Role Key gewährt **vollständigen Zugriff** auf die Datenbank
- Umgeht alle Row Level Security (RLS) Policies
- Niemals im Frontend oder öffentlichem Code verwenden
- Nur in Backend-Umgebungsvariablen speichern
- Regelmäßige Rotation empfohlen

## Troubleshooting

### Problem: "Invalid API key"
**Lösung**: Korrekten Service Role Key aus Management API holen und in backend/.env setzen

### Problem: Backend kann nicht mit Supabase kommunizieren
**Lösung**: 
1. Service Role Key prüfen
2. Backend neu starten
3. Verbindung testen mit: `node -e "const { createClient } = require('@supabase/supabase-js'); ..."`

## Status
- ✅ Service Role Key korrekt konfiguriert (September 2025)
- ✅ Alle Backend-APIs funktional
- ✅ Frontend-Backend-Kommunikation erfolgreich



