import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Pagination from '../components/molecules/Pagination';

const PAGE_SIZE = 15;

const COLOR_PRIORIDAD = {
  'Alta':  '#e74c3c',
  'Media': '#e67e22',
  'Baja':  '#27ae60'
};

const COLOR_ESTADO = {
  'Abierto': '#e74c3c',
  'EnProceso': '#e67e22',
  'Pendiente': '#f1c40f',
  'Resuelto': '#1abc9c',
  'Cerrado': '#3498db'
};

export default function TicketsAsignados() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate();
  const [filtro, setFiltro] = useState('Todos')
  const [pagina, setPagina] = useState(1)

  useEffect(() => {
    api.get('/agentes/perfil')
      .then(r => {
        return api.get(`/agentes/${r.data.idAgente}/tickets`)
      })
      .then(r => {
        setTickets(r.data)
        setPagina(1)
      })
      .catch(() => setTickets([]))
      .finally(() => setLoading(false))
  }, []);

  const ticketsFiltrados = filtro === 'Todos' 
    ? tickets 
    : tickets.filter(t => t.estado === filtro);
  const totalPaginas = Math.max(1, Math.ceil(ticketsFiltrados.length / PAGE_SIZE));
  const paginaActual = Math.min(pagina, totalPaginas);
  const ticketsPaginados = ticketsFiltrados.slice((paginaActual - 1) * PAGE_SIZE, paginaActual * PAGE_SIZE);

  function cambiarFiltro(nuevoFiltro) {
    setFiltro(nuevoFiltro)
    setPagina(1)
  }

  return (
    <div className="crm-page" style={styles.page}>
      <header className="crm-header" style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/agente/dashboard')}>← Volver</button>
        <span style={styles.headerTitle}>Mis tickets asignados</span>
        <span />
      </header>

      <main id="contenido-principal" style={styles.container}>
        <p style={styles.contador}>
          {loading ? 'Cargando...' : `${ticketsFiltrados.length} ticket${ticketsFiltrados.length !== 1 ? 's' : ''} en ${filtro}`}
        </p>

        {!loading && tickets.length === 0 && (
          <p style={styles.empty}>No tienes tickets abiertos asignados</p>
        )}

        <div className="crm-actions" style={styles.filtro} aria-label="Filtrar tickets por estado">
            {['Todos', 'Abierto', 'EnProceso', 'Pendiente', 'Resuelto', 'Cerrado'].map(estado => (
              <button
                key={estado}
                className="touch-target"
                style={{ ...styles.filtroBtn, ...(filtro === estado ? styles.filtroBtnActive : {}) }}
                onClick={() => cambiarFiltro(estado)}
                aria-pressed={filtro === estado}
              >
                {estado === 'EnProceso' ? 'En Proceso' : estado}
              </button>
            ))}
        </div>

        <div style={styles.lista}>
          {ticketsPaginados.map(t => (
            <article key={t.idTicket} className="crm-ticket-card" style={styles.card}>
              <div style={styles.cardTop}>
                <span style={styles.ticketId}>Ticket #{t.idTicket}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ ...styles.badgeBanner, background: COLOR_PRIORIDAD[t.prioridadSLA] || '#999' }}>
                    {t.prioridadSLA || 'N/A'}
                  </span>
                  <span style={{ ...styles.badge, background: COLOR_ESTADO[t.estado] }}>{t.estado}</span>
                </div>
              </div>

              <div style={styles.cardMid}>
                <span style={styles.tipologia}>{t.tipologiaITIL}</span>
                {t.descripcion && <p style={styles.descripcion}>{t.descripcion}</p>}
              </div>

              <div className="crm-card-footer" style={styles.cardBottom}>
                <span style={styles.fecha}>
                  {new Date(t.fechaCreacion).toLocaleDateString('es-GT', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </span>
                <button className="touch-target" style={styles.verBtn} aria-label={`Ver detalle del ticket ${t.idTicket}`} onClick={() => navigate(`/tickets/${t.idTicket}`)}>Ver detalle</button>
              </div>
            </article>
          ))}
        </div>
        {!loading && (
          <Pagination
            currentPage={paginaActual}
            totalItems={ticketsFiltrados.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPagina}
            ariaLabel="Paginación de tickets asignados"
          />
        )}
      </main>
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
  lista: { display: 'flex', flexDirection: 'column', gap: '10px' },
  filtro: { display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap', justifyContent: 'center' },
  filtroBtn: { background: '#fff', borderWidth: '1px', borderStyle: 'solid', borderColor: '#1a1a2e', color: '#1a1a2e', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
  filtroBtnActive: { background: '#1a1a2e', color: '#fff' },
  estado: { fontSize: '13px', padding: '2px 9px', borderRadius: '20px', color: '#1a1a2e', fontWeight: '500', marginLeft: '8px', marginTop: '8px', background: '#eee' },
  dataTicket: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'},
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
