import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import CambiarPassword from '../components/CambiarPassword'
import Pagination from '../components/molecules/Pagination'

const PAGE_SIZE = 15

const EXPORTS = {
  csv: {
    endpoint: '/metricas/reporte-csv',
    filename: 'reporte_tickets.csv',
    label: 'Tickets en CSV'
  },
  excel: {
    endpoint: '/metricas/reporte-excel',
    filename: 'reporte_tickets.xlsx',
    label: 'Tickets en Excel'
  },
  ratings: {
    endpoint: '/metricas/reporte-calificaciones-excel',
    filename: 'reporte_calificaciones_agentes.xlsx',
    label: 'Calificaciones en Excel'
  }
}

function obtenerMetricas() {
  return api.get('/metricas/dashboard').then(response => response.data)
}

function formatearFecha(fecha) {
  return fecha ? new Date(fecha).toLocaleString('es-GT') : 'Aún abierto'
}

export default function DashboardCoordinador() {
  const [metricas, setMetricas] = useState(null)
  const [errorMetricas, setErrorMetricas] = useState('')
  const [actualizando, setActualizando] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [paginaSLA, setPaginaSLA] = useState(1)
  const [slideIndex, setSlideIndex] = useState(0)
  const [exportando, setExportando] = useState('')
  const [exportFeedback, setExportFeedback] = useState(null)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const navigate = useNavigate()

  const slaVencidos = metricas?.slaVencidos || []
  const totalPaginasSLA = Math.max(1, Math.ceil(slaVencidos.length / PAGE_SIZE))
  const paginaActualSLA = Math.min(paginaSLA, totalPaginasSLA)
  const slaPaginados = slaVencidos.slice(
    (paginaActualSLA - 1) * PAGE_SIZE,
    paginaActualSLA * PAGE_SIZE
  )
  const ticketsAbiertos = (metricas?.ticketsAbiertosPorAgente || []).reduce(
    (total, agente) => total + Number(agente.cantidad || 0),
    0
  )
  const satisfaccion = metricas
    ? [
        {
          nombre: 'General (todos los agentes)',
          porcentaje: metricas.calificacionGeneral?.porcentaje_calificacion || 0,
          promedio: metricas.calificacionGeneral?.promedio_calificacion || 0
        },
        ...(metricas.calificacionesPorAgente || []).map(agente => ({
          nombre: agente.agente,
          porcentaje: agente.porcentaje_calificacion || 0,
          promedio: agente.promedio_calificacion || 0
        }))
      ]
    : []
  const currentSlide = satisfaccion[slideIndex] || satisfaccion[0]

  useEffect(() => {
    let activo = true

    const cargar = async () => {
      try {
        const data = await obtenerMetricas()
        if (!activo) return
        setMetricas(data)
        setErrorMetricas('')
        setPaginaSLA(1)
        setSlideIndex(0)
      } catch {
        if (activo) setErrorMetricas('No se pudieron cargar las métricas. Intenta actualizar nuevamente.')
      }
    }

    cargar()
    const intervalId = window.setInterval(cargar, 300000)

    return () => {
      activo = false
      window.clearInterval(intervalId)
    }
  }, [])

  async function actualizarMetricas() {
    setActualizando(true)
    try {
      const data = await obtenerMetricas()
      setMetricas(data)
      setErrorMetricas('')
      setPaginaSLA(1)
      setSlideIndex(0)
    } catch {
      setErrorMetricas('No se pudieron actualizar las métricas. Intenta nuevamente.')
    } finally {
      setActualizando(false)
    }
  }

  function cerrarSesion() {
    localStorage.clear()
    navigate('/login')
  }

  async function descargarReporte(tipo) {
    const reporte = EXPORTS[tipo]
    setExportando(tipo)
    setExportFeedback(null)

    try {
      const response = await api.get(reporte.endpoint, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')

      try {
        link.href = url
        link.download = reporte.filename
        document.body.appendChild(link)
        link.click()
      } finally {
        link.remove()
        window.URL.revokeObjectURL(url)
      }

      setExportFeedback({ type: 'success', message: `${reporte.label} se descargó correctamente.` })
      setExportMenuOpen(false)
    } catch {
      setExportFeedback({ type: 'error', message: `No se pudo descargar ${reporte.label.toLowerCase()}. Intenta nuevamente.` })
    } finally {
      setExportando('')
    }
  }

  function mostrarSatisfaccionAnterior() {
    setSlideIndex(index => (index === 0 ? satisfaccion.length - 1 : index - 1))
  }

  function mostrarSatisfaccionSiguiente() {
    setSlideIndex(index => (index + 1) % satisfaccion.length)
  }

  return (
    <div className="coordinator-dashboard">
      <header className="coordinator-dashboard__header">
        <div>
          <p className="coordinator-dashboard__eyebrow">Sistema de Soporte UMG</p>
          <span className="coordinator-dashboard__brand">Panel de coordinación</span>
        </div>
        <div className="coordinator-dashboard__session-actions">
          <button type="button" onClick={() => setShowPasswordModal(true)}>Cambiar contraseña</button>
          <button type="button" onClick={cerrarSesion}>Cerrar sesión</button>
        </div>
      </header>

      {showPasswordModal && <CambiarPassword onClose={() => setShowPasswordModal(false)} />}

      <main id="contenido-principal" className="coordinator-dashboard__main">
        <section className="coordinator-dashboard__hero" aria-labelledby="coordinator-title">
          <div>
            <p className="coordinator-dashboard__eyebrow">Resumen operativo</p>
            <h1 id="coordinator-title">Métricas de soporte</h1>
            <p>Supervisa la carga del equipo, los tiempos de atención y el cumplimiento de SLA.</p>
          </div>
          <button
            type="button"
            className="coordinator-dashboard__refresh"
            onClick={actualizarMetricas}
            disabled={actualizando}
          >
            {actualizando ? 'Actualizando...' : 'Actualizar métricas'}
          </button>
        </section>

        {errorMetricas && (
          <p className="coordinator-dashboard__feedback coordinator-dashboard__feedback--error" role="alert">
            {errorMetricas}
          </p>
        )}

        <section className="coordinator-dashboard__toolbar" aria-labelledby="acciones-coordinacion">
          <div>
            <h2 id="acciones-coordinacion">Acciones de coordinación</h2>
            <nav className="coordinator-dashboard__nav" aria-label="Acciones de coordinación">
              <Link to="/agente/crear-estudiante">Nuevo estudiante</Link>
              <Link to="/agente/crear-agente">Nuevo agente</Link>
              <Link to="/coordinador/tickets">Todos los tickets</Link>
              <Link to="/coordinador/agentes">Gestionar agentes</Link>
              <Link to="/agente/conocimiento">Base de conocimiento</Link>
            </nav>
          </div>

          <details
            className="coordinator-dashboard__exports"
            open={exportMenuOpen}
            onToggle={event => setExportMenuOpen(event.currentTarget.open)}
          >
            <summary>Exportar reportes</summary>
            <div className="coordinator-dashboard__export-menu" role="group" aria-label="Formatos de exportación">
              {Object.entries(EXPORTS).map(([tipo, reporte]) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => descargarReporte(tipo)}
                  disabled={Boolean(exportando)}
                >
                  {exportando === tipo ? 'Preparando descarga...' : reporte.label}
                </button>
              ))}
            </div>
          </details>
        </section>

        <div className="coordinator-dashboard__feedback-slot" aria-live="polite" aria-atomic="true">
          {exportFeedback && (
            <p className={`coordinator-dashboard__feedback coordinator-dashboard__feedback--${exportFeedback.type}`}>
              {exportFeedback.message}
            </p>
          )}
        </div>

        <section className="coordinator-dashboard__kpis" aria-label="Indicadores principales">
          <article className="coordinator-dashboard__kpi">
            <p>Tickets abiertos</p>
            <strong>{metricas ? ticketsAbiertos : '...'}</strong>
            <span>En todo el equipo</span>
          </article>
          <article className="coordinator-dashboard__kpi">
            <p>Resolución promedio</p>
            <strong>{metricas ? `${Number(metricas.tiempoPromedioResolucionHoras).toFixed(1)} h` : '...'}</strong>
            <span>Hasta resolución o cierre</span>
          </article>
          <article className={`coordinator-dashboard__kpi ${slaVencidos.length ? 'coordinator-dashboard__kpi--warning' : ''}`}>
            <p>SLA incumplidos</p>
            <strong>{metricas ? slaVencidos.length : '...'}</strong>
            <span>{slaVencidos.length ? 'Requieren seguimiento' : 'Sin incidencias registradas'}</span>
          </article>
        </section>

        <section className="coordinator-dashboard__metrics-grid" aria-label="Detalle de métricas">
          <article className="coordinator-dashboard__panel">
            <div className="coordinator-dashboard__panel-heading">
              <div>
                <p className="coordinator-dashboard__eyebrow">Carga operativa</p>
                <h2>Tickets abiertos por agente</h2>
              </div>
            </div>
            {metricas ? (
              <div className="coordinator-dashboard__table-region" tabIndex="0">
                <table>
                  <caption className="visually-hidden">Cantidad de tickets abiertos por agente</caption>
                  <thead><tr><th scope="col">Agente</th><th scope="col">Tickets</th></tr></thead>
                  <tbody>
                    {(metricas.ticketsAbiertosPorAgente || []).map(agente => (
                      <tr key={agente.agente}><td>{agente.agente}</td><td>{agente.cantidad}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="coordinator-dashboard__empty">Cargando métricas...</p>}
          </article>

          <article className="coordinator-dashboard__panel">
            <div className="coordinator-dashboard__panel-heading">
              <div>
                <p className="coordinator-dashboard__eyebrow">Rendimiento</p>
                <h2>Resolución por agente</h2>
              </div>
            </div>
            {metricas ? (
              <div className="coordinator-dashboard__table-region" tabIndex="0">
                <table>
                  <caption className="visually-hidden">Tiempo promedio de resolución por agente</caption>
                  <thead><tr><th scope="col">Agente</th><th scope="col">Promedio</th></tr></thead>
                  <tbody>
                    {(metricas.tiempoPromedioPorAgente || []).map(agente => (
                      <tr key={agente.agente}>
                        <td>{agente.agente}</td>
                        <td>{Number(agente.tiempo_promedio_horas).toFixed(1)} h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="coordinator-dashboard__empty">Cargando métricas...</p>}
          </article>

          <article className="coordinator-dashboard__panel coordinator-dashboard__satisfaction">
            <div className="coordinator-dashboard__panel-heading">
              <div>
                <p className="coordinator-dashboard__eyebrow">Experiencia</p>
                <h2>Nivel de satisfacción</h2>
              </div>
            </div>
            {currentSlide ? (
              <div className="coordinator-dashboard__rating">
                <div
                  className="coordinator-dashboard__rating-ring"
                  style={{ '--rating': `${Number(currentSlide.porcentaje)}%` }}
                  role="img"
                  aria-label={`${Number(currentSlide.porcentaje).toFixed(0)} por ciento de satisfacción`}
                >
                  <span>{Number(currentSlide.porcentaje).toFixed(0)}%</span>
                </div>
                <div className="coordinator-dashboard__rating-copy" aria-live="polite">
                  <strong>{currentSlide.nombre}</strong>
                  <span>Promedio: {Number(currentSlide.promedio).toFixed(1)} de 5</span>
                  <span>{slideIndex + 1} de {satisfaccion.length}</span>
                </div>
                {satisfaccion.length > 1 && (
                  <div className="coordinator-dashboard__rating-controls">
                    <button type="button" onClick={mostrarSatisfaccionAnterior} aria-label="Mostrar satisfacción anterior">Anterior</button>
                    <button type="button" onClick={mostrarSatisfaccionSiguiente} aria-label="Mostrar satisfacción siguiente">Siguiente</button>
                  </div>
                )}
              </div>
            ) : <p className="coordinator-dashboard__empty">No hay encuestas respondidas aún.</p>}
          </article>
        </section>

        <section className="coordinator-dashboard__panel coordinator-dashboard__sla" aria-labelledby="sla-title">
          <div className="coordinator-dashboard__panel-heading">
            <div>
              <p className="coordinator-dashboard__eyebrow">Cumplimiento</p>
              <h2 id="sla-title">Tickets con SLA incumplido</h2>
            </div>
            {metricas && <span className="coordinator-dashboard__count">{slaVencidos.length} tickets</span>}
          </div>

          {!metricas ? (
            <p className="coordinator-dashboard__empty">Cargando métricas...</p>
          ) : slaVencidos.length === 0 ? (
            <p className="coordinator-dashboard__empty coordinator-dashboard__empty--success">No hay tickets vencidos.</p>
          ) : (
            <>
              <div className="coordinator-dashboard__table-region" tabIndex="0">
                <table>
                  <caption className="visually-hidden">Tickets que incumplieron el acuerdo de nivel de servicio</caption>
                  <thead>
                    <tr>
                      <th scope="col">Ticket</th>
                      <th scope="col">Prioridad</th>
                      <th scope="col">Agente asignado</th>
                      <th scope="col">Creación</th>
                      <th scope="col">Resolución</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slaPaginados.map(ticket => (
                      <tr key={ticket.idticket}>
                        <td>#{ticket.idticket}</td>
                        <td><span className={`coordinator-dashboard__priority coordinator-dashboard__priority--${ticket.prioridadsla?.toLowerCase()}`}>{ticket.prioridadsla}</span></td>
                        <td>{ticket.agente || 'Sin asignar'}</td>
                        <td>{formatearFecha(ticket.fechacreacion)}</td>
                        <td>{formatearFecha(ticket.fecharesolucion)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={paginaActualSLA}
                totalItems={slaVencidos.length}
                pageSize={PAGE_SIZE}
                onPageChange={setPaginaSLA}
                ariaLabel="Paginación de tickets con SLA incumplido"
              />
            </>
          )}
        </section>
      </main>
    </div>
  )
}
