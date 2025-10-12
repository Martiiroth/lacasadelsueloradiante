-- Políticas RLS para la tabla brands
-- Habilitar RLS en la tabla brands
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Política para lectura pública de marcas activas
CREATE POLICY "Brands are publicly readable" 
ON public.brands FOR SELECT 
USING (is_active = true);

-- Política para que los administradores puedan ver todas las marcas
CREATE POLICY "Admin can view all brands" 
ON public.brands FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Política para que los administradores puedan insertar marcas
CREATE POLICY "Admin can insert brands" 
ON public.brands FOR INSERT 
TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Política para que los administradores puedan actualizar marcas
CREATE POLICY "Admin can update brands" 
ON public.brands FOR UPDATE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Política para que los administradores puedan eliminar marcas
CREATE POLICY "Admin can delete brands" 
ON public.brands FOR DELETE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);