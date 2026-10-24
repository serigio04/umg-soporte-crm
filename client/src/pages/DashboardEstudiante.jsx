import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import CambiarPassword from '../components/CambiarPassword'

function claseEstado(estado) {
  return `role-dashboard__status role-dashboard__status--${estado?.toLowerCase()}`
}

export default function DashboardEstudiante() {
  const [estudiante, setEstudiante] = useState(null)
  const [ultimoTicket, setUltimoTicket] = useState(null)
  const [cargandoPerfil, setCargandoPerfil] = useState(true)
  const [cargandoTicket, setCargandoTicket] = useState(true)
  const [errorPerfil, setErrorPerfil] = useState('')
  const [errorTicket, setErrorTicket] = useState('')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    let activo = true

    api.get('/tickets/ultimo')
      .then(({ data }) => {
        if (!activo) return
        if (data) {
          setUltimoTicket({
            idTicket: data.idTicket,
            tipologia: data.tipologiaITIL,
            estado: data.estado,
            descripcion: data.descripcion,
            fecha: new Date(data.fechaCreacion).toLocaleDateString('es-GT', {
              day: '2-digit', month: 'short', year: 'numeric'
            })
          })
        }
      })
      .catch(() => {
        if (activo) setErrorTicket('No se pudo cargar el último ticket.')
      })
      .finally(() => {
        if (activo) setCargandoTicket(false)
      })

    api.get('/estudiantes/perfil')
      .then(({ data }) => {
        if (!activo) return
        setEstudiante({
          nombre: data.nombreCompleto,
          correo: data.correoInstitucional,
          carne: data.carne,
          carrera: data.carrera,
          saldo: `Q${parseFloat(data.saldo || 0).toFixed(2)}`
        })
      })
      .catch(() => {
        if (activo) setErrorPerfil('No se pudo cargar el perfil del estudiante.')
      })
      .finally(() => {
        if (activo) setCargandoPerfil(false)
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
          <span className="coordinator-dashboard__brand">Portal del estudiante</span>
        </div>
        <div className="coordinator-dashboard__session-actions">
          <button type="button" onClick={() => setShowPasswordModal(true)}>Cambiar contraseña</button>
          <button type="button" onClick={cerrarSesion}>Cerrar sesión</button>
        </div>
      </header>

      {showPasswordModal && <CambiarPassword onClose={() => setShowPasswordModal(false)} />}

      <main id="contenido-principal" className="coordinator-dashboard__main">
        <section className="coordinator-dashboard__hero" aria-labelledby="student-title">
          <div>
            <p className="coordinator-dashboard__eyebrow">Centro de ayuda</p>
            <h1 id="student-title">¿En qué podemos ayudarte?</h1>
            <p>Crea solicitudes de soporte, consulta su avance y encuentra respuestas a las preguntas más frecuentes.</p>
          </div>
        </section>

        {(errorPerfil || errorTicket) && (
          <p className="coordinator-dashboard__feedback coordinator-dashboard__feedback--error" role="alert">
            {[errorPerfil, errorTicket].filter(Boolean).join(' ')}
          </p>
        )}

        <section className="coordinator-dashboard__toolbar" aria-labelledby="acciones-estudiante">
          <div>
            <h2 id="acciones-estudiante">Acciones de soporte</h2>
            <nav className="coordinator-dashboard__nav" aria-label="Acciones del estudiante">
              <Link to="/tickets/nuevo">Crear ticket</Link>
              <Link to="/estudiante/tickets">Mis tickets</Link>
              <Link to="/preguntas-frecuentes">Preguntas frecuentes</Link>
            </nav>
          </div>
        </section>

        <section className="coordinator-dashboard__metrics-grid role-dashboard__summary" aria-label="Resumen del estudiante">
          <article className="coordinator-dashboard__panel">
            <div className="coordinator-dashboard__panel-heading">
              <div>
                <p className="coordinator-dashboard__eyebrow">Cuenta</p>
                <h2>Mi perfil</h2>
              </div>
            </div>
            {cargandoPerfil ? (
              <p className="coordinator-dashboard__empty" role="status">Cargando perfil...</p>
            ) : estudiante ? (
              <dl className="role-dashboard__details">
                <InfoRow label="Nombre" value={estudiante.nombre} />
                <InfoRow label="Correo" value={estudiante.correo} />
                <InfoRow label="Carné" value={estudiante.carne} />
                <InfoRow label="Carrera" value={estudiante.carrera} />
                <InfoRow label="Saldo" value={estudiante.saldo} />
              </dl>
            ) : (
              <p className="coordinator-dashboard__empty">Perfil no disponible.</p>
            )}
          </article>

          <article className="coordinator-dashboard__panel">
            <div className="coordinator-dashboard__panel-heading">
              <div>
                <p className="coordinator-dashboard__eyebrow">Seguimiento</p>
                <h2>Último ticket abierto</h2>
              </div>
            </div>
            {cargandoTicket ? (
              <p className="coordinator-dashboard__empty" role="status">Cargando ticket...</p>
            ) : errorTicket ? (
              <p className="coordinator-dashboard__empty">Ticket no disponible.</p>
            ) : ultimoTicket ? (
              <>
                <dl className="role-dashboard__details">
                  <InfoRow label="Ticket #" value={ultimoTicket.idTicket} />
                  <InfoRow label="Tipo" value={ultimoTicket.tipologia} />
                  <InfoRow label="Fecha" value={ultimoTicket.fecha} />
                  {ultimoTicket.descripcion && <InfoRow label="Descripción" value={ultimoTicket.descripcion} />}
                  <InfoRow label="Estado" value={<span className={claseEstado(ultimoTicket.estado)}>{ultimoTicket.estado}</span>} />
                </dl>
                <Link className="role-dashboard__panel-action" to="/estudiante/tickets">Ver historial completo</Link>
              </>
            ) : (
              <p className="coordinator-dashboard__empty coordinator-dashboard__empty--success">No tienes tickets abiertos.</p>
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
