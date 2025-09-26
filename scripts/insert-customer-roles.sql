-- Insertar roles básicos de cliente si no existen

INSERT INTO customer_roles (id, name, description) VALUES 
(1, 'guest', 'Cliente básico/visitante'),
(2, 'sat', 'Servicio de Atención Técnica'),
(3, 'instalador', 'Instalador certificado'),
(4, 'admin', 'Administrador del sistema')
ON CONFLICT (name) DO NOTHING;

-- Verificar que se crearon correctamente
SELECT * FROM customer_roles ORDER BY id;