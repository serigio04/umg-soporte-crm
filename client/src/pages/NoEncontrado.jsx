import { useNavigate } from 'react-router-dom'

export default function NoEncontrado() {
  const navigate = useNavigate()

  return (
    <main className="crm-page" style={styles.page} id="contenido-principal">
      <section style={styles.card} aria-labelledby="not-found-title">
        <p style={styles.code}>404</p>
        <h1 id="not-found-title" style={styles.title}>Página no encontrada</h1>
        <p style={styles.text}>La dirección no existe o ya no está disponible.</p>
        <button className="touch-target" style={styles.button} onClick={() => navigate('/')}>
          Volver al inicio
        </button>
      </section>
    </main>
  )
}

const styles = {
  page: { display: 'grid', placeItems: 'center', padding: '20px' },
  card: { width: '100%', maxWidth: '440px', padding: '2rem', borderRadius: '12px', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center' },
  code: { color: '#6c3483', fontSize: '14px', fontWeight: '700' },
  title: { color: '#1a1a2e', fontSize: '22px' },
  text: { color: '#555', fontSize: '14px', marginBottom: '1.5rem' },
  button: { padding: '10px 20px', border: 0, borderRadius: '8px', color: '#fff', background: '#1a1a2e', cursor: 'pointer' },
}
