import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import CambiarPassword from '../components/CambiarPassword'
import Pagination from '../components/molecules/Pagination'

const PAGE_SIZE = 15

function claseEstado(estado) {
  return `role-dashboard__status role-dashboard__status--${estado?.toLowerCase()}`
}

export default function DashboardAgente() {
  const [agente, setAgente] = useState(null)
  const [ticketPrioridad, setTicketPrioridad] = useState(undefined)
  const [metricas, setMetricas] = useState(undefined)
  const [errorPerfil, setErrorPerfil] = useState('')
  const [errorMetricas, setErrorMetricas] = useState('')
  const [errorPrioridad, setErrorPrioridad] = useState('')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [paginaVencidos, setPaginaVencidos] = useState(1)
  const navigate = useNavigate()

  const totalVencidos = metricas?.ticketsVencidos?.length || 0
  const totalPaginasVencidos = Math.max(1, Math.ceil(totalVencidos / PAGE_SIZE))
  const paginaActualVencidos = Math.min(paginaVencidos, totalPaginasVencidos)
  const vencidosPaginados = metricas?.ticketsVencidos
    ? metricas.ticketsVencidos.slice((paginaActualVencidos - 1) * PAGE_SIZE, paginaActualVencidos * PAGE_SIZE)
    : []

  useEffect(() => {
    let activo = true

    api.get('/agentes/perfil')
      .then(({ data }) => {
        if (!activo) return
        setAgente(data)

        api.get(`/metricas/agente/${data.idAgente}`)
          .then(response => {
            if (!activo) return
            setMetricas(response.data)
            setPaginaVencidos(1)
          })
          .catch(() => {
            if (!activo) return
            setMetricas(null)
            setErrorMetricas('No se pudieron cargar las métricas del agente.')
          })

        api.get(`/agentes/${data.idAgente}/ticket-prioridad`)
          .then(response => {
            if (activo) setTicketPrioridad(response.data)
          })
          .catch(() => {
            if (!activo) return
            setTicketPrioridad(null)
            setErrorPrioridad('No se pudo cargar el ticket de mayor prioridad.')
          })
      })
      .catch(() => {
        if (!activo) return
        setErrorPerfil('No se pudo cargar el perfil del agente.')
        setMetricas(null)
        setTicketPrioridad(null)
      })

    return () => {
      activo = false
    }
  }, [])

  function cerrarSesion() {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div className="coordinator-dashboard role-dashboard">
      <header className="coordinator-dashboard__header">
        <div>
          <p className="coordinator-dashboard__eyebrow">Sistema de Soporte UMG</p>
          <span className="coordinator-dashboard__brand">Panel del agente</span>
        </div>
        <div className="coordinator-dashboard__session-actions">
          <button type="button" onClick={() => setShowPasswordModal(true)}>Cambiar contraseña</button>
          <button type="button" onClick={cerrarSesion}>Cerrar sesión</button>
        </div>
      </header>

      {showPasswordModal && <CambiarPassword onClose={() => setShowPasswordModal(false)} />}

      <main id="contenido-principal" className="coordinator-dashboard__main">
        <section className="coordinator-dashboard__hero" aria-labelledby="agent-title">
          <div>
            <p className="coordinator-dashboard__eyebrow">Resumen operativo</p>
            <h1 id="agent-title">Gestión de soporte</h1>
            <p>Consulta tu desempeño, atiende los casos asignados y da seguimiento a los acuerdos de servicio.</p>
          </div>
        </section>

        {(errorPerfil || errorMetricas) && (
          <p className="coordinator-dashboard__feedback coordinator-dashboard__feedback--error" role="alert">
            {[errorPerfil, errorMetricas].filter(Boolean).join(' ')}
          </p>
        )}

        <section className="coordinator-dashboard__toolbar" aria-labelledby="acciones-agente">
          <div>
            <h2 id="acciones-agente">Acciones del agente</h2>
            <nav className="coordinator-dashboard__nav" aria-label="Acciones del agente">
              <Link to="/agente/tickets">Mis tickets asignados</Link>
              <Link to="/agente/tickets/historial">Historial de tickets</Link>
              <Link to="/tickets/nuevo">Crear ticket</Link>
              <Link to="/agente/conocimiento">Base de conocimiento</Link>
              {agente?.esGerencial && <Link to="/agente/crear-estudiante">Nuevo estudiante</Link>}
              {agente?.esGerencial && <Link to="/agente/crear-agente">Nuevo agente</Link>}
            </nav>
          </div>
        </section>

        <div className="role-dashboard__section-gap" />

        <section className="coordinator-dashboard__kpis" aria-label="Métricas del agente">
          <article className="coordinator-dashboard__kpi">
            <p>Tickets resueltos</p>
            <strong>{metricas === undefined ? '...' : metricas?.ticketsResueltos ?? '--'}</strong>
            <span>Resueltos o cerrados</span>
          </article>
          <article className="coordinator-dashboard__kpi">
            <p>Resolución promedio</p>
            <strong>{metricas === undefined ? '...' : metricas ? `${Number(metricas.tiempoPromedioResolucionHoras).toFixed(1)} h` : '--'}</strong>
            <span>Tiempo promedio hasta cierre</span>
          </article>
          <article className={`coordinator-dashboard__kpi ${totalVencidos > 0 ? 'coordinator-dashboard__kpi--warning' : ''}`}>
            <p>Tickets vencidos (SLA)</p>
            <strong>{metricas === undefined ? '...' : metricas ? totalVencidos : '--'}</strong>
            <span>{totalVencidos > 0 ? 'Requieren seguimiento' : 'Sin incidencias registradas'}</span>
          </article>
        </section>

        <section className="coordinator-dashboard__panel coordinator-dashboard__sla" aria-labelledby="agent-sla-title">
          <div className="coordinator-dashboard__panel-heading">
            <div>
              <p className="coordinator-dashboard__eyebrow">Cumplimiento</p>
              <h2 id="agent-sla-title">Detalle de tickets vencidos</h2>
            </div>
            {metricas && <span className="coordinator-dashboard__count">{totalVencidos} tickets</span>}
          </div>

          {metricas === undefined ? (
            <p className="coordinator-dashboard__empty" role="status">Cargando métricas...</p>
          ) : metricas === null ? (
            <p className="coordinator-dashboard__empty">No se encuentra disponible el detalle de SLA.</p>
          ) : totalVencidos === 0 ? (
            <p className="coordinator-dashboard__empty coordinator-dashboard__empty--success">No hay tickets vencidos.</p>
          ) : (
            <>
              <div className="coordinator-dashboard__table-region" tabIndex="0">
                <table>
                  <caption className="visually-hidden">Tickets asignados que incumplieron el acuerdo de nivel de servicio</caption>
                  <thead>
                    <tr>
                      <th scope="col">Ticket</th>
                      <th scope="col">Tipo</th>
                      <th scope="col">Prioridad</th>
                      <th scope="col">Estado</th>
                      <th scope="col">Creación</th>
                      <th scope="col">Resolución</th>
                      <th scope="col">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vencidosPaginados.map(ticket => (
                      <tr key={ticket.idTicket}>
                        <td>#{ticket.idTicket}</td>
                        <td>{ticket.tipologiaITIL}</td>
                        <td><span className={`coordinator-dashboard__priority coordinator-dashboard__priority--${ticket.prioridadSLA?.toLowerCase()}`}>{ticket.prioridadSLA}</span></td>
                        <td><span className={claseEstado(ticket.estado)}>{ticket.estado}</span></td>
                        <td>{new Date(ticket.fechaCreacion).toLocaleString('es-GT')}</td>
                        <td>{ticket.fechaResolucion ? new Date(ticket.fechaResolucion).toLocaleString('es-GT') : <span className="role-dashboard__pending">Aún abierto</span>}</td>
                        <td><Link className="role-dashboard__table-link" to={`/tickets/${ticket.idTicket}`}>Ver</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={paginaActualVencidos}
                totalItems={totalVencidos}
                pageSize={PAGE_SIZE}
                onPageChange={setPaginaVencidos}
                ariaLabel="Paginación de tickets vencidos"
              />
            </>
          )}
        </section>

        <section className="coordinator-dashboard__metrics-grid" aria-label="Perfil y prioridad">
          <article className="coordinator-dashboard__panel">
            <div className="coordinator-dashboard__panel-heading">
              <div>
                <p className="coordinator-dashboard__eyebrow">Cuenta</p>
                <h2>Mi perfil</h2>
              </div>
              {agente?.esGerencial && <span className="coordinator-dashboard__count">Gerencial</span>}
            </div>
            {agente ? (
              <dl className="role-dashboard__details">
                <InfoRow label="Nombre" value={agente.nombreCompleto} />
                <InfoRow label="Correo" value={agente.correoInstitucional} />
                <InfoRow label="Especialidad" value={agente.especialidad} />
                <InfoRow label="Sede" value={agente.sedeAsignada} />
                <InfoRow label="Nivel acceso" value={agente.nivelAcceso} />
              </dl>
            ) : errorPerfil ? (
              <p className="coordinator-dashboard__empty">Perfil no disponible.</p>
            ) : (
              <p className="coordinator-dashboard__empty" role="status">Cargando perfil...</p>
            )}
          </article>

          <article className="coordinator-dashboard__panel">
            <div className="coordinator-dashboard__panel-heading">
              <div>
                <p className="coordinator-dashboard__eyebrow">Atención inmediata</p>
                <h2>Ticket de mayor prioridad</h2>
              </div>
            </div>
            {ticketPrioridad === undefined ? (
              <p className="coordinator-dashboard__empty" role="status">Cargando ticket...</p>
            ) : errorPrioridad ? (
              <p className="coordinator-dashboard__feedback coordinator-dashboard__feedback--error" role="alert">{errorPrioridad}</p>
            ) : ticketPrioridad === null ? (
              <p className="coordinator-dashboard__empty coordinator-dashboard__empty--success">No tienes tickets abiertos asignados.</p>
            ) : (
              <>
                <dl className="role-dashboard__details">
                  <InfoRow label="Ticket #" value={ticketPrioridad.idTicket} />
                  <InfoRow label="Tipo" value={ticketPrioridad.tipologiaITIL} />
                  <InfoRow label="Fecha" value={new Date(ticketPrioridad.fechaCreacion).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' })} />
                  {ticketPrioridad.descripcion && <InfoRow label="Descripción" value={ticketPrioridad.descripcion} />}
                  <InfoRow label="Prioridad" value={<span className={`coordinator-dashboard__priority coordinator-dashboard__priority--${ticketPrioridad.prioridadSLA?.toLowerCase()}`}>{ticketPrioridad.prioridadSLA}</span>} />
                  <InfoRow label="Estado" value={<span className={claseEstado(ticketPrioridad.estado)}>{ticketPrioridad.estado}</span>} />
                  <InfoRow label="Estudiante" value={ticketPrioridad.carne} />
                </dl>
                <Link className="role-dashboard__panel-action" to="/agente/tickets">Ver todos mis tickets</Link>
              </>
            )}
          </article>
        </section>
      </main>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="role-dashboard__detail">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
