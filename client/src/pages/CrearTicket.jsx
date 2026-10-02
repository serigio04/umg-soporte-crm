import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const TIPOLOGIAS = ['Incidente', 'Solicitud', 'Cambio']

const PRIORIDAD_INFO = {
  Incidente: { label: 'Alta', color: '#e74c3c', horas: 4 },
  Solicitud: { label: 'Media', color: '#e67e22', horas: 24 },
  Cambio:    { label: 'Baja', color: '#27ae60', horas: 48 }
}

export default function CrearTicket() {
  const [tipologia, setTipologia] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [carnetEstudiante, setCarnetEstudiante] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [esAgente, setEsAgente] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
    setEsAgente(usuario.rol === 'Agente' || usuario.rol === 'Coordinador')
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!tipologia) return setError('Selecciona una tipología')
    if (descripcion.trim().length < 10)
      return setError('La descripción debe tener al menos 10 caracteres')
    if (esAgente && !carnetEstudiante)
      return setError('Debes ingresar el carnet del estudiante')

    setLoading(true)
    try {
      await api.post('/tickets', { 
        tipologiaITIL: tipologia, 
        descripcion,
        ...(esAgente && { carnetEstudiante: parseInt(carnetEstudiante) })
      })
      navigate(-1)
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear el ticket')
    } finally {
      setLoading(false)
    }
  }

  const info = PRIORIDAD_INFO[tipologia]

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          ← Volver
        </button>
        <span style={styles.headerTitle}>Crear ticket</span>
        <span />
      </div>

      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.title}>Nueva solicitud de soporte</h2>
          <p style={styles.subtitle}>
            Completa el formulario y un agente te atenderá según la prioridad asignada.
          </p>

          <form onSubmit={handleSubmit}>
            {esAgente && (
              <div style={styles.field}>
                <label style={styles.label}>Carnet del estudiante *</label>
                <input
                  type="number"
                  style={styles.input}
                  value={carnetEstudiante}
                  onChange={e => setCarnetEstudiante(e.target.value)}
                  placeholder="Ej: 1"
                  required
                />
              </div>
            )}

            <div style={styles.field}>
              <label style={styles.label}>Tipo de solicitud *</label>
              <div style={styles.tipologias}>
                {TIPOLOGIAS.map(t => (
                  <button
                    key={t}
                    type="button"
                    style={{
                      ...styles.tipBtn,
                      ...(tipologia === t ? styles.tipBtnActive : {})
                    }}
                    onClick={() => setTipologia(t)}
                  >
                    {t === 'Incidente' && '🚨 '}
                    {t === 'Solicitud' && '📋 '}
                    {t === 'Cambio'    && '🔄 '}
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {info && (
              <div style={{ ...styles.prioridadBox, borderColor: info.color }}>
                <span style={{ fontSize: 13, color: '#555' }}>
                  Prioridad asignada automáticamente:
                </span>
                <span style={{ ...styles.badge, background: info.color }}>
                  {info.label} — {info.horas}h límite
                </span>
              </div>
            )}

            <div style={styles.field}>
              <label style={styles.label}>Descripción del problema *</label>
              <textarea
                style={styles.textarea}
                rows={5}
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="Describe tu problema con el mayor detalle posible..."
                required
              />
              <span style={styles.charCount}>{descripcion.length} caracteres</span>
            </div>

            {error && <p style={styles.error}>{error}</p>}

            <button
              type="submit"
              style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
              disabled={loading}
            >
              {loading ? 'Enviando...' : '🎫 Crear ticket'}
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
  container: { maxWidth: '600px', margin: '2rem auto', padding: '0 1rem' },
  card: { background: '#fff', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  title: { fontSize: '18px', fontWeight: '600', color: '#1a1a2e', marginBottom: '6px' },
  subtitle: { fontSize: '13px', color: '#888', marginBottom: '1.5rem' },
  field: { marginBottom: '1.25rem' },
  label: { display: 'block', fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '8px' },
  input: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' },
  tipologias: { display: 'flex', gap: '10px' },
  tipBtn: { flex: 1, padding: '10px', border: '1.5px solid #ddd', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontSize: '13px', color: '#555', transition: 'all .15s' },
  tipBtnActive: { borderColor: '#1a1a2e', background: '#1a1a2e', color: '#fff' },
  prioridadBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid', marginBottom: '1.25rem', background: '#fafafa' },
  badge: { fontSize: '12px', padding: '3px 10px', borderRadius: '20px', color: '#fff', fontWeight: '500' },
  textarea: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'sans-serif' },
  charCount: { fontSize: '11px', color: '#aaa', float: 'right', marginTop: '4px' },
  error: { color: '#c0392b', fontSize: '13px', marginBottom: '1rem' },
  submitBtn: { width: '100%', padding: '12px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: '500' }
}