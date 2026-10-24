import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import FeedbackMessage from '../components/atoms/FeedbackMessage'
import FormField from '../components/molecules/FormField'

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
  const [rol] = useState(() => {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
    return usuario.rol
  })
  const esEquipoSoporte = rol === 'Agente' || rol === 'Coordinador'
  const [ticketCreado, setTicketCreado] = useState(null)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!tipologia) return setError('Selecciona una tipología')
    if (descripcion.trim().length < 10)
      return setError('La descripción debe tener al menos 10 caracteres')
    if (esEquipoSoporte && !carnetEstudiante)
      return setError('Debes ingresar el carnet del estudiante')

    setLoading(true)
    try {
      const { data } = await api.post('/tickets', {
        tipologiaITIL: tipologia, 
        descripcion,
        ...(esEquipoSoporte && { carnetEstudiante: carnetEstudiante.trim() })
      })
      setTicketCreado(data.ticket)
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear el ticket')
    } finally {
      setLoading(false)
    }
  }

  const info = PRIORIDAD_INFO[tipologia]

  return (
    <div className="crm-page" style={styles.page}>
      <header className="crm-header" style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          ← Volver
        </button>
        <span style={styles.headerTitle}>Crear ticket</span>
        <span />
      </header>

      <main id="contenido-principal" className="crm-form-container" style={styles.container}>
        <section className="crm-form-card" style={styles.card} aria-labelledby="crear-ticket-title">
          <h1 id="crear-ticket-title" style={styles.title}>Nueva solicitud de soporte</h1>
          <p style={styles.subtitle}>
            Completa el formulario y un agente te atenderá según la prioridad asignada.
          </p>

          {ticketCreado ? (
            <div>
              <FeedbackMessage type="success">
                Ticket #{ticketCreado.idTicket} creado correctamente.
              </FeedbackMessage>
              <p style={styles.confirmationText}>
                Prioridad {ticketCreado.prioridadSLA}. {ticketCreado.idAgente ? 'El ticket fue asignado automáticamente.' : 'No hay un agente compatible disponible; coordinación podrá asignarlo.'}
              </p>
              <div className="crm-actions">
                <button className="touch-target" style={styles.submitBtn} onClick={() => navigate(`/tickets/${ticketCreado.idTicket}`)}>
                  Ver ticket
                </button>
                <button className="touch-target" style={styles.secondaryBtn} onClick={() => navigate(rol === 'Coordinador' ? '/coordinador/tickets' : rol === 'Agente' ? '/agente/tickets' : '/estudiante/tickets')}>
                  Ir al historial
                </button>
              </div>
            </div>
          ) : <form onSubmit={handleSubmit} aria-busy={loading}>
            {esEquipoSoporte && (
              <FormField id="carne-estudiante" label="Carné del estudiante" help="Usa el formato 9989-XX-XXXXX, por ejemplo 9989-23-11046." required>
                <input
                  id="carne-estudiante"
                  type="text"
                  inputMode="text"
                  className="form-control"
                  value={carnetEstudiante}
                  onChange={e => setCarnetEstudiante(e.target.value)}
                  placeholder="9989-23-11046"
                  pattern="9989-[0-9]{2}-[0-9]{5}"
                  aria-describedby="carne-estudiante-help"
                  required
                />
              </FormField>
            )}

            <fieldset style={styles.fieldset}>
              <legend style={styles.label}>Tipo de solicitud *</legend>
              <div className="crm-choice-group" style={styles.tipologias}>
                {TIPOLOGIAS.map(t => (
                  <button
                    key={t}
                    type="button"
                    style={{
                      ...styles.tipBtn,
                      ...(tipologia === t ? styles.tipBtnActive : {})
                    }}
                    onClick={() => setTipologia(t)}
                    aria-pressed={tipologia === t}
                  >
                    {t === 'Incidente' && '🚨 '}
                    {t === 'Solicitud' && '📋 '}
                    {t === 'Cambio'    && '🔄 '}
                    {t}
                  </button>
                ))}
              </div>
            </fieldset>

            {info && (
              <div className="crm-priority-summary" style={{ ...styles.prioridadBox, borderColor: info.color }} role="status">
                <span style={{ fontSize: 13, color: '#555' }}>
                  Prioridad asignada automáticamente:
                </span>
                <span style={{ ...styles.badge, background: info.color }}>
                  {info.label} — {info.horas}h límite
                </span>
              </div>
            )}

            <FormField id="descripcion" label="Descripción del problema" help="Incluye qué intentabas hacer, qué ocurrió y cualquier mensaje mostrado. Mínimo 10 caracteres." required>
              <textarea
                id="descripcion"
                className="form-control"
                rows={5}
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="Describe tu problema con el mayor detalle posible..."
                minLength={10}
                aria-describedby="descripcion-help descripcion-count"
                required
              />
              <span id="descripcion-count" style={styles.charCount}>{descripcion.length} caracteres</span>
            </FormField>

            <FeedbackMessage>{error}</FeedbackMessage>

            <button
              type="submit"
              className="touch-target"
              style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
              disabled={loading}
            >
              {loading ? 'Enviando...' : '🎫 Crear ticket'}
            </button>
          </form>}
        </section>
      </main>
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
  fieldset: { border: 0, padding: 0, margin: '0 0 1.25rem' },
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
  ,secondaryBtn: { width: '100%', padding: '12px', background: '#fff', color: '#1a1a2e', border: '1px solid #1a1a2e', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: '500' },
  confirmationText: { color: '#555', fontSize: '14px', lineHeight: 1.5, margin: '1rem 0' },
}
