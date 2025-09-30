# Guía de Deploy en VPS - La Casa del Suelo Radiante

## ✅ Pre-requisitos Verificados

### 1. **Variables de Entorno** ✅
- `.env.example` y `.env.production.example` configurados
- **REQUERIDAS para VPS:**
  ```bash
  # Supabase
  NEXT_PUBLIC_SUPABASE_URL=https://supabase.lacasadelsueloradianteapp.com
  NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
  SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
  
  # Email (Zoho SMTP)
  EMAIL_USER=tu_email@zoho.com
  EMAIL_PASSWORD=tu_password_de_aplicacion
  
  # Next.js (para producción)
  NEXTAUTH_URL=https://lacasadelsueloradianteapp.com
  NEXTAUTH_SECRET=genera_un_secret_seguro
  NODE_ENV=production
  ```

### 2. **Configuración Next.js** ✅
- `next.config.js` configurado para producción
- Output: `standalone` (optimizado para Docker)
- Headers de seguridad configurados
- Compresión habilitada
- Imágenes optimizadas para Supabase

### 3. **Base de Datos** ✅
- Supabase configurado correctamente
- Cliente configurado en `src/lib/supabase.ts`

### 4. **Sistema de Email** ✅
- Zoho SMTP configurado en `emailService.server.ts`
- Variables de entorno preparadas

### 5. **Docker & Docker Compose** ✅
- `Dockerfile` multi-stage optimizado
- `docker-compose.yml` con PostgreSQL, Next.js y Nginx
- Configuración de redes y volúmenes

### 6. **Nginx** ✅
- Proxy reverso configurado
- SSL/HTTPS configurado
- Cache de archivos estáticos
- Headers de seguridad

## 🚀 Pasos para Deploy

### 1. **Preparar el VPS**
```bash
# Instalar Docker y Docker Compose
sudo apt update
sudo apt install docker.io docker-compose -y
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

### 2. **Clonar el Repositorio**
```bash
git clone https://github.com/Martiiroth/lacasadelsueloradiante.git
cd lacasadelsueloradiante
```

### 3. **Configurar Variables de Entorno**
```bash
# Copiar y editar el archivo de producción
cp .env.production.example .env.production
nano .env.production
```

### 4. **Preparar SSL (Certificados)**
```bash
# Crear directorio SSL
mkdir -p nginx/ssl

# Opción 1: Let's Encrypt (recomendado)
sudo apt install certbot
sudo certbot certonly --standalone -d lacasadelsueloradianteapp.com

# Copiar certificados
sudo cp /etc/letsencrypt/live/lacasadelsueloradianteapp.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/lacasadelsueloradianteapp.com/privkey.pem nginx/ssl/key.pem

# Opción 2: Certificados auto-firmados (solo para testing)
openssl req -x509 -newkey rsa:4096 -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem -days 365 -nodes
```

### 5. **Build y Deploy**
```bash
# Build de la aplicación
docker-compose build

# Iniciar servicios
docker-compose up -d

# Verificar que todo está funcionando
docker-compose ps
docker-compose logs nextjs-app
```

### 6. **Verificar Deploy**
```bash
# Comprobar que los servicios están corriendo
curl -k https://localhost
curl -k https://lacasadelsueloradianteapp.com

# Ver logs si hay problemas
docker-compose logs -f nextjs-app
docker-compose logs -f nginx
```

## 🔧 Comandos Útiles para Mantenimiento

```bash
# Actualizar la aplicación
git pull origin main
docker-compose build nextjs-app
docker-compose up -d --no-deps nextjs-app

# Ver logs en tiempo real
docker-compose logs -f

# Reiniciar servicios
docker-compose restart

# Limpiar containers e imágenes viejas
docker system prune -a

# Backup de la base de datos (si usas PostgreSQL local)
docker-compose exec postgres pg_dump -U postgres lacasadelsueloradiante > backup.sql

# Restaurar backup
docker-compose exec -T postgres psql -U postgres lacasadelsueloradiante < backup.sql
```

## ⚠️ Checklist Final Antes del Deploy

- [ ] Variables de entorno configuradas en `.env.production`
- [ ] Certificados SSL copiados a `nginx/ssl/`
- [ ] Dominio apuntando al VPS (DNS configurado)
- [ ] Puerto 80 y 443 abiertos en firewall
- [ ] Docker y Docker Compose instalados
- [ ] Supabase configurado y accesible
- [ ] Credenciales de email de Zoho configuradas

## 🛠️ Troubleshooting

### Problema: La aplicación no inicia
```bash
# Verificar logs
docker-compose logs nextjs-app

# Verificar variables de entorno
docker-compose exec nextjs-app env | grep NEXT_PUBLIC
```

### Problema: SSL no funciona
```bash
# Verificar certificados
ls -la nginx/ssl/
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Verificar configuración Nginx
docker-compose exec nginx nginx -t
```

### Problema: Base de datos no conecta
```bash
# Si usas Supabase, verificar conectividad
curl -I https://supabase.lacasadelsueloradianteapp.com

# Si usas PostgreSQL local, verificar container
docker-compose exec postgres psql -U postgres -l
```

## 📈 Optimizaciones Post-Deploy

1. **Monitoreo**: Instalar herramientas como Portainer, cAdvisor
2. **Backup automático**: Script de backup automatizado
3. **Updates automáticos**: Webhook para auto-deploy desde GitHub
4. **CDN**: Configurar CloudFlare para cache global
5. **Monitoring**: Logs centralizados con ELK stack o similar

## 🔒 Seguridad

- Firewall configurado (solo puertos 22, 80, 443)
- Certificados SSL actualizados regularmente
- Variables de entorno seguras
- Backup regular de la base de datos
- Updates del sistema operativo

---

**Estado del Build**: ✅ LISTO PARA PRODUCCIÓN
**Última verificación**: $(date)