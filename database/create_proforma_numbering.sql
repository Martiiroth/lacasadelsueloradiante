-- Numeración de proformas: PR-00001, PR-00002, ...
-- Cada pedido tiene un único número de proforma (reutilizado si se regenera el PDF).

-- Contador global de proformas (prefijo PR-, número secuencial)
CREATE TABLE IF NOT EXISTS proforma_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prefix TEXT DEFAULT 'PR-',
  suffix TEXT DEFAULT '',
  next_number INTEGER NOT NULL DEFAULT 1
);

-- Asignación número de proforma por pedido (un número por order_id)
CREATE TABLE IF NOT EXISTS order_proforma_numbers (
  order_id UUID PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
  proforma_number INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_proforma_numbers_proforma_number ON order_proforma_numbers(proforma_number);

COMMENT ON TABLE proforma_counters IS 'Contador para numeración de proformas (PR-00001, PR-00002...)';
COMMENT ON TABLE order_proforma_numbers IS 'Número de proforma asignado a cada pedido (estable al regenerar PDF)';

-- RLS
ALTER TABLE proforma_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_proforma_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage proforma_counters"
  ON proforma_counters FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage order_proforma_numbers"
  ON order_proforma_numbers FOR ALL USING (auth.role() = 'service_role');

-- Una sola fila en proforma_counters (insertar si no existe)
INSERT INTO proforma_counters (id, prefix, suffix, next_number)
SELECT gen_random_uuid(), 'PR-', '', 1
WHERE NOT EXISTS (SELECT 1 FROM proforma_counters LIMIT 1);

-- Función: devuelve el número de proforma para un pedido (asigna uno nuevo si es la primera vez)
CREATE OR REPLACE FUNCTION get_or_assign_proforma_number(p_order_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_num INTEGER;
  v_counter_id UUID;
  v_next INTEGER;
BEGIN
  -- Si ya tiene número asignado, devolverlo
  SELECT proforma_number INTO v_num
  FROM order_proforma_numbers
  WHERE order_id = p_order_id;
  IF FOUND THEN
    RETURN v_num;
  END IF;

  -- Obtener contador (una sola fila)
  SELECT id, next_number INTO v_counter_id, v_next
  FROM proforma_counters
  LIMIT 1
  FOR UPDATE;

  IF v_counter_id IS NULL THEN
    INSERT INTO proforma_counters (prefix, suffix, next_number)
    VALUES ('PR-', '', 1)
    RETURNING id, next_number INTO v_counter_id, v_next;
  END IF;

  -- Asignar este número al pedido
  INSERT INTO order_proforma_numbers (order_id, proforma_number)
  VALUES (p_order_id, v_next);

  -- Incrementar contador
  UPDATE proforma_counters
  SET next_number = next_number + 1
  WHERE id = v_counter_id;

  RETURN v_next;
END;
$$;

COMMENT ON FUNCTION get_or_assign_proforma_number(UUID) IS 'Devuelve el número de proforma para un pedido; asigna uno nuevo si es la primera vez que se genera la proforma.';

-- Permitir ejecución desde API (anon/authenticated/service_role)
GRANT EXECUTE ON FUNCTION get_or_assign_proforma_number(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_or_assign_proforma_number(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_assign_proforma_number(UUID) TO service_role;
