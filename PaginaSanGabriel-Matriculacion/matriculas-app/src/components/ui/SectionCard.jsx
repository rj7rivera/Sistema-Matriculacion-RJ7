function SectionCard({ className = '', children }) {
  // Tarjeta reusable para envolver bloques blancos del dashboard y los modulos.
  return <article className={`card ${className}`.trim()}>{children}</article>
}

export default SectionCard