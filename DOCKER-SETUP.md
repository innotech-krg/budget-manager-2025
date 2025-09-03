# 🐳 Docker Setup - Budget Manager 2025

**Professionelle Multi-Container-Architektur für Development und Production**

## 🏗️ Architektur-Übersicht

### **Multi-Container Setup:**
- **Frontend**: React + Vite (Development) / NGINX (Production)
- **Backend**: Node.js + Express mit ImageMagick
- **Reverse Proxy**: NGINX mit Load Balancing
- **Cache**: Redis für Sessions und Caching
- **Monitoring**: Prometheus + Grafana (Production)

## 🚀 Quick Start

### **Development Environment**
```bash
# 1. Environment konfigurieren
cp env-templates/backend.env.example .env
# .env bearbeiten mit Ihren API-Keys

# 2. Development starten
./docker/scripts/start-dev.sh

# 3. Services verfügbar unter:
# Frontend:     http://localhost:3000
# Backend:      http://localhost:3001
# Redis GUI:    http://localhost:8081
# Mailhog:      http://localhost:8025
```

### **Production Environment**
```bash
# 1. Production Environment konfigurieren
cp env-templates/backend.env.example .env.production
# .env.production mit Production-Werten bearbeiten

# 2. Production starten
./docker/scripts/start-prod.sh

# 3. Services verfügbar unter:
# Application:  http://localhost
# Monitoring:   http://localhost:9090
# Dashboards:   http://localhost:3001
```

## 📋 Verfügbare Commands

### **Development**
```bash
# Services starten
docker-compose -f docker-compose.dev.yml up -d

# Mit Build
docker-compose -f docker-compose.dev.yml up --build -d

# Logs anzeigen
docker-compose -f docker-compose.dev.yml logs -f

# Services stoppen
docker-compose -f docker-compose.dev.yml down

# Einzelnen Service neu starten
docker-compose -f docker-compose.dev.yml restart backend
```

### **Production**
```bash
# Services starten
docker-compose -f docker-compose.prod.yml up -d

# Backend skalieren
docker-compose -f docker-compose.prod.yml up --scale backend=3 -d

# Logs anzeigen
docker-compose -f docker-compose.prod.yml logs -f

# Services stoppen
docker-compose -f docker-compose.prod.yml down
```

## 🔧 Konfiguration

### **Environment Variables**

**Development (.env):**
```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI APIs
OPENAI_API_KEY=sk-proj-your-key
ANTHROPIC_API_KEY=sk-ant-your-key

# Security
JWT_SECRET=your-dev-secret
```

**Production (.env.production):**
```env
# Alle Development-Variablen PLUS:
REDIS_PASSWORD=secure-redis-password
GRAFANA_PASSWORD=secure-grafana-password

# Production-spezifische URLs
SUPABASE_URL=https://your-prod-project.supabase.co
```

### **SSL-Zertifikate (Production)**
```bash
# SSL-Zertifikate in docker/nginx/ssl/ platzieren:
docker/nginx/ssl/cert.pem
docker/nginx/ssl/key.pem
```

## 🏗️ Container-Details

### **Frontend Container**
- **Development**: Vite Dev Server mit Hot-Reload
- **Production**: NGINX mit optimierten Static Assets
- **Volumes**: Source-Code (Dev), Build-Artefakte (Prod)

### **Backend Container**
- **Base**: Node.js 18 Alpine mit ImageMagick
- **Security**: Non-root User, Health Checks
- **Volumes**: Uploads, Temp-Files, Logs

### **NGINX Container**
- **Features**: Reverse Proxy, Load Balancing, SSL
- **Optimierungen**: Gzip, Caching, Rate Limiting
- **Health Checks**: Automatische Service-Überwachung

### **Redis Container**
- **Persistence**: AOF + RDB Snapshots
- **Security**: Password-Protection (Production)
- **Monitoring**: Health Checks, Metrics

## 📊 Monitoring & Logging

### **Production Monitoring**
- **Prometheus**: Metrics Collection (Port 9090)
- **Grafana**: Dashboards (Port 3001)
- **Health Checks**: Automatische Service-Überwachung

### **Development Tools**
- **Redis Commander**: Redis GUI (Port 8081)
- **Mailhog**: E-Mail Testing (Port 8025)
- **Debug Ports**: Node.js Debugging (Port 9229)

## 🔒 Sicherheit

### **Production Security Features**
- Non-root Container Users
- Resource Limits (CPU/Memory)
- Health Checks mit Restart Policies
- NGINX Security Headers
- Rate Limiting für APIs
- SSL/TLS Support

### **Network Isolation**
- Dedicated Docker Network (172.20.0.0/16)
- Service-to-Service Communication
- Keine direkten Port-Exposes (außer NGINX)

## 🚀 Performance-Optimierungen

### **Frontend**
- Multi-Stage Builds
- NGINX Gzip Compression
- Static Asset Caching (1 Jahr)
- Bundle Optimization

### **Backend**
- Node.js Production Mode
- ImageMagick Optimierungen
- Redis Caching
- Connection Pooling

### **NGINX**
- Load Balancing (Least Connections)
- Keep-Alive Connections
- Proxy Caching
- Optimierte Worker Processes

## 🔧 Troubleshooting

### **Häufige Probleme**

**Services starten nicht:**
```bash
# Logs prüfen
docker-compose logs service-name

# Container-Status prüfen
docker ps -a

# Health Checks prüfen
docker inspect container-name
```

**Port-Konflikte:**
```bash
# Verwendete Ports prüfen
netstat -tulpn | grep :3000

# Services auf anderen Ports starten
PORT=3002 docker-compose up
```

**Volume-Probleme:**
```bash
# Volumes neu erstellen
docker-compose down -v
docker-compose up -d
```

## 📈 Skalierung

### **Horizontale Skalierung**
```bash
# Backend-Instanzen skalieren
docker-compose -f docker-compose.prod.yml up --scale backend=3 -d

# Load Balancing automatisch via NGINX
```

### **Vertikale Skalierung**
```yaml
# In docker-compose.prod.yml
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 2G
```

## 🎯 Nächste Schritte

1. **CI/CD Pipeline** - GitHub Actions Integration
2. **Container Registry** - Docker Hub/AWS ECR
3. **Orchestration** - Kubernetes/Docker Swarm
4. **Monitoring** - ELK Stack, Jaeger Tracing
5. **Backup** - Automatisierte Volume-Backups

---

**🐳 Docker Setup ist vollständig konfiguriert und produktionsreif!**

*Ihre bestehende Implementierung bleibt unverändert - Docker erweitert nur die Deployment-Optionen.*
