import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function EncuestaTicket() {
  const { idTicket } = useParams()
  const [calificacion, setCalificacion] = useState(0)
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [loading, setLoading] = useState(true)
  const [idEncuesta, setIdEncuesta] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.get(`/encuestas/ticket/${idTicket}`)
      .then(r => {
        setIdEncuesta(r.data.idencuesta)
        setLoading(false)
      })
      .catch(() => {
        alert('Encuesta no encontrada')
        navigate(-1)
      })
  }, [idTicket, navigate])

  const handleEnviar = async (e) => {
    e.preventDefault()
    if (calificacion === 0) {
      alert('Selecciona una calificación')
      return
    }

    setEnviando(true)
    try {
      await api.post(`/encuestas/${idEncuesta}/responder`, {
        calificacion,
        comentario
      })
      alert('¡Gracias por tu respuesta!')
      navigate('/estudiante/tickets')
    } catch (err) {
      alert(err.response?.data?.message || 'Error al enviar encuesta')
    } finally {
      setEnviando(false)
    }
  }

  if (loading) return <p style={styles.loading}>Cargando...</p>

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>← Volver</button>
        <span style={styles.headerTitle}>Encuesta de satisfacción</span>
        <span />
      </div>

      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.title}>¿Cómo fue tu experiencia?</h2>
          <p style={styles.subtitle}>Tu opinión nos ayuda a mejorar nuestro servicio</p>

          <form onSubmit={handleEnviar}>
            <div style={styles.field}>
              <label style={styles.label}>Calificación</label>
              <div style={styles.stars}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCalificacion(n)}
                    style={{
                      ...styles.star,
                      background: calificacion >= n ? '#f39c12' : '#f0f0f0',
                      color: calificacion >= n ? '#fff' : '#ccc'
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Comentario (opcional)</label>
              <textarea
                style={styles.textarea}
                rows={4}
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                placeholder="Cuéntanos tu experiencia..."
              />
            </div>

            <button
              type="submit"
              disabled={enviando || calificacion === 0}
              style={{
                ...styles.submitBtn,
                opacity: enviando || calificacion === 0 ? 0.7 : 1,
                cursor: enviando || calificacion === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              {enviando ? 'Enviando...' : 'Enviar encuesta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: '#f4f4f4', fontFamily: 'sans-serif' },
  header: { background: '#1a1a2e', color: '#fff', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontWeight: '500', fontSize: '15px' },
  backBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
  container: { maxWidth: '500px', margin: '2rem auto', padding: '0 1rem' },
  card: { background: '#fff', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  title: { fontSize: '18px', fontWeight: '600', color: '#1a1a2e', marginBottom: '6px' },
  subtitle: { fontSize: '13px', color: '#888', marginBottom: '1.5rem' },
  field: { marginBottom: '1.5rem' },
  label: { display: 'block', fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '10px' },
  stars: { display: 'flex', gap: '12px', justifyContent: 'center' },
  star: { width: '50px', height: '50px', fontSize: '28px', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' },
  textarea: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', fontFamily: 'sans-serif', boxSizing: 'border-box' },
  submitBtn: { width: '100%', padding: '12px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500' },
  loading: { padding: '2rem', textAlign: 'center', color: '#888' }
}