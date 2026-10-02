import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import CambiarPassword from '../components/CambiarPassword'

const COLOR_PRIORIDAD = {
  'Alta':  '#e74c3c',
  'Media': '#e67e22',
  'Baja':  '#27ae60'
}

const COLOR_ESTADO = {
  'Abierto': '#e74c3c',
  'EnProceso': '#e67e22',
  'Pendiente': '#f1c40f',
  'Resuelto': '#1abc9c',
  'Cerrado': '#3498db'
}

export default function DashboardAgente() {
  const [agente, setAgente] = useState(null)
  const [ticketPrioridad, setTicketPrioridad] = useState(undefined)
  const [metricas, setMetricas] = useState(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [paginaVencidos, setPaginaVencidos] = useState(1)
  const itemsPerPage = 20
  const navigate = useNavigate()

  const vencidosPaginados = metricas?.ticketsVencidos ? metricas.ticketsVencidos.slice((paginaVencidos - 1) * itemsPerPage, paginaVencidos * itemsPerPage) : []
  const totalPaginasVencidos = metricas?.ticketsVencidos ? Math.ceil(metricas.ticketsVencidos.length / itemsPerPage) : 0

  useEffect(() => {
    api.get('/agentes/perfil').then(ticket => {
      setAgente(ticket.data)
      
      api.get(`/metricas/agente/${ticket.data.idAgente}`)
        .then(r => setMetricas(r.data))
        .catch(() => setMetricas(null))

      return api.get(`/agentes/${ticket.data.idAgente}/ticket-prioridad`)
    })
    .then(r => setTicketPrioridad(r.data))
    .catch(() => setTicketPrioridad(null))
  }, [])

  function cerrarSesion() {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <span style={styles.headerTitle}>Dashboard del Agente</span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowPasswordModal(true)} style={styles.logoutBtn}>🔑 Cambiar contraseña</button>
          <button onClick={cerrarSesion} style={styles.logoutBtn}>Cerrar sesión</button>
        </div>
      </div>

      {showPasswordModal && <CambiarPassword onClose={() => setShowPasswordModal(false)} />}

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Acciones rápidas</h3>
        <div style={styles.btnGroup}>
          <button style={styles.actionBtn} onClick={() => navigate(`/agente/tickets`)}>
            🎫 Mis tickets asignados
          </button>
          <button style={styles.actionBtn} onClick={() => navigate(`/agente/tickets/historial`)}>
            📋 Historial de tickets
          </button>
          <button style={styles.actionBtn} onClick={() => navigate('/tickets/nuevo')}>
            ➕ Crear ticket
          </button>
          <button style={styles.actionBtn} onClick={() => navigate('/agente/conocimiento')}>
            📚 Base de conocimiento
          </button>
          {agente?.esGerencial && (
            <>
              <button style={{ ...styles.actionBtn, ...styles.actionBtnGerencial }}
                onClick={() => navigate('/agente/crear-estudiante')}>
                👤 Nuevo estudiante
              </button>
              <button style={{ ...styles.actionBtn, ...styles.actionBtnGerencial }}
                onClick={() => navigate('/agente/crear-agente')}>
                🛠️ Nuevo agente
              </button>
            </>
          )}
        </div>
      </div>

      {/* Métricas del agente */}
      <div style={styles.metricsGrid}>
        <div style={styles.card}>
          <h4 style={styles.cardTitle}>Tickets resueltos</h4>
          <div style={styles.bigMetric}>
            {metricas !== null ? metricas.ticketsResueltos : '...'}
          </div>
          <p style={styles.metricLabel}>tickets resueltos o cerrados</p>
        </div>
        <div style={styles.card}>
          <h4 style={styles.cardTitle}>Promedio de resolución</h4>
          <div style={styles.bigMetric}>
            {metricas !== null ? `${Number(metricas.tiempoPromedioResolucionHoras).toFixed(1)}h` : '...'}
          </div>
          <p style={styles.metricLabel}>tiempo promedio hasta cierre</p>
        </div>
        <div style={styles.card}>
          <h4 style={styles.cardTitle}>Tickets vencidos (SLA)</h4>
          <div style={{ ...styles.bigMetric, color: metricas?.ticketsVencidos?.length > 0 ? '#e74c3c' : '#27ae60' }}>
            {metricas !== null ? metricas.ticketsVencidos.length : '...'}
          </div>
          <p style={styles.metricLabel}>tickets que superaron el tiempo límite</p>
        </div>
      </div>

      {/* Tabla de vencidos */}
      {metricas?.ticketsVencidos?.length > 0 && (
        <div style={styles.section}>
          <div style={styles.card}>
            <h4 style={styles.cardTitle}>⚠️ Detalle de tickets vencidos</h4>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Ticket</th>
                  <th style={styles.th}>Tipo</th>
                  <th style={styles.th}>Prioridad</th>
                  <th style={styles.th}>Estado</th>
                  <th style={styles.th}>Fecha creación</th>
                  <th style={styles.th}>Fecha resolución</th>
                  <th style={styles.th}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {vencidosPaginados.map((t, i) => (
                  <tr key={i}>
                    <td style={styles.td}>#{t.idTicket}</td>
                    <td style={styles.td}>{t.tipologiaITIL}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, background: COLOR_PRIORIDAD[t.prioridadSLA] }}>
                        {t.prioridadSLA}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, background: COLOR_ESTADO[t.estado] }}>
                        {t.estado}
                      </span>
                    </td>
                    <td style={styles.td}>{new Date(t.fechaCreacion).toLocaleString('es-GT')}</td>
                    <td style={styles.td}>
                      {t.fechaResolucion ? new Date(t.fechaResolucion).toLocaleString('es-GT') : <span style={{ color: '#e67e22', fontWeight: 'bold' }}>Aún abierto</span>}
                    </td>
                    <td style={styles.td}>
                      <button style={styles.verBtn} onClick={() => navigate(`/tickets/${t.idTicket}`)}>Ver</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPaginasVencidos > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                <button 
                  style={{...styles.actionBtn, padding: '6px 12px', background: paginaVencidos === 1 ? '#ccc' : '#1a1a2e', cursor: paginaVencidos === 1 ? 'not-allowed' : 'pointer' }}
                  disabled={paginaVencidos === 1}
                  onClick={() => setPaginaVencidos(p => p - 1)}
                >Anterior</button>
                <span style={{ fontSize: '13px' }}>Página {paginaVencidos} de {totalPaginasVencidos}</span>
                <button 
                  style={{...styles.actionBtn, padding: '6px 12px', background: paginaVencidos === totalPaginasVencidos ? '#ccc' : '#1a1a2e', cursor: paginaVencidos === totalPaginasVencidos ? 'not-allowed' : 'pointer' }}
                  disabled={paginaVencidos === totalPaginasVencidos}
                  onClick={() => setPaginaVencidos(p => p + 1)}
                >Siguiente</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sección 2 — Grid */}
      <div style={styles.grid}>

        {/* 2.1 Perfil del agente */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h4 style={styles.cardTitle}>Mi perfil</h4>
            {agente?.esGerencial && (
              <span style={styles.gerencialBadge}>Gerencial</span>
            )}
          </div>
          {agente ? (
            <div>
              <InfoRow label="Nombre"       value={agente.nombreCompleto} />
              <InfoRow label="Correo"       value={agente.correoInstitucional} />
              <InfoRow label="Especialidad" value={agente.especialidad} />
              <InfoRow label="Sede"         value={agente.sedeAsignada} />
              <InfoRow label="Nivel acceso" value={agente.nivelAcceso} />
            </div>
          ) : (
            <p style={styles.loading}>Cargando...</p>
          )}
        </div>

        {/* 2.2 Ticket de mayor prioridad */}
        <div style={styles.card}>
          <h4 style={styles.cardTitle}>Ticket de mayor prioridad</h4>
          {ticketPrioridad === undefined ? (
            <p style={styles.loading}>Cargando...</p>
          ) : ticketPrioridad === null ? (
            <p style={styles.loading}>No tienes tickets abiertos asignados</p>
          ) : (
            <div>
              <InfoRow label="Ticket #" value={ticketPrioridad.idTicket} />
              <InfoRow label="Tipo"     value={ticketPrioridad.tipologiaITIL} />
              <InfoRow label="Fecha"    value={new Date(ticketPrioridad.fechaCreacion).toLocaleDateString('es-GT', {
                day: '2-digit', month: 'short', year: 'numeric'
              })} />
              {ticketPrioridad.descripcion && (
                <div style={styles.descRow}>
                  <span style={styles.rowLabel}>Descripción</span>
                  <span style={styles.descValor}>{ticketPrioridad.descripcion}</span>
                </div>
              )}
              <div style={styles.row}>
                <span style={styles.rowLabel}>Prioridad</span>
                <span style={{ ...styles.badgeBanner, background: COLOR_PRIORIDAD[ticketPrioridad.prioridadSLA] }}>
                  {ticketPrioridad.prioridadSLA}
                </span>
              </div>
              <div style={styles.row}>
                <span style={styles.rowLabel}>Estado</span>
                <span style={{ ...styles.badge, background: COLOR_ESTADO[ticketPrioridad.estado] }}>
                  {ticketPrioridad.estado}
                </span>
              </div>
              <div style={styles.row}>
                <span style={styles.rowLabel}>Estudiante</span>
                <span style={styles.descValor}>
                  {ticketPrioridad.carne}
                </span>
              </div>
              <button
                style={{ ...styles.actionBtn, marginTop: '1rem', width: '100%' }}
                onClick={() => navigate(`/agente/tickets`)}
              >
                Ver todos mis tickets
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
      <span style={{ fontSize: '13px', color: '#888' }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e' }}>{value}</span>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: '#f4f4f4', fontFamily: 'sans-serif' },
  header: { background: '#1a1a2e', color: '#fff', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontWeight: '500', fontSize: '15px' },
  logoutBtn: { background: 'transparent', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.3)', color: '#fff', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
  section: { padding: '1.5rem 2rem 0' },
  sectionTitle: { fontSize: '15px', fontWeight: '500', color: '#1a1a2e', marginBottom: '1rem' },
  btnGroup: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  actionBtn: { padding: '10px 20px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
  actionBtnGerencial: { background: '#6c3483' },
  metricsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', padding: '1.5rem 2rem 0' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1.5rem 2rem' },
  card: { background: '#fff', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  cardTitle: { fontSize: '14px', fontWeight: '600', color: '#1a1a2e' },
  bigMetric: { fontSize: '2.5rem', fontWeight: 'bold', color: '#1a1a2e', textAlign: 'center', padding: '0.5rem 0' },
  metricLabel: { fontSize: '12px', color: '#aaa', textAlign: 'center', margin: 0 },
  gerencialBadge: { fontSize: '11px', padding: '2px 9px', borderRadius: '20px', background: '#6c3483', color: '#fff', fontWeight: '500' },
  row: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: '#f0f0f0' },
  rowLabel: { fontSize: '13px', color: '#888' },
  badge: { fontSize: '11px', padding: '2px 10px', borderRadius: '20px', color: '#fff', fontWeight: '500' },
  badgeBanner: { fontSize: '11px', padding: '4px 12px', borderRadius: '4px', color: '#fff', fontWeight: 'bold', minWidth: '80px', textAlign: 'center' },
  descRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', padding: '8px 0', borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: '#f0f0f0' },
  descValor: { fontSize: '13px', color: '#1a1a2e', lineHeight: '1.5', textAlign: 'right', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  loading: { fontSize: '13px', color: '#aaa', textAlign: 'center', padding: '1rem 0' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px', fontSize: '13px', color: '#555', borderBottomWidth: '2px', borderBottomStyle: 'solid', borderBottomColor: '#eee' },
  td: { padding: '10px', fontSize: '13px', borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: '#eee', color: '#333' },
  verBtn: { fontSize: '12px', padding: '4px 10px', borderRadius: '6px', borderWidth: '1px', borderStyle: 'solid', borderColor: '#ddd', background: 'transparent', cursor: 'pointer', color: '#555' }
}