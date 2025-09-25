-- Datos de prueba para La Casa del Suelo Radiante
-- Ejecutar este script en Supabase SQL Editor

-- 1. Insertar roles de cliente (si no existen)
INSERT INTO customer_roles (id, name, description, created_at, updated_at) VALUES
(1, 'admin', 'Administrador del sistema', NOW(), NOW()),
(2, 'sat', 'Servicio de Atención Técnica', NOW(), NOW()),
(3, 'instalador', 'Instalador profesional', NOW(), NOW()),
(4, 'guest', 'Cliente general', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- 2. Script principal con variables para UUIDs
DO $$
DECLARE
    -- Variables para categorías
    cat_suelos UUID := gen_random_uuid();
    cat_termostatos UUID := gen_random_uuid();
    cat_calderas UUID := gen_random_uuid();
    cat_accesorios UUID := gen_random_uuid();
    cat_bombas UUID := gen_random_uuid();
    cat_electricos UUID := gen_random_uuid();
    cat_agua UUID := gen_random_uuid();
    
    -- Variables para productos
    prod_suelo_electrico UUID := gen_random_uuid();
    prod_termostato_wifi UUID := gen_random_uuid();
    prod_caldera_25kw UUID := gen_random_uuid();
    prod_bomba_grundfos UUID := gen_random_uuid();
    prod_kit_agua UUID := gen_random_uuid();
    prod_termostato_basico UUID := gen_random_uuid();
    
    -- Variables para variantes
    var_suelo_150w UUID := gen_random_uuid();
    var_suelo_300w UUID := gen_random_uuid();
    var_suelo_450w UUID := gen_random_uuid();
    var_termo_blanco UUID := gen_random_uuid();
    var_termo_negro UUID := gen_random_uuid();
    var_caldera_std UUID := gen_random_uuid();
    var_bomba_25_40 UUID := gen_random_uuid();
    var_bomba_25_60 UUID := gen_random_uuid();
    var_kit_100m2 UUID := gen_random_uuid();
    var_termo_basic UUID := gen_random_uuid();
    
BEGIN
    -- Insertar categorías
    INSERT INTO categories (id, name, slug, parent_id, created_at, updated_at) VALUES
    (cat_suelos, 'Suelos Radiantes', 'suelos-radiantes', NULL, NOW(), NOW()),
    (cat_termostatos, 'Termostatos', 'termostatos', NULL, NOW(), NOW()),
    (cat_calderas, 'Calderas', 'calderas', NULL, NOW(), NOW()),
    (cat_accesorios, 'Accesorios', 'accesorios', NULL, NOW(), NOW()),
    (cat_bombas, 'Bombas de Calor', 'bombas-calor', NULL, NOW(), NOW()),
    (cat_electricos, 'Sistemas Eléctricos', 'sistemas-electricos', cat_suelos, NOW(), NOW()),
    (cat_agua, 'Sistemas de Agua', 'sistemas-agua', cat_suelos, NOW(), NOW());

    -- Insertar productos
    INSERT INTO products (id, slug, title, short_description, description, is_new, is_on_sale, meta_title, meta_description, created_at, updated_at) VALUES
    (prod_suelo_electrico, 'suelo-radiante-electrico-premium', 'Sistema de Suelo Radiante Eléctrico Premium', 'Sistema completo de calefacción por suelo radiante eléctrico de alta eficiencia', '<h2>Descripción</h2><p>Nuestro sistema de suelo radiante eléctrico premium ofrece la máxima eficiencia energética y confort. Incluye cables calefactores de última generación, termostato digital y kit de instalación completo.</p><h3>Características:</h3><ul><li>Cables calefactores de doble núcleo</li><li>Potencia regulable</li><li>Instalación sencilla</li><li>Garantía de 10 años</li></ul>', true, false, 'Suelo Radiante Eléctrico Premium | La Casa del Suelo Radiante', 'Sistema completo de calefacción por suelo radiante eléctrico con máxima eficiencia', NOW(), NOW()),
    
    (prod_termostato_wifi, 'termostato-digital-wifi', 'Termostato Digital WiFi Inteligente', 'Control total de tu calefacción desde cualquier lugar', '<h2>Termostato Inteligente</h2><p>Controla tu sistema de calefacción desde cualquier lugar con nuestro termostato WiFi de última generación.</p><h3>Funciones:</h3><ul><li>Control remoto vía app</li><li>Programación semanal</li><li>Detección de presencia</li><li>Compatible con Alexa y Google</li></ul>', true, true, 'Termostato WiFi Inteligente | Control Remoto', 'Termostato digital WiFi con control remoto y programación inteligente', NOW(), NOW()),
    
    (prod_caldera_25kw, 'caldera-condensacion-25kw', 'Caldera de Condensación 25kW', 'Caldera de condensación de alta eficiencia para viviendas unifamiliares', '<h2>Caldera de Condensación</h2><p>Caldera mural de condensación con tecnología de última generación para máximo rendimiento y mínimo consumo.</p><h3>Especificaciones:</h3><ul><li>Potencia: 25kW</li><li>Eficiencia: A+++</li><li>Modulación: 1:10</li><li>Garantía: 5 años</li></ul>', false, true, 'Caldera Condensación 25kW | Alta Eficiencia', 'Caldera de condensación 25kW con máxima eficiencia energética', NOW(), NOW()),
    
    (prod_bomba_grundfos, 'bomba-circulacion-grundfos', 'Bomba de Circulación Grundfos Alpha2', 'Bomba de circulación de alta eficiencia con control automático', '<h2>Bomba Grundfos Alpha2</h2><p>Bomba de circulación de alta eficiencia con tecnología AUTO ADAPT que se ajusta automáticamente a las necesidades del sistema.</p><h3>Ventajas:</h3><ul><li>Ahorro energético hasta 80%</li><li>Control automático</li><li>Funcionamiento silencioso</li><li>Fácil instalación</li></ul>', false, false, 'Bomba Grundfos Alpha2 | Máxima Eficiencia', 'Bomba de circulación Grundfos con control automático y alta eficiencia', NOW(), NOW()),
    
    (prod_kit_agua, 'kit-suelo-radiante-agua-100m2', 'Kit Suelo Radiante Agua 100m²', 'Kit completo para instalación de suelo radiante por agua caliente', '<h2>Kit Completo 100m²</h2><p>Todo lo necesario para instalar un sistema de suelo radiante por agua en una superficie de hasta 100m².</p><h3>Incluye:</h3><ul><li>Tubería PEX 16mm (1000m)</li><li>Colector 8 salidas</li><li>Aislamiento térmico</li><li>Grapas de fijación</li><li>Manual de instalación</li></ul>', false, true, 'Kit Suelo Radiante Agua 100m² | Completo', 'Kit completo para instalación de suelo radiante por agua hasta 100m²', NOW(), NOW()),
    
    (prod_termostato_basico, 'termostato-analogico-basico', 'Termostato Analógico Básico', 'Termostato de control manual para sistemas básicos', '<h2>Control Básico</h2><p>Termostato analógico sencillo y fiable para control manual de temperatura.</p><h3>Características:</h3><ul><li>Control manual</li><li>Rango: 5-30°C</li><li>Montaje empotrado</li><li>Muy económico</li></ul>', false, false, 'Termostato Analógico Básico | Económico', 'Termostato analógico básico para control manual de temperatura', NOW(), NOW());

    -- Insertar relaciones producto-categoría
    INSERT INTO product_categories (product_id, category_id) VALUES
    (prod_suelo_electrico, cat_suelos),
    (prod_suelo_electrico, cat_electricos),
    (prod_termostato_wifi, cat_termostatos),
    (prod_caldera_25kw, cat_calderas),
    (prod_bomba_grundfos, cat_accesorios),
    (prod_kit_agua, cat_suelos),
    (prod_kit_agua, cat_agua),
    (prod_termostato_basico, cat_termostatos);

    -- Insertar variantes de productos
    INSERT INTO product_variants (id, product_id, sku, title, price_public_cents, stock, weight_grams, dimensions, created_at, updated_at) VALUES
    -- Suelo radiante eléctrico - diferentes potencias
    (var_suelo_150w, prod_suelo_electrico, 'SRE-150W-10M2', '150W - 10m²', 89000, 15, 5000, '{"area_m2": 10, "potencia_w": 150}', NOW(), NOW()),
    (var_suelo_300w, prod_suelo_electrico, 'SRE-300W-20M2', '300W - 20m²', 165000, 12, 8000, '{"area_m2": 20, "potencia_w": 300}', NOW(), NOW()),
    (var_suelo_450w, prod_suelo_electrico, 'SRE-450W-30M2', '450W - 30m²', 235000, 8, 12000, '{"area_m2": 30, "potencia_w": 450}', NOW(), NOW()),
    
    -- Termostato WiFi - diferentes colores
    (var_termo_blanco, prod_termostato_wifi, 'TERM-WIFI-BLANCO', 'Blanco', 12500, 25, 200, '{"color": "blanco", "ancho_mm": 86, "alto_mm": 86}', NOW(), NOW()),
    (var_termo_negro, prod_termostato_wifi, 'TERM-WIFI-NEGRO', 'Negro', 12500, 18, 200, '{"color": "negro", "ancho_mm": 86, "alto_mm": 86}', NOW(), NOW()),
    
    -- Caldera
    (var_caldera_std, prod_caldera_25kw, 'CALD-COND-25KW', 'Modelo Estándar', 185000, 5, 35000, '{"potencia_kw": 25, "alto_mm": 720, "ancho_mm": 440, "fondo_mm": 338}', NOW(), NOW()),
    
    -- Bomba Grundfos
    (var_bomba_25_40, prod_bomba_grundfos, 'GRUND-ALPHA2-25-40', '25-40 (1/2")', 28500, 20, 2200, '{"conexion": "1/2", "altura_mm": 180}', NOW(), NOW()),
    (var_bomba_25_60, prod_bomba_grundfos, 'GRUND-ALPHA2-25-60', '25-60 (1/2")', 32500, 15, 2200, '{"conexion": "1/2", "altura_mm": 180}', NOW(), NOW()),
    
    -- Kit suelo radiante agua
    (var_kit_100m2, prod_kit_agua, 'KIT-AGUA-100M2', 'Kit 100m²', 145000, 8, 50000, '{"area_m2": 100, "tuberia_m": 1000}', NOW(), NOW()),
    
    -- Termostato analógico
    (var_termo_basic, prod_termostato_basico, 'TERM-ANALOG-BASIC', 'Modelo Básico', 2500, 50, 150, '{"tipo": "analogico", "rango_temp": "5-30"}', NOW(), NOW());

    -- Insertar precios especiales por rol
    INSERT INTO role_prices (id, variant_id, role_id, price_cents) VALUES
    -- Precios para instaladores (role_id = 3) - 20% descuento
    (gen_random_uuid(), var_suelo_150w, 3, 71200),
    (gen_random_uuid(), var_suelo_300w, 3, 132000),
    (gen_random_uuid(), var_suelo_450w, 3, 188000),
    (gen_random_uuid(), var_termo_blanco, 3, 10000),
    (gen_random_uuid(), var_termo_negro, 3, 10000),
    (gen_random_uuid(), var_caldera_std, 3, 148000),
    (gen_random_uuid(), var_bomba_25_40, 3, 22800),
    (gen_random_uuid(), var_bomba_25_60, 3, 26000),
    (gen_random_uuid(), var_kit_100m2, 3, 116000),
    
    -- Precios para SAT (role_id = 2) - 15% descuento
    (gen_random_uuid(), var_suelo_150w, 2, 75650),
    (gen_random_uuid(), var_suelo_300w, 2, 140250),
    (gen_random_uuid(), var_suelo_450w, 2, 199750),
    (gen_random_uuid(), var_termo_blanco, 2, 10625),
    (gen_random_uuid(), var_termo_negro, 2, 10625),
    (gen_random_uuid(), var_caldera_std, 2, 157250),
    (gen_random_uuid(), var_bomba_25_40, 2, 24225),
    (gen_random_uuid(), var_bomba_25_60, 2, 27625),
    (gen_random_uuid(), var_kit_100m2, 2, 123250);

    -- Insertar imágenes de productos (comentado para pruebas de carga)
    -- INSERT INTO product_images (id, product_id, url, alt, position, created_at) VALUES
    -- Los productos funcionarán sin imágenes para pruebas más rápidas

    -- Insertar recursos/documentación
    INSERT INTO product_resources (id, product_id, type, url, label, created_at) VALUES
    (gen_random_uuid(), prod_suelo_electrico, 'manual', 'https://example.com/manual-suelo-radiante-electrico.pdf', 'Manual de Instalación', NOW()),
    (gen_random_uuid(), prod_suelo_electrico, 'video', 'https://youtube.com/watch?v=example1', 'Video Tutorial de Instalación', NOW()),
    (gen_random_uuid(), prod_suelo_electrico, 'pdf', 'https://example.com/ficha-tecnica-sre.pdf', 'Ficha Técnica', NOW()),
    
    (gen_random_uuid(), prod_termostato_wifi, 'manual', 'https://example.com/manual-termostato-wifi.pdf', 'Manual de Usuario', NOW()),
    (gen_random_uuid(), prod_termostato_wifi, 'pdf', 'https://example.com/app-manual.pdf', 'Guía de la App', NOW()),
    
    (gen_random_uuid(), prod_caldera_25kw, 'manual', 'https://example.com/manual-caldera.pdf', 'Manual de Instalación y Mantenimiento', NOW()),
    (gen_random_uuid(), prod_caldera_25kw, 'pdf', 'https://example.com/certificado-eficiencia.pdf', 'Certificado de Eficiencia Energética', NOW()),
    
    (gen_random_uuid(), prod_bomba_grundfos, 'manual', 'https://example.com/manual-grundfos.pdf', 'Manual Técnico Grundfos', NOW()),
    
    (gen_random_uuid(), prod_kit_agua, 'manual', 'https://example.com/manual-kit-agua.pdf', 'Guía de Instalación Completa', NOW()),
    (gen_random_uuid(), prod_kit_agua, 'pdf', 'https://example.com/calculo-perdidas.pdf', 'Cálculo de Pérdidas Térmicas', NOW());

END $$;

-- 3. Insertar reseñas (requiere un cliente existente)
DO $$
DECLARE
    admin_client_id UUID;
BEGIN
    -- Intentar obtener un cliente existente (admin)
    SELECT id INTO admin_client_id FROM clients WHERE email LIKE '%admin%' OR email LIKE '%test%' LIMIT 1;
    
    -- Si existe un cliente, insertar reseñas de ejemplo
    IF admin_client_id IS NOT NULL THEN
        INSERT INTO product_reviews (id, product_id, client_id, rating, comment, created_at, updated_at)
        SELECT 
            gen_random_uuid(),
            p.id,
            admin_client_id,
            rating_data.rating,
            rating_data.comment,
            NOW() - (rating_data.days_ago || ' days')::INTERVAL,
            NOW() - (rating_data.days_ago || ' days')::INTERVAL
        FROM products p
        CROSS JOIN (
            VALUES 
            ('suelo-radiante-electrico-premium', 5, 'Excelente producto, fácil instalación y muy eficiente. Lo recomiendo totalmente.', 15),
            ('termostato-digital-wifi', 4, 'El termostato funciona muy bien, la app es intuitiva. Solo mejoraría el diseño.', 10),
            ('caldera-condensacion-25kw', 5, 'Caldera de gran calidad, muy silenciosa y eficiente. Perfecta para mi casa.', 30),
            ('kit-suelo-radiante-agua-100m2', 5, 'Kit muy completo, incluye todo lo necesario. Instalación sencilla siguiendo el manual.', 5)
        ) AS rating_data(product_slug, rating, comment, days_ago)
        WHERE p.slug = rating_data.product_slug;
        
        -- Crear un carrito de ejemplo
        INSERT INTO carts (id, client_id, currency, created_at, updated_at) 
        VALUES (gen_random_uuid(), admin_client_id, 'EUR', NOW(), NOW());
        
        -- Añadir algunos items al carrito
        INSERT INTO cart_items (id, cart_id, variant_id, qty, price_at_addition_cents, added_at)
        SELECT 
            gen_random_uuid(),
            c.id,
            pv.id,
            item_data.qty,
            item_data.price,
            NOW()
        FROM carts c
        CROSS JOIN products p
        CROSS JOIN product_variants pv
        CROSS JOIN (
            VALUES 
            ('SRE-150W-10M2', 2, 89000),
            ('TERM-WIFI-BLANCO', 1, 12500)
        ) AS item_data(sku, qty, price)
        WHERE c.client_id = admin_client_id 
        AND pv.product_id = p.id 
        AND pv.sku = item_data.sku
        LIMIT 2;
        
        RAISE NOTICE 'Reseñas y carrito creados para cliente: %', admin_client_id;
    ELSE
        RAISE NOTICE 'No se encontró ningún cliente para crear reseñas de ejemplo';
    END IF;
END $$;

-- Verificar que los datos se insertaron correctamente
-- Verificar que los datos se insertaron correctamente
SELECT 'Roles insertados: ' || COUNT(*) FROM customer_roles;
SELECT 'Categorías insertadas: ' || COUNT(*) FROM categories;
SELECT 'Productos insertados: ' || COUNT(*) FROM products;
SELECT 'Variantes insertadas: ' || COUNT(*) FROM product_variants;
SELECT 'Precios especiales: ' || COUNT(*) FROM role_prices;
SELECT 'Imágenes insertadas: ' || COUNT(*) FROM product_images;
SELECT 'Recursos insertados: ' || COUNT(*) FROM product_resources;
SELECT 'Reseñas insertadas: ' || COUNT(*) FROM product_reviews;
SELECT 'Carritos creados: ' || COUNT(*) FROM carts;
SELECT 'Items en carrito: ' || COUNT(*) FROM cart_items;