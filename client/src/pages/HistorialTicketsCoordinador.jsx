import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const COLOR_PRIORIDAD = {
  'Alta': '#e74c3c',
  'Media': '#e67e22',
  'Baja': '#27ae60'
}

const COLOR_ESTADO = {
  'Abierto': '#e74c3c',
  'EnProceso': '#e67e22',
  'Pendiente': '#f1c40f',
  'Resuelto': '#1abc9c',
  'Cerrado': '#3498db'
}

export default function TicketsCoordinador() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('Todos');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/tickets/abiertos')
      .then(r => setTickets(r.data))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false))
  }, []);

  const ticketsFiltrados = filtro === 'Todos'
    ? tickets
    : tickets.filter(t => t.estado === filtro);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>← Volver</button>
        <span style={styles.headerTitle}>Historial de tickets</span>
        <span />
      </div>

      <div style={styles.container}>
        <p style={styles.contador}>
          {loading ? 'Cargando...' : `${ticketsFiltrados.length} ticket${ticketsFiltrados.length !== 1 ? 's' : ''}`}
        </p>

        {!loading && ticketsFiltrados.length === 0 && (
          <p style={styles.empty}>No hay tickets en este estado</p>
        )}

        <div style={styles.lista}>
          {ticketsFiltrados.map(t => (
            <div key={t.idTicket} style={styles.card}>
              <div style={styles.cardTop}>
                <span style={styles.ticketId}>Ticket #{t.idTicket}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ ...styles.badgeBanner, background: COLOR_PRIORIDAD[t.prioridadSLA] }}>
                    {t.prioridadSLA}
                  </span>
                  <span style={{ ...styles.badge, background: COLOR_ESTADO[t.estado] }}>
                    {t.estado}
                  </span>
                </div>
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
                <button style={styles.verBtn} onClick={() => navigate(`/tickets/${t.idTicket}`)}>Ver detalle</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: '#f4f4f4', fontFamily: 'sans-serif' },
  header: { background: '#1a1a2e', color: '#fff', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontWeight: '500', fontSize: '15px' },
  backBtn: { background: 'transparent', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.3)', color: '#fff', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
  container: { maxWidth: '700px', margin: '2rem auto', padding: '0 1rem' },
  contador: { fontSize: '13px', color: '#888', marginBottom: '1rem' },
  empty: { textAlign: 'center', color: '#aaa', fontSize: '14px', padding: '3rem 0' },
  filtro: { display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap', justifyContent: 'center' },
  filtroBtn: { background: '#fff', borderWidth: '1px', borderStyle: 'solid', borderColor: '#ddd', color: '#555', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
  filtroBtnActive: { background: '#1a1a2e', color: '#fff', borderColor: '#1a1a2e' },
  lista: { display: 'flex', flexDirection: 'column', gap: '10px' },
  card: { background: '#fff', borderRadius: '10px', padding: '1rem 1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  ticketId: { fontSize: '14px', fontWeight: '600', color: '#1a1a2e' },
  badge: { fontSize: '11px', padding: '2px 9px', borderRadius: '20px', color: '#fff', fontWeight: '500' },
  badgeBanner: { fontSize: '11px', padding: '4px 12px', borderRadius: '4px', color: '#fff', fontWeight: 'bold', minWidth: '80px', textAlign: 'center' },
  cardMid: { marginBottom: '10px' },
  tipologia: { fontSize: '13px', color: '#555', display: 'block' },
  descripcion: { fontSize: '13px', color: '#666', margin: '4px 0 0', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  cardBottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: '#f0f0f0', paddingTop: '8px' },
  fecha: { fontSize: '12px', color: '#aaa' },
  verBtn: { fontSize: '12px', padding: '5px 12px', borderRadius: '6px', borderWidth: '1px', borderStyle: 'solid', borderColor: '#ddd', background: 'transparent', cursor: 'pointer', color: '#555' }
}