import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const COLOR_ESTADO = {
  'Abierto': '#e74c3c',
  'EnProceso': '#e67e22',
  'Pendiente': '#f1c40f',
  'Resuelto': '#1abc9c',
  'Cerrado': '#3498db'
}

const COLOR_PRIORIDAD = {
  'Alta':  '#e74c3c',
  'Media': '#e67e22',
  'Baja':  '#27ae60'
}

export default function HistorialTickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('Todos')
  const navigate = useNavigate()

  const [encuestas, setEncuestas] = useState({})

  useEffect(() => {
    api.get('/tickets')
      .then(r => {
        setTickets(r.data)
        // Cargar encuestas después de obtener tickets
        r.data.forEach(t => {
          if (t.estado === 'Resuelto' || t.estado === 'Cerrado') {
            api.get(`/encuestas/ticket/${t.idTicket}`)
              .then(enc => setEncuestas(prev => ({ ...prev, [t.idTicket]: enc.data })))
              .catch(() => {})
          }
        })
      })
      .catch(() => setTickets([]))
      .finally(() => setLoading(false))
  }, []);

  useEffect(() => {
    tickets.forEach(t => {
      if ((filtro === 'Resuelto' || filtro === 'Cerrado' || filtro === 'Todos') && (t.estado === 'Resuelto' || t.estado === 'Cerrado')) {
        api.get(`/encuestas/ticket/${t.idTicket}`)
          .then(enc => setEncuestas(prev => ({ ...prev, [t.idTicket]: enc.data })))
          .catch(() => {})
      }
    })
  }, [filtro, tickets])

  const filtros = ['Todos', 'Abierto', 'EnProceso', 'Pendiente', 'Resuelto', 'Cerrado'];

  const ticketsFiltrados = filtro === 'Todos'
    ? tickets
    : tickets.filter(t => t.estado === filtro);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/estudiante/dashboard')}>
          ← Volver
        </button>
        <span style={styles.headerTitle}>Mis tickets</span>
        <button style={styles.newBtn} onClick={() => navigate('/tickets/nuevo')}>
          + Nuevo
        </button>
      </div>

      <div style={styles.container}>
        {/* Filtros */}
        <div style={styles.filtros}>
          {filtros.map(f => (
            <button
              key={f}
              style={{ ...styles.filtroBtn, ...(filtro === f ? styles.filtroBtnActive : {}) }}
              onClick={() => setFiltro(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Contador */}
        <p style={styles.contador}>
          {ticketsFiltrados.length} ticket{ticketsFiltrados.length !== 1 ? 's' : ''}
          {filtro !== 'Todos' ? ` en estado "${filtro}"` : ' en total'}
        </p>

        {/* Lista */}
        {loading ? (
          <p style={styles.empty}>Cargando tickets...</p>
        ) : ticketsFiltrados.length === 0 ? (
          <p style={styles.empty}>No hay tickets {filtro !== 'Todos' ? `con estado "${filtro}"` : 'registrados'}</p>
        ) : (
          <div style={styles.lista}>
            {ticketsFiltrados.map(t => (
              <div key={t.idTicket} style={styles.card}>
                <div style={styles.cardTop}>
                  <span style={styles.ticketId}>Ticket #{t.idTicket}</span>
                  <span style={{ ...styles.badge, background: COLOR_ESTADO[t.estado] }}>
                    {t.estado}
                  </span>
                </div>

                <div style={styles.cardMid}>
                  <span style={styles.tipologia}>{t.tipologiaITIL}</span>
                  {t.descripcion && <p style={styles.descripcion}>{t.descripcion}</p>}
                </div>

                <div style={styles.cardBottom}>
                  <span style={styles.fecha}>
                    {new Date(t.fechaCreacion).toLocaleDateString('es-GT', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {t.estado === 'Resuelto' && (
                      <button 
                        style={{ ...styles.encuestaBtn, opacity: encuestas[t.idTicket] ? 1 : 0.5, cursor: encuestas[t.idTicket] ? 'pointer' : 'not-allowed' }}
                        onClick={() => navigate(`/encuesta/ticket/${t.idTicket}`)}
                        disabled={!encuestas[t.idTicket]}
                      >
                        ⭐ Calificar
                      </button>
                    )}
                    <button style={styles.verBtn} onClick={() => navigate(`/tickets/${t.idTicket}`)}>
                      Ver detalle
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: '#f4f4f4', fontFamily: 'sans-serif' },
  header: { background: '#1a1a2e', color: '#fff', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontWeight: '500', fontSize: '15px' },
  backBtn: { background: 'transparent', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.3)', color: '#fff', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
  newBtn: { background: '#fff', borderWidth: 0, borderStyle: 'none', color: '#1a1a2e', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
  container: { maxWidth: '700px', margin: '1.5rem auto', padding: '0 1rem' },
  filtros: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1rem' },
  filtroBtn: { fontSize: '12px', padding: '6px 14px', borderRadius: '20px', borderWidth: '1px', borderStyle: 'solid', borderColor: '#ddd', background: '#fff', cursor: 'pointer', color: '#555' },
  filtroBtnActive: { background: '#1a1a2e', color: '#fff', borderColor: '#1a1a2e' },
  contador: { fontSize: '13px', color: '#888', marginBottom: '1rem' },
  lista: { display: 'flex', flexDirection: 'column', gap: '10px' },
  card: { background: '#fff', borderRadius: '10px', padding: '1rem 1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  ticketId: { fontSize: '14px', fontWeight: '600', color: '#1a1a2e' },
  badge: { fontSize: '11px', padding: '4px 10px', borderRadius: '20px', color: '#fff', fontWeight: '500' },
  cardMid: { marginBottom: '10px' },
  tipologia: { fontSize: '13px', color: '#555', display: 'block' },
  descripcion: { fontSize: '13px', color: '#666', margin: '4px 0 0', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  cardBottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: '#f0f0f0', paddingTop: '8px' },
  fecha: { fontSize: '12px', color: '#aaa' },
  encuestaBtn: { fontSize: '12px', padding: '5px 12px', borderRadius: '6px', borderWidth: '1px', borderStyle: 'solid', borderColor: '#f39c12', background: '#fff8e1', cursor: 'pointer', color: '#f39c12', fontWeight: '500' },
  verBtn: { fontSize: '12px', padding: '5px 12px', borderRadius: '6px', borderWidth: '1px', borderStyle: 'solid', borderColor: '#ddd', background: 'transparent', cursor: 'pointer', color: '#555' },
  empty: { textAlign: 'center', color: '#aaa', fontSize: '14px', padding: '3rem 0' }
}
