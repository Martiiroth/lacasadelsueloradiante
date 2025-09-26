-- Script para verificar y crear políticas RLS necesarias para admin

-- 1. Verificar estado RLS de la tabla clients
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'clients';

-- 2. Verificar políticas existentes para clients
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'clients';

-- 3. Crear política para permitir INSERT desde aplicación
-- (Esto debería ejecutarse solo si no existe una política similar)
/*
CREATE POLICY "Allow authenticated users to insert clients" 
ON public.clients 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to select clients" 
ON public.clients 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to update clients" 
ON public.clients 
FOR UPDATE 
TO authenticated 
USING (true);
*/

-- 4. Verificar roles de usuario
SELECT id, name, description FROM customer_roles;