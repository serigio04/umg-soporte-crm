import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import FeedbackMessage from '../components/atoms/FeedbackMessage'
import TicketChat from '../components/organisms/TicketChat'
import api from '../services/api'

const TRANSICIONES = {
  Abierto: ['EnProceso'],
  EnProceso: ['Pendiente'],
  Pendiente: ['Resuelto'],
  Resuelto: [],
  Cerrado: [],
}

const PRIORIDADES = ['Alta', 'Media', 'Baja']

const COLOR_ESTADO = {
  Abierto: '#dc2626',
  EnProceso: '#d97706',
  Pendiente: '#a16207',
  Resuelto: '#0f766e',
  Cerrado: '#2563eb',
}

const COLOR_PRIORIDAD = {
  Alta: '#dc2626',
  Media: '#d97706',
  Baja: '#15803d',
}

function leerUsuario() {
  try {
    const valor = localStorage.getItem('usuario')
    return valor ? JSON.parse(valor) : null
  } catch {
    return null
  }
}

export default function DetalleTicket() {
  const { idTicket } = useParams()
  const navigate = useNavigate()
  const usuario = leerUsuario()
  const [ticket, setTicket] = useState(null)
  const [candidatos, setCandidatos] = useState([])
  const [nuevoEstado, setNuevoEstado] = useState('')
  const [comentario, setComentario] = useState('')
  const [prioridad, setPrioridad] = useState('')
  const [idAgente, setIdAgente] = useState('')
  const [loading, setLoading] = useState(true)
  const [accion, setAccion] = useState('')
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  const esEquipoSoporte = usuario?.rol === 'Agente' || usuario?.rol === 'Coordinador'
  const puedeEditar = ticket && !['Resuelto', 'Cerrado'].includes(ticket.estado) && esEquipoSoporte
  const esEstudiante = usuario?.rol === 'Estudiante'

  async function cargarTicket(mostrarCarga = false) {
    if (mostrarCarga) setLoading(true)
    try {
      const { data } = await api.get(`/tickets/${idTicket}`)
      setTicket(data)
      setNuevoEstado(data.estado)
      setPrioridad(data.prioridadSLA)
      setIdAgente(String(data.idAgente ?? ''))

      if (data.estado !== 'Cerrado' && esEquipoSoporte) {
        try {
          const respuesta = await api.get(`/tickets/${idTicket}/candidatos`)
          setCandidatos(respuesta.data)
        } catch (err) {
          setError(err.response?.data?.message || 'No se pudieron cargar los agentes compatibles')
        }
      } else {
        setCandidatos([])
      }
      return data
    } catch (err) {
      if (mostrarCarga) setTicket(null)
      else setError(err.response?.data?.message || 'No se pudo actualizar el ticket')
      return null
    } finally {
      if (mostrarCarga) setLoading(false)
    }
  }

  useEffect(() => {
    let activo = true

    api.get(`/tickets/${idTicket}`)
      .then(({ data }) => {
        if (!activo) return
        setTicket(data)
        setNuevoEstado(data.estado)
        setPrioridad(data.prioridadSLA)
        setIdAgente(String(data.idAgente ?? ''))
        if (data.estado !== 'Cerrado' && esEquipoSoporte) {
          api.get(`/tickets/${idTicket}/candidatos`)
            .then(respuesta => {
              if (activo) setCandidatos(respuesta.data)
            })
            .catch(err => {
              if (activo) setError(err.response?.data?.message || 'No se pudieron cargar los agentes compatibles')
            })
        }
      })
      .catch(() => {
        if (activo) setTicket(null)
      })
      .finally(() => {
        if (activo) setLoading(false)
      })

    return () => { activo = false }
  }, [idTicket, esEquipoSoporte])

  async function handleCambiarEstado(event) {
    event.preventDefault()
    if (nuevoEstado === ticket.estado) return
    setError('')
    setExito('')
    setAccion('estado')
    try {
      await api.put(`/tickets/${idTicket}/estado`, { nuevoEstado, comentario })
      await cargarTicket()
      setComentario('')
      setExito('Estado actualizado correctamente.')
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cambiar estado')
    } finally {
      setAccion('')
    }
  }

  async function handleCambiarPrioridad(event) {
    event.preventDefault()
    if (prioridad === ticket.prioridadSLA) return
    setError('')
    setExito('')
    setAccion('prioridad')
    try {
      await api.put(`/tickets/${idTicket}/prioridad`, { prioridadSLA: prioridad })
      await cargarTicket()
      setExito('Prioridad y plazo SLA actualizados.')
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cambiar la prioridad')
    } finally {
      setAccion('')
    }
  }

  async function handleReasignar(event) {
    event.preventDefault()
    const nuevoIdAgente = Number(idAgente)
    if (!nuevoIdAgente || nuevoIdAgente === Number(ticket.idAgente)) return
    setError('')
    setExito('')
    setAccion('asignacion')
    try {
      await api.put(`/tickets/${idTicket}/asignacion`, { idAgente: nuevoIdAgente })
      if (usuario?.rol === 'Agente') {
        navigate(-1)
        return
      }
      await cargarTicket()
      setExito('Ticket reasignado correctamente.')
    } catch (err) {
      setError(err.response?.data?.message || 'Error al reasignar el ticket')
    } finally {
      setAccion('')
    }
  }

  async function handleAceptarResolucion() {
    setError('')
    setAccion('aceptar')
    try {
      await api.put(`/tickets/${idTicket}/aceptar`)
      navigate(`/encuesta/ticket/${idTicket}`, { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cerrar el ticket')
      setAccion('')
    }
  }

  async function handleEscalar() {
    if (!window.confirm('¿Estás seguro de escalar este ticket al coordinador?')) return
    setError('')
    setAccion('escalar')
    try {
      await api.put(`/tickets/${idTicket}/escalar`)
      navigate(-1)
    } catch (err) {
      setError(err.response?.data?.message || 'Error al escalar ticket')
      setAccion('')
    }
  }

  if (loading) return <p className="ticket-page-status">Cargando ticket...</p>
  if (!ticket) return <p className="ticket-page-status">Ticket no encontrado o sin acceso.</p>

  const agenteActual = candidatos.find(candidato => Number(candidato.idAgente) === Number(ticket.idAgente))
  const nombreAgente = ticket.nombreAgente || agenteActual?.nombreCompleto || 'Sin asignar'
  const fechaLimite = ticket.fechaLimiteSLA ? new Date(ticket.fechaLimiteSLA).toLocaleString('es-GT') : 'No disponible'

  return (
    <div className="crm-page ticket-detail-page">
      <header className="crm-header ticket-detail-header">
        <button className="ticket-back-button" onClick={() => navigate(-1)}>Volver</button>
        <div>
          <span className="ticket-header-eyebrow">Mesa de soporte</span>
          <strong>Ticket #{ticket.idTicket}</strong>
        </div>
        <span className="ticket-status-badge" style={{ background: COLOR_ESTADO[ticket.estado] }}>
          {ticket.estado === 'EnProceso' ? 'En proceso' : ticket.estado}
        </span>
      </header>

      <main id="contenido-principal" className="ticket-detail-layout">
        <div className="ticket-detail-notices">
          <FeedbackMessage>{error}</FeedbackMessage>
          <FeedbackMessage type="success">{exito}</FeedbackMessage>
        </div>

        <section className="ticket-panel ticket-summary" aria-labelledby="detalle-title">
          <div className="ticket-panel-heading">
            <div>
              <p className="ticket-panel-kicker">Solicitud #{ticket.idTicket}</p>
              <h1 id="detalle-title">{ticket.tipologiaITIL}</h1>
            </div>
            {usuario?.rol === 'Agente' && ticket.estado !== 'Cerrado' && ticket.estado !== 'Resuelto' && (
              <button className="ticket-warning-button" onClick={handleEscalar} disabled={Boolean(accion)}>
                {accion === 'escalar' ? 'Escalando...' : 'Escalar al coordinador'}
              </button>
            )}
          </div>

          <p className="ticket-description">{ticket.descripcion}</p>
          <dl className="ticket-facts">
            <InfoItem label="Estudiante" value={ticket.nombreEstudiante || 'Desconocido'} />
            <InfoItem label="Carné" value={ticket.carneEstudiante || 'Desconocido'} />
            <InfoItem label="Agente actual" value={nombreAgente} />
            <InfoItem label="Creado" value={new Date(ticket.fechaCreacion).toLocaleString('es-GT')} />
            <InfoItem label="Límite SLA" value={fechaLimite} />
            <InfoItem
              label="Tiempo SLA"
              value={ticket.vencido ? 'Vencido' : `${ticket.horasRestantes} horas restantes`}
              emphasis={ticket.vencido ? 'danger' : 'success'}
            />
          </dl>
          <div className="ticket-badge-row">
            <span className="ticket-priority-badge" style={{ background: COLOR_PRIORIDAD[ticket.prioridadSLA] }}>
              Prioridad {ticket.prioridadSLA}
            </span>
          </div>
        </section>

        {puedeEditar && (
          <section className="ticket-panel ticket-workflow" aria-labelledby="workflow-title">
            <div className="ticket-panel-heading">
              <div>
                <p className="ticket-panel-kicker">Gestión</p>
                <h2 id="workflow-title">Flujo del ticket</h2>
              </div>
            </div>

            <div className="ticket-workflow-grid">
              <form onSubmit={handleCambiarPrioridad}>
                <label htmlFor="ticket-priority">Prioridad y SLA</label>
                <select id="ticket-priority" value={prioridad} onChange={event => setPrioridad(event.target.value)}>
                  {PRIORIDADES.map(item => <option key={item} value={item}>{item}</option>)}
                </select>
                <button type="submit" disabled={Boolean(accion) || prioridad === ticket.prioridadSLA}>
                  {accion === 'prioridad' ? 'Actualizando...' : 'Actualizar prioridad'}
                </button>
              </form>

              <form onSubmit={handleReasignar}>
                <label htmlFor="ticket-agent">Agente compatible</label>
                <select id="ticket-agent" value={idAgente} onChange={event => setIdAgente(event.target.value)}>
                  {candidatos.length === 0 && <option value="">Sin agentes compatibles</option>}
                  {candidatos.map(candidato => (
                    <option key={candidato.idAgente} value={candidato.idAgente}>
                      {candidato.nombreCompleto} · {candidato.sedeAsignada}
                    </option>
                  ))}
                </select>
                <button type="submit" disabled={Boolean(accion) || !idAgente || Number(idAgente) === Number(ticket.idAgente)}>
                  {accion === 'asignacion' ? 'Reasignando...' : 'Reasignar ticket'}
                </button>
              </form>

              <form className="ticket-state-form" onSubmit={handleCambiarEstado}>
                <label htmlFor="nuevo-estado">Nuevo estado</label>
                <select id="nuevo-estado" value={nuevoEstado} onChange={event => setNuevoEstado(event.target.value)}>
                  <option value={ticket.estado}>
                    {ticket.estado === 'EnProceso' ? 'En proceso (actual)' : `${ticket.estado} (actual)`}
                  </option>
                  {TRANSICIONES[ticket.estado].map(estado => (
                    <option key={estado} value={estado}>{estado === 'EnProceso' ? 'En proceso' : estado}</option>
                  ))}
                </select>
                <label htmlFor="comentario-tecnico">Comentario técnico (opcional)</label>
                <textarea
                  id="comentario-tecnico"
                  rows={3}
                  value={comentario}
                  onChange={event => setComentario(event.target.value)}
                  placeholder="Añade contexto para el historial"
                />
                <button type="submit" disabled={Boolean(accion) || nuevoEstado === ticket.estado}>
                  {accion === 'estado' ? 'Guardando...' : 'Guardar estado'}
                </button>
              </form>
            </div>
          </section>
        )}

        <TicketChat
          idTicket={ticket.idTicket}
          cerrado={ticket.estado === 'Cerrado'}
          usuario={usuario}
          onTicketUpdated={() => cargarTicket()}
        />

        {esEstudiante && ticket.estado === 'Resuelto' && (
          <section className="ticket-panel ticket-resolution" aria-labelledby="aceptar-title">
            <p className="ticket-panel-kicker">Resolución</p>
            <h2 id="aceptar-title">Aceptar solución</h2>
            <blockquote>
              {ticket.historial.slice().reverse().find(item => item.estado === 'Resuelto')?.comentario
                || 'El agente marcó el ticket como resuelto sin añadir un comentario detallado.'}
            </blockquote>
            <p>Si la solución resolvió tu solicitud, cierra el ticket y completa la calificación.</p>
            <button onClick={handleAceptarResolucion} disabled={Boolean(accion)}>
              {accion === 'aceptar' ? 'Cerrando...' : 'Aceptar, cerrar y calificar'}
            </button>
          </section>
        )}

        <section className="ticket-panel ticket-history" aria-labelledby="historial-title">
          <div className="ticket-panel-heading">
            <div>
              <p className="ticket-panel-kicker">Trazabilidad</p>
              <h2 id="historial-title">Historial de cambios</h2>
            </div>
          </div>
          {ticket.historial.length === 0 ? (
            <p className="ticket-history-empty">Sin cambios registrados.</p>
          ) : (
            <ol className="ticket-timeline">
              {ticket.historial.map((item, index) => (
                <li key={`${item.fecha}-${index}`}>
                  <span className="ticket-timeline-dot" style={{ background: COLOR_ESTADO[item.estado] || '#64748b' }} />
                  <div>
                    <strong>{item.estado === 'EnProceso' ? 'En proceso' : item.estado}</strong>
                    <time dateTime={item.fecha}>{new Date(item.fecha).toLocaleString('es-GT')}</time>
                    {item.comentario && <p>{item.comentario}</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </main>
    </div>
  )
}

function InfoItem({ label, value, emphasis = '' }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd className={emphasis ? `ticket-text-${emphasis}` : ''}>{value}</dd>
    </div>
  )
}
