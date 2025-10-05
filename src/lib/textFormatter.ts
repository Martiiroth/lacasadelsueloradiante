/**
 * Utilidades para formatear texto de productos
 */

/**
 * Convierte texto plano en HTML con formato básico
 * - Detecta títulos (líneas en negrita)
 * - Convierte saltos de línea en párrafos
 * - Convierte listas con viñetas
 */
export function formatProductDescription(text: string): string {
  if (!text) return ''
  
  // Si ya tiene tags HTML, devolverlo tal cual
  if (text.includes('<p>') || text.includes('<div>')) {
    return text
  }
  
  let formatted = text
  
  // Convertir líneas vacías múltiples en una sola
  formatted = formatted.replace(/\n\s*\n\s*\n/g, '\n\n')
  
  // Dividir en líneas
  const lines = formatted.split('\n')
  const result: string[] = []
  let inList = false
  let currentParagraph: string[] = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Línea vacía - cerrar párrafo actual
    if (!line) {
      if (currentParagraph.length > 0) {
        result.push(`<p>${currentParagraph.join(' ')}</p>`)
        currentParagraph = []
      }
      if (inList) {
        result.push('</ul>')
        inList = false
      }
      continue
    }
    
    // Detectar títulos (texto seguido de dos puntos al final)
    if (line.endsWith(':') && line.length < 100) {
      if (currentParagraph.length > 0) {
        result.push(`<p>${currentParagraph.join(' ')}</p>`)
        currentParagraph = []
      }
      if (inList) {
        result.push('</ul>')
        inList = false
      }
      result.push(`<h3>${line}</h3>`)
      continue
    }
    
    // Detectar listas (comienzan con -, •, *, o números)
    const listMatch = line.match(/^[•\-\*]\s+(.+)$/) || line.match(/^\d+\.\s+(.+)$/)
    if (listMatch) {
      if (currentParagraph.length > 0) {
        result.push(`<p>${currentParagraph.join(' ')}</p>`)
        currentParagraph = []
      }
      if (!inList) {
        result.push('<ul>')
        inList = true
      }
      result.push(`<li>${listMatch[1]}</li>`)
      continue
    }
    
    // Detectar texto en negrita (**texto** o __texto__)
    const boldText = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                         .replace(/__(.+?)__/g, '<strong>$1</strong>')
    
    // Línea normal - añadir al párrafo actual
    currentParagraph.push(boldText)
  }
  
  // Cerrar elementos pendientes
  if (inList) {
    result.push('</ul>')
  }
  if (currentParagraph.length > 0) {
    result.push(`<p>${currentParagraph.join(' ')}</p>`)
  }
  
  return result.join('\n')
}

/**
 * Convierte caracteres especiales en entidades HTML
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

/**
 * Procesa la descripción del producto para mostrar
 * Aplica formateo automático si es texto plano
 */
export function processProductDescription(description: string | null | undefined): string {
  if (!description) return ''
  
  // Si ya tiene HTML, devolverlo
  if (description.includes('<')) {
    return description
  }
  
  // Si es texto plano, aplicar formato
  return formatProductDescription(description)
}
