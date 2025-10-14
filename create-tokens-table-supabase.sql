-- Script SQL para crear tabla de tokens de recuperación de contraseña
-- Ejecuta esto en el SQL Editor de tu dashboard de Supabase

-- Habilitar extensión UUID si no está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear tabla de tokens de recuperación de contraseña
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  token uuid UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
  email text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  used boolean DEFAULT false NOT NULL
);

-- Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Verificar que la tabla se creó correctamente
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'password_reset_tokens'
ORDER BY ordinal_position;

-- Insertar token de prueba para javipablo0408@gmail.com
INSERT INTO password_reset_tokens (token, email, expires_at, used)
VALUES (
  'b025ba5d-ccf1-441b-8dc3-824e6b1aed1c',  -- Token del último email enviado
  'javipablo0408@gmail.com',
  NOW() + INTERVAL '1 hour',
  false
)
ON CONFLICT (token) DO UPDATE SET
  expires_at = NOW() + INTERVAL '1 hour',
  used = false,
  created_at = NOW();

-- Verificar que el token se insertó correctamente
SELECT * FROM password_reset_tokens WHERE email = 'javipablo0408@gmail.com';