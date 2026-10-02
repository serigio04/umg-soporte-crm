import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import CambiarPassword from '../components/CambiarPassword'

export default function DashboardCoordinador() {
  const [metricas, setMetricas] = useState(null)
  const [agentes, setAgentes] = useState([])
  const [editandoAgente, setEditandoAgente] = useState(null)
  const [nuevaEspecialidad, setNuevaEspecialidad] = useState('')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [paginaSLA, setPaginaSLA] = useState(1)
  const [paginaAgentes, setPaginaAgentes] = useState(1)
  const [slideIndex, setSlideIndex] = useState(0)
  const itemsPerPage = 20
  const navigate = useNavigate()

  const slaPaginados = metricas?.slaVencidos ? metricas.slaVencidos.slice((paginaSLA - 1) * itemsPerPage, paginaSLA * itemsPerPage) : []
  const totalPaginasSLA = metricas?.slaVencidos ? Math.ceil(metricas.slaVencidos.length / itemsPerPage) : 0

  const agentesPaginados = agentes.slice((paginaAgentes - 1) * itemsPerPage, paginaAgentes * itemsPerPage)
  const totalPaginasAgentes = Math.ceil(agentes.length / itemsPerPage)

  const fetchMetricas = () => {
    api.get('/metricas/dashboard')
      .then(r => {
        setMetricas(r.data)
        setSlideIndex(0)
      })
      .catch(console.error)
  }

  const sliderData = []
  if (metricas) {
    sliderData.push({
      nombre: 'General (Todos los agentes)',
      porcentaje: metricas.calificacionGeneral?.porcentaje_calificacion || 0,
      promedio: metricas.calificacionGeneral?.promedio_calificacion || 0
    })
    if (metricas.calificacionesPorAgente) {
      metricas.calificacionesPorAgente.forEach(a => {
        sliderData.push({
          nombre: a.agente,
          porcentaje: a.porcentaje_calificacion || 0,
          promedio: a.promedio_calificacion || 0
        })
      })
    }
  }

  const handleNextSlide = () => {
    setSlideIndex((prev) => (prev + 1) % sliderData.length)
  }
  const handlePrevSlide = () => {
    setSlideIndex((prev) => (prev === 0 ? sliderData.length - 1 : prev - 1))
  }
  const currentSlide = sliderData[slideIndex]

  const fetchAgentes = () => {
    api.get('/usuarios/agentes')
      .then(r => setAgentes(r.data))
      .catch(console.error)
  }

  useEffect(() => {
    fetchMetricas()
    fetchAgentes()
    const intervalId = setInterval(fetchMetricas, 300000) // 5 minutos
    
    return () => clearInterval(intervalId)
  }, [])

  function cerrarSesion() {
    localStorage.clear()
    navigate('/login')
  }

  function descargarReporte() {
    api.get('/metricas/reporte-csv', { responseType: 'blob' })
      .then(response => {
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', 'reporte_tickets.csv')
        document.body.appendChild(link)
        link.click()
        link.parentNode.removeChild(link)
      })
      .catch(console.error)
  }

  function descargarReporteExcel() {
    api.get('/metricas/reporte-excel', { responseType: 'blob' })
      .then(response => {
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', 'reporte_tickets.xlsx')
        document.body.appendChild(link)
        link.click()
        link.parentNode.removeChild(link)
      })
      .catch(console.error)
  }

  function descargarReporteCalificaciones() {
    api.get('/metricas/reporte-calificaciones-excel', { responseType: 'blob' })
      .then(response => {
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', 'reporte_calificaciones_agentes.xlsx')
        document.body.appendChild(link)
        link.click()
        link.parentNode.removeChild(link)
      })
      .catch(console.error)
  }

  async function guardarEspecialidad(idAgente) {
    if (!nuevaEspecialidad) return;
    try {
      await api.put(`/usuarios/agentes/${idAgente}/especialidad`, { especialidad: nuevaEspecialidad })
      setEditandoAgente(null)
      setNuevaEspecialidad('')
      fetchAgentes()
    } catch (err) {
      alert(err.response?.data?.message || 'Error al actualizar especialidad')
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <span style={styles.headerTitle}>Sistema de Soporte UMG — Coordinador</span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowPasswordModal(true)} style={styles.logoutBtn}>🔑 Cambiar contraseña</button>
          <button onClick={cerrarSesion} style={styles.logoutBtn}>Cerrar sesión</button>
        </div>
      </div>

      {showPasswordModal && <CambiarPassword onClose={() => setShowPasswordModal(false)} />}

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Acciones de Coordinación</h3>
        <div style={styles.btnGroup}>
          <button style={styles.actionBtnGerencial} onClick={() => navigate('/agente/crear-estudiante')}>
            👤 Nuevo estudiante
          </button>
          <button style={styles.actionBtnGerencial} onClick={() => navigate('/agente/crear-agente')}>
            🛠️ Nuevo agente
          </button>
          <button style={styles.actionBtnGerencial} onClick={() => navigate('/coordinador/tickets')}>
            🎫 Todos los tickets
          </button>
          <button style={{ ...styles.actionBtn, background: '#27ae60' }} onClick={descargarReporte}>
            📊 Descargar CSV
          </button>
          <button style={{ ...styles.actionBtn, background: '#2980b9' }} onClick={descargarReporteExcel}>
            📊 Descargar Excel
          </button>
          <button style={{ ...styles.actionBtn, background: '#8e44ad' }} onClick={descargarReporteCalificaciones}>
            📊 Calificaciones (Excel)
          </button>
        </div>
      </div>

      <div style={styles.grid}>
        {/* Metrica: Tiempo de resolucion */}
        <div style={styles.card}>
          <h4 style={styles.cardTitle}>Tiempo promedio de resolución</h4>
          <div style={styles.bigMetric}>
            {metricas ? Number(metricas.tiempoPromedioResolucionHoras).toFixed(1) : '...'} hrs
          </div>
          <h4 style={{ ...styles.cardTitle, marginTop: '1rem', fontSize: '13px', color: '#555' }}>Desglosado por agente</h4>
          {metricas ? (
            <table style={{ ...styles.table, marginTop: '0.5rem' }}>
              <tbody>
                {metricas.tiempoPromedioPorAgente?.map((a, i) => (
                  <tr key={i}>
                    <td style={{ ...styles.td, fontSize: '12px', padding: '6px 10px' }}>{a.agente}</td>
                    <td style={{ ...styles.td, fontSize: '12px', padding: '6px 10px', textAlign: 'right', fontWeight: 'bold' }}>
                      {Number(a.tiempo_promedio_horas).toFixed(1)} hrs
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>

        {/* Metrica: Tickets por agente */}
        <div style={styles.card}>
          <h4 style={styles.cardTitle}>Tickets abiertos por agente</h4>
          {metricas ? (
            <table style={styles.table}>
              <tbody>
                {metricas.ticketsAbiertosPorAgente.map((a, i) => (
                  <tr key={i}>
                    <td style={styles.td}>{a.agente}</td>
                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: 'bold' }}>{a.cantidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p style={styles.loading}>Cargando...</p>}
        </div>

        {/* Metrica: Calificaciones (Donut Chart Slider) */}
        <div style={styles.card}>
          <h4 style={styles.cardTitle}>Nivel de Satisfacción (Calificaciones)</h4>
          {metricas && sliderData.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '1rem' }}>
                <button onClick={handlePrevSlide} style={styles.arrowBtn}>⬅️</button>
                <div style={{ textAlign: 'center', width: '200px' }}>
                  <h5 style={{ margin: 0, fontSize: '14px', color: '#333' }}>{currentSlide.nombre}</h5>
                  <p style={{ margin: 0, fontSize: '12px', color: '#777' }}>
                    Promedio: {Number(currentSlide.promedio).toFixed(1)} / 5.0
                  </p>
                </div>
                <button onClick={handleNextSlide} style={styles.arrowBtn}>➡️</button>
              </div>

              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: `conic-gradient(#1abc9c ${currentSlide.porcentaje}%, #eee 0)`,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative'
              }}>
                <div style={{
                  width: '90px',
                  height: '90px',
                  background: '#fff',
                  borderRadius: '50%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'column'
                }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1a1a2e' }}>
                    {Number(currentSlide.porcentaje).toFixed(0)}%
                  </span>
                </div>
              </div>

            </div>
          ) : (
            <p style={styles.loading}>No hay encuestas respondidas aún</p>
          )}
        </div>
      </div>

      {/* SLA Vencidos */}
      <div style={styles.section}>
        <div style={styles.card}>
          <h4 style={styles.cardTitle}>Tickets con SLA Incumplido (Vencidos)</h4>
          {metricas ? (
             metricas.slaVencidos.length === 0 ? (
               <p style={{ color: '#27ae60', padding: '10px 0' }}>✅ No hay tickets vencidos</p>
             ) : (
               <>
               <table style={styles.table}>
                 <thead>
                   <tr>
                     <th style={styles.th}>ID Ticket</th>
                     <th style={styles.th}>Prioridad</th>
                     <th style={styles.th}>Agente Asignado</th>
                     <th style={styles.th}>Fecha Creación</th>
                     <th style={styles.th}>Fecha Resolución</th>
                   </tr>
                 </thead>
                 <tbody>
                   {slaPaginados.map((t, i) => (
                     <tr key={i}>
                       <td style={styles.td}>#{t.idticket}</td>
                       <td style={styles.td}>
                          <span style={{...styles.badge, background: t.prioridadsla === 'Alta' ? '#e74c3c' : t.prioridadsla === 'Media' ? '#e67e22' : '#27ae60' }}>
                            {t.prioridadsla}
                          </span>
                       </td>
                       <td style={styles.td}>{t.agente || 'Sin asignar'}</td>
                       <td style={styles.td}>{new Date(t.fechacreacion).toLocaleString('es-GT')}</td>
                       <td style={styles.td}>
                         {t.fecharesolucion ? new Date(t.fecharesolucion).toLocaleString('es-GT') : <span style={{ color: '#e67e22', fontWeight: 'bold' }}>Aún abierto</span>}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
               {totalPaginasSLA > 1 && (
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                   <button 
                     style={{...styles.actionBtn, padding: '6px 12px', background: paginaSLA === 1 ? '#ccc' : '#1a1a2e', cursor: paginaSLA === 1 ? 'not-allowed' : 'pointer' }}
                     disabled={paginaSLA === 1}
                     onClick={() => setPaginaSLA(p => p - 1)}
                   >Anterior</button>
                   <span style={{ fontSize: '13px' }}>Página {paginaSLA} de {totalPaginasSLA}</span>
                   <button 
                     style={{...styles.actionBtn, padding: '6px 12px', background: paginaSLA === totalPaginasSLA ? '#ccc' : '#1a1a2e', cursor: paginaSLA === totalPaginasSLA ? 'not-allowed' : 'pointer' }}
                     disabled={paginaSLA === totalPaginasSLA}
                     onClick={() => setPaginaSLA(p => p + 1)}
                   >Siguiente</button>
                 </div>
               )}
              </>
             )
          ) : <p style={styles.loading}>Cargando...</p>}
        </div>
      </div>

      {/* Lista de Agentes */}
      <div style={styles.section}>
        <div style={styles.card}>
          <h4 style={styles.cardTitle}>Gestión de Agentes</h4>
          {agentes.length === 0 ? (
            <p style={styles.loading}>Cargando agentes...</p>
          ) : (
            <>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Nombre</th>
                  <th style={styles.th}>Correo</th>
                  <th style={styles.th}>Especialidad</th>
                  <th style={styles.th}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {agentesPaginados.map((a) => (
                  <tr key={a.idagente}>
                    <td style={styles.td}>{a.nombrecompleto}</td>
                    <td style={styles.td}>{a.correoinstitucional}</td>
                    <td style={styles.td}>
                      {editandoAgente === a.idagente ? (
                        <select 
                          value={nuevaEspecialidad} 
                          onChange={(e) => setNuevaEspecialidad(e.target.value)}
                          style={{ padding: '4px 8px', borderRadius: '4px', borderWidth: '1px', borderStyle: 'solid', borderColor: '#ccc', fontFamily: 'sans-serif' }}
                        >
                          <option value="Incidente">Incidente</option>
                          <option value="Solicitud">Solicitud</option>
                          <option value="Cambio">Cambio</option>
                          <option value="General">General</option>
                        </select>
                      ) : (
                        a.especialidad
                      )}
                    </td>
                    <td style={styles.td}>
                      {editandoAgente === a.idagente ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button style={{ ...styles.actionBtn, background: '#27ae60', padding: '6px 10px' }} onClick={() => guardarEspecialidad(a.idagente)}>Guardar</button>
                          <button style={{ ...styles.actionBtn, background: '#e74c3c', padding: '6px 10px' }} onClick={() => setEditandoAgente(null)}>Cancelar</button>
                        </div>
                      ) : (
                        <button style={{ ...styles.actionBtn, background: '#f39c12', padding: '6px 10px' }} onClick={() => { setEditandoAgente(a.idagente); setNuevaEspecialidad(a.especialidad); }}>
                          ✏️ Modificar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPaginasAgentes > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                <button 
                  style={{...styles.actionBtn, padding: '6px 12px', background: paginaAgentes === 1 ? '#ccc' : '#1a1a2e', cursor: paginaAgentes === 1 ? 'not-allowed' : 'pointer' }}
                  disabled={paginaAgentes === 1}
                  onClick={() => setPaginaAgentes(p => p - 1)}
                >Anterior</button>
                <span style={{ fontSize: '13px' }}>Página {paginaAgentes} de {totalPaginasAgentes}</span>
                <button 
                  style={{...styles.actionBtn, padding: '6px 12px', background: paginaAgentes === totalPaginasAgentes ? '#ccc' : '#1a1a2e', cursor: paginaAgentes === totalPaginasAgentes ? 'not-allowed' : 'pointer' }}
                  disabled={paginaAgentes === totalPaginasAgentes}
                  onClick={() => setPaginaAgentes(p => p + 1)}
                >Siguiente</button>
              </div>
            )}
            </>
          )}
        </div>
      </div>
      <div style={{height: '2rem'}}></div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: '#f4f4f4', fontFamily: 'sans-serif' },
  header: { background: '#6c3483', color: '#fff', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontWeight: '500', fontSize: '15px' },
  logoutBtn: { background: 'transparent', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.3)', color: '#fff', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
  section: { padding: '1.5rem 2rem 0' },
  sectionTitle: { fontSize: '15px', fontWeight: '500', color: '#1a1a2e', marginBottom: '1rem' },
  btnGroup: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  actionBtn: { padding: '10px 20px', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
  actionBtnGerencial: { padding: '10px 20px', background: '#6c3483', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1.5rem 2rem' },
  card: { background: '#fff', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardTitle: { fontSize: '14px', fontWeight: '600', color: '#1a1a2e', marginBottom: '1rem' },
  bigMetric: { fontSize: '2rem', fontWeight: 'bold', color: '#1a1a2e', textAlign: 'center', padding: '1rem' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px', fontSize: '13px', color: '#555', borderBottomWidth: '2px', borderBottomStyle: 'solid', borderBottomColor: '#eee' },
  td: { padding: '10px', fontSize: '14px', borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: '#eee', color: '#333' },
  loading: { fontSize: '13px', color: '#aaa', textAlign: 'center', padding: '1rem 0' },
  badge: { fontSize: '11px', padding: '2px 10px', borderRadius: '20px', color: '#fff', fontWeight: '500' },
  arrowBtn: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.5rem', padding: '0 10px' }
}
