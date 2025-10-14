# COMANDOS PARA REINICIAR SUPABASE CON NUEVA CONFIGURACIÓN DE EMAIL

# ======================================
# OPCIÓN 1: REINICIAR SOLO EL SERVICIO DE AUTH (MÁS RÁPIDO)
# ======================================

# Reiniciar solo el contenedor de autenticación de Supabase
docker-compose restart auth

# Ver logs para verificar que carga la nueva configuración
docker-compose logs -f auth

# ======================================
# OPCIÓN 2: REINICIAR TODOS LOS SERVICIOS DE SUPABASE
# ======================================

# Parar todos los servicios de Supabase (conserva datos)
docker-compose down

# Iniciar con la nueva configuración del .env
docker-compose up -d

# Ver logs de los servicios principales
docker-compose logs -f auth kong

# ======================================
# VERIFICAR QUE LA CONFIGURACIÓN SMTP SE APLICÓ
# ======================================

# Ver las variables de entorno del contenedor auth
docker exec supabase-auth env | grep GOTRUE_SMTP

# Debería mostrar algo como:
# GOTRUE_SMTP_HOST=mail.lacasadelsueloradiante.es
# GOTRUE_SMTP_PORT=587
# GOTRUE_SMTP_USER=consultas@lacasadelsueloradiante.es
# GOTRUE_SMTP_PASS=Limpiezas-2024
# GOTRUE_SMTP_SENDER_NAME=La Casa del Suelo Radiante

# ======================================
# SI HAY PROBLEMAS
# ======================================

# Ver logs detallados del servicio auth
docker logs supabase-auth -f

# Ver estado de todos los contenedores
docker ps

# Ver qué archivos .env está leyendo docker-compose
ls -la *.env

# ======================================
# DESPUÉS DEL REINICIO
# ======================================

# Probar el sistema de recuperación desde tu aplicación Next.js
# Ir a: https://lacasadelsueloradiante.es/auth/forgot-password
# Y probar con un email registrado

# O probar el API de Supabase directamente:
# curl -X POST "https://supabase.lacasadelsueloradianteapp.com/auth/v1/recover" \
#   -H "Content-Type: application/json" \
#   -H "apikey: tu-anon-key" \
#   -d '{"email": "usuario@test.com"}'