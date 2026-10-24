import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import Button from '../components/atoms/Button'
import FeedbackMessage from '../components/atoms/FeedbackMessage'
import Pagination from '../components/molecules/Pagination'

const PAGE_SIZE = 15
const WELCOME_KEY = 'gestion-agentes-bienvenida-mostrada'
const ESPECIALIDADES = ['General', 'Incidente', 'Solicitud', 'Cambio']

function obtenerNombreCoordinador() {
  try {
    return JSON.parse(localStorage.getItem('usuario') || '{}').nombreCompleto || 'Coordinador'
  } catch {
    return 'Coordinador'
  }
}

export default function GestionAgentes() {
  const [agentes, setAgentes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')
  const [mensajeExito, setMensajeExito] = useState('')
  const [pagina, setPagina] = useState(1)
  const [menuAbierto, setMenuAbierto] = useState(null)
  const [agenteEditado, setAgenteEditado] = useState(null)
  const [especialidad, setEspecialidad] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [errorEdicion, setErrorEdicion] = useState('')
  const [mostrarBienvenida] = useState(() => {
    try {
      return !sessionStorage.getItem(WELCOME_KEY)
    } catch {
      return true
    }
  })
  const modalRef = useRef(null)
  const selectRef = useRef(null)

  useEffect(() => {
    try {
      if (mostrarBienvenida) sessionStorage.setItem(WELCOME_KEY, 'true')
    } catch {
      // The welcome still renders when storage is unavailable.
    }
  }, [mostrarBienvenida])

  useEffect(() => {
    const controller = new AbortController()

    api.get('/usuarios/agentes', { signal: controller.signal })
      .then(({ data }) => {
        setAgentes(Array.isArray(data) ? data : [])
        setErrorCarga('')
      })
      .catch((error) => {
        if (error.code !== 'ERR_CANCELED') {
          setErrorCarga(error.response?.data?.message || 'No fue posible cargar los agentes. Intenta nuevamente.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCargando(false)
      })

    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (menuAbierto === null) return undefined

    document.querySelector(`#menu-agente-${menuAbierto} [role="menuitem"]`)?.focus()

    function cerrarMenu(event) {
      if (!event.target.closest('.agent-actions')) setMenuAbierto(null)
    }

    function manejarTeclado(event) {
      if (event.key === 'Escape') {
        setMenuAbierto(null)
        document.getElementById(`acciones-agente-${menuAbierto}`)?.focus()
      }
    }

    document.addEventListener('pointerdown', cerrarMenu)
    document.addEventListener('keydown', manejarTeclado)
    return () => {
      document.removeEventListener('pointerdown', cerrarMenu)
      document.removeEventListener('keydown', manejarTeclado)
    }
  }, [menuAbierto])

  useEffect(() => {
    if (!agenteEditado) return undefined

    const elementoAnterior = document.activeElement
    selectRef.current?.focus()

    return () => elementoAnterior?.focus()
  }, [agenteEditado])

  useEffect(() => {
    if (!agenteEditado) return undefined

    function manejarTeclado(event) {
      if (event.key === 'Escape' && !guardando) {
        setAgenteEditado(null)
        return
      }

      if (event.key === 'Tab') {
        const elementos = modalRef.current?.querySelectorAll('button:not(:disabled), select:not(:disabled)') || []
        const primero = elementos[0]
        const ultimo = elementos[elementos.length - 1]
        if (event.shiftKey && document.activeElement === primero) {
          event.preventDefault()
          ultimo?.focus()
        } else if (!event.shiftKey && document.activeElement === ultimo) {
          event.preventDefault()
          primero?.focus()
        }
      }
    }

    document.addEventListener('keydown', manejarTeclado)
    return () => document.removeEventListener('keydown', manejarTeclado)
  }, [agenteEditado, guardando])

  const totalPaginas = Math.max(1, Math.ceil(agentes.length / PAGE_SIZE))
  const paginaActual = Math.min(pagina, totalPaginas)
  const agentesPaginados = agentes.slice((paginaActual - 1) * PAGE_SIZE, paginaActual * PAGE_SIZE)

  function abrirEditor(agente) {
    setMenuAbierto(null)
    setAgenteEditado(agente)
    setEspecialidad(agente.especialidad)
    setErrorEdicion('')
  }

  function cerrarEditor() {
    if (!guardando) setAgenteEditado(null)
  }

  async function guardarEspecialidad(event) {
    event.preventDefault()
    if (!agenteEditado || !especialidad) return

    setGuardando(true)
    setErrorEdicion('')
    try {
      await api.put(`/usuarios/agentes/${agenteEditado.idagente}/especialidad`, { especialidad })
      setAgentes(actuales => actuales.map(agente => (
        agente.idagente === agenteEditado.idagente ? { ...agente, especialidad } : agente
      )))
      setMensajeExito(`La especialidad de ${agenteEditado.nombrecompleto} se actualizó correctamente.`)
      setAgenteEditado(null)
    } catch (error) {
      setErrorEdicion(error.response?.data?.message || 'No fue posible actualizar la especialidad.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="crm-page agent-management-page">
      <header className="agent-management-header">
        <Link className="agent-brand" to="/coordinador/dashboard" aria-label="Ir al panel del coordinador">
          <span className="agent-brand-mark" aria-hidden="true">UMG</span>
          <span>Mesa de ayuda</span>
        </Link>
        <span className="agent-role">Coordinación</span>
      </header>

      <main id="contenido-principal" className="agent-management-main">
        {mostrarBienvenida && (
          <div className="agent-welcome" role="status">
            Bienvenido, <strong>{obtenerNombreCoordinador()}</strong>
          </div>
        )}

        <section className="agent-management-hero" aria-labelledby="gestion-agentes-titulo">
          <div>
            <p className="agent-management-eyebrow">Equipo de soporte</p>
            <h1 id="gestion-agentes-titulo">Gestión de agentes</h1>
            <p>Consulta al equipo y mantén actualizada la especialidad asignada a cada agente.</p>
          </div>
          <Link className="crm-button crm-button-primary agent-create-link" to="/agente/crear-agente">
            <span aria-hidden="true">+</span> Crear agente
          </Link>
        </section>

        {mensajeExito && (
          <FeedbackMessage type="success">{mensajeExito}</FeedbackMessage>
        )}

        <section className="agent-list-card" aria-labelledby="lista-agentes-titulo" aria-busy={cargando}>
          <div className="agent-list-heading">
            <div>
              <h2 id="lista-agentes-titulo">Agentes registrados</h2>
              <p>{cargando ? 'Consultando equipo...' : `${agentes.length} agente${agentes.length === 1 ? '' : 's'} en total`}</p>
            </div>
          </div>

          {errorCarga && (
            <FeedbackMessage>{errorCarga}</FeedbackMessage>
          )}

          {cargando && (
            <div className="agent-state" role="status">
              <span className="agent-spinner" aria-hidden="true" />
              Cargando agentes...
            </div>
          )}

          {!cargando && !errorCarga && agentes.length === 0 && (
            <div className="agent-state agent-empty-state">
              <strong>Aún no hay agentes registrados</strong>
              <span>Crea el primer agente para comenzar a organizar el equipo.</span>
            </div>
          )}

          {!cargando && agentes.length > 0 && (
            <>
              <div className="crm-table-region agent-table-region">
                <table className="crm-table agent-table">
                  <caption className="visually-hidden">Listado de agentes de soporte</caption>
                  <thead>
                    <tr>
                      <th scope="col">Agente</th>
                      <th scope="col">Especialidad</th>
                      <th scope="col">Nivel</th>
                      <th scope="col">Sede</th>
                      <th scope="col"><span className="visually-hidden">Acciones</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentesPaginados.map(agente => (
                      <tr key={agente.idagente}>
                        <td data-label="Agente">
                          <strong className="agent-name">{agente.nombrecompleto}</strong>
                          <span className="agent-email">{agente.correoinstitucional}</span>
                        </td>
                        <td data-label="Especialidad"><span className="agent-specialty">{agente.especialidad}</span></td>
                        <td data-label="Nivel">Nivel {agente.nivelacceso}</td>
                        <td data-label="Sede">{agente.sedeasignada}</td>
                        <td className="agent-actions-cell">
                          <div className="agent-actions">
                            <button
                              id={`acciones-agente-${agente.idagente}`}
                              type="button"
                              className="agent-menu-trigger"
                              aria-label={`Abrir acciones para ${agente.nombrecompleto}`}
                              aria-haspopup="menu"
                              aria-expanded={menuAbierto === agente.idagente}
                              aria-controls={`menu-agente-${agente.idagente}`}
                              onClick={() => setMenuAbierto(actual => actual === agente.idagente ? null : agente.idagente)}
                            >
                              <span aria-hidden="true">•••</span>
                            </button>
                            {menuAbierto === agente.idagente && (
                              <div id={`menu-agente-${agente.idagente}`} className="agent-actions-menu" role="menu">
                                <button type="button" role="menuitem" onClick={() => abrirEditor(agente)}>
                                  Editar especialidad
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={paginaActual}
                totalItems={agentes.length}
                pageSize={PAGE_SIZE}
                onPageChange={setPagina}
                ariaLabel="Paginación de agentes"
              />
            </>
          )}
        </section>
      </main>

      {agenteEditado && (
        <div className="modal-overlay agent-modal-overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget) cerrarEditor()
        }}>
          <section
            ref={modalRef}
            className="modal-card agent-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="editar-especialidad-titulo"
            aria-describedby="editar-especialidad-descripcion"
          >
            <div className="modal-header">
              <div>
                <p className="agent-management-eyebrow">Asignación operativa</p>
                <h2 id="editar-especialidad-titulo" className="modal-title">Editar especialidad</h2>
              </div>
              <button type="button" className="agent-modal-close" onClick={cerrarEditor} disabled={guardando} aria-label="Cerrar modal">×</button>
            </div>
            <p id="editar-especialidad-descripcion" className="agent-modal-description">
              Actualiza la especialidad de <strong>{agenteEditado.nombrecompleto}</strong>.
            </p>
            <FeedbackMessage id="error-especialidad">{errorEdicion}</FeedbackMessage>
            <form onSubmit={guardarEspecialidad} aria-busy={guardando}>
              <div className="form-field">
                <label className="form-label" htmlFor="especialidad-agente">Especialidad</label>
                <select
                  ref={selectRef}
                  id="especialidad-agente"
                  className="form-control"
                  value={especialidad}
                  onChange={event => setEspecialidad(event.target.value)}
                  aria-describedby={errorEdicion ? 'error-especialidad' : undefined}
                  required
                >
                  {ESPECIALIDADES.map(opcion => <option key={opcion} value={opcion}>{opcion}</option>)}
                </select>
              </div>
              <div className="agent-modal-actions">
                <Button variant="secondary" onClick={cerrarEditor} disabled={guardando}>Cancelar</Button>
                <Button type="submit" disabled={guardando || especialidad === agenteEditado.especialidad}>
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}
