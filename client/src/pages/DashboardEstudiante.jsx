import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import CambiarPassword from '../components/CambiarPassword'

export default function DashboardEstudiante() {
  const [estudiante, setEstudiante] = useState(null);
  const [ultimoTicket, setUltimoTicket] = useState(null);
  const [ticketsActivos, setTicketsActivos] = useState([]);
  const [ticketsHistorial, setTicketsHistorial] = useState([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const navigate = useNavigate();

    useEffect(() => {
        api.get('/tickets/ultimo')
            .then(ticket => {
            const lastTicket = ticket.data
            if (lastTicket) setUltimoTicket({
                idTicket:     lastTicket.idTicket,
                tipologia:    lastTicket.tipologiaITIL,
                estado:       lastTicket.estado,
                descripcion:  lastTicket.descripcion,
                fecha:        new Date(lastTicket.fechaCreacion).toLocaleDateString('es-GT', {
                  day: '2-digit', month: 'short', year: 'numeric'
                })
            });
            })
            .catch(() => setUltimoTicket(null));

        api.get('/estudiantes/perfil')
            .then(est => {
                console.log(est.data)
                setEstudiante({
                nombre: est.data.nombreCompleto,
                correo: est.data.correoInstitucional,
                carne: est.data.carne,
                carrera: est.data.carrera,
                saldo: `Q${parseFloat(est.data.saldo || 0).toFixed(2)}`
            })})
            .catch(() => setEstudiante(null))
    }, []);

  function cerrarSesion() {
    localStorage.clear();
    navigate('/login');
  };

  const colorEstado = {
    'Abierto': '#e74c3c',
    'EnProceso': '#e67e22',
    'Pendiente': '#f1c40f',
    'Resuelto': '#1abc9c',
    'Cerrado': '#3498db'
  };

  return (
    <div style={styles.page}>
      {/* Header moderno */}
      <div style={styles.header}>
        <span style={styles.headerTitle}>Portal del Estudiante</span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={styles.logoutBtn} onClick={() => setShowPasswordModal(true)}>🔑 Cambiar contraseña</button>
          <button style={styles.logoutBtn} onClick={cerrarSesion}>Cerrar sesión</button>
        </div>
      </div>

      {showPasswordModal && <CambiarPassword onClose={() => setShowPasswordModal(false)} />}

        {/* Sección 1 — Acciones rápidas */}
        <div style={styles.section}>
                <h3 style={styles.sectionTitle}>¿En qué podemos ayudarte?</h3>
                <div style={styles.btnGroup}>
                    <button style={styles.actionBtn} onClick={() => navigate('/tickets/nuevo')}>
                        Crear ticket
                    </button>
                    <button style={styles.actionBtn} onClick={() => navigate('/estudiante/tickets')}>
                        Mis tickets
                    </button>
                    <button style={styles.actionBtn} onClick={() => navigate('/preguntas-frecuentes')}>
                        Preguntas frecuentes
                    </button>
                </div>
        </div>

        {/* Sección 2 — Dividida en dos columnas */}
        <div style={styles.grid}>

        {/* 2.1 Datos del estudiante */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
                <h4 style={styles.cardTitle}>Mi perfil</h4>
          </div>
            {estudiante ? (
            <div>
                <InfoRow label="Nombre" value={estudiante.nombre} />
                <InfoRow label="Correo" value={estudiante.correo} />
                <InfoRow label="Carné" value={estudiante.carne} />
                <InfoRow label="Carrera" value={estudiante.carrera} />
                <InfoRow label="Saldo" value={estudiante.saldo} />
            </div>
          ) : (
            <p style={styles.loading}>Cargando...</p>
          )}
        </div>

        {/* 2.2 Último ticket */}
        <div style={styles.card}>
            <div style={styles.cardHeader}>
                <h4 style={styles.cardTitle}>Último ticket abierto</h4>
            </div>
            {ultimoTicket ? (
                <div>
                    <InfoRow label="Ticket #"  value={ultimoTicket.idTicket} />
                    <InfoRow label="Tipo"      value={ultimoTicket.tipologia} />
                    <InfoRow label="Fecha"     value={ultimoTicket.fecha} />
                    {ultimoTicket.descripcion && (
                        <div style={styles.descRow}>
                            <span style={styles.rowLabel}>Descripción</span>
                            <span style={styles.descValor}>{ultimoTicket.descripcion}</span>
                        </div>
                    )}
                    <div style={styles.row}>
                    <span style={styles.rowLabel}>Estado</span>
                    <span style={{ ...styles.badge, background: colorEstado[ultimoTicket.estado] || '#999' }}>
                        {ultimoTicket.estado}
                    </span>
                    </div>
                    <button
                    style={{ ...styles.actionBtn, marginTop: '1rem', width: '100%' }}
                    onClick={() => navigate('/estudiante/tickets')}
                    >
                    Ver historial completo
                    </button>
                </div>
                ) : (
                <p style={styles.loading}>No tienes tickets abiertos</p>
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
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1.5rem 2rem' },
    card: { background: '#fff', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
    cardTitle: { fontSize: '14px', fontWeight: '600', color: '#1a1a2e' },
    editBtn: { background: 'transparent', borderWidth: '1px', borderStyle: 'solid', borderColor: '#ddd', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#555' },
    row: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: '#f0f0f0' },
    rowLabel: { fontSize: '13px', color: '#888' },
    rowValue: { fontSize: '13px', fontWeight: '500', color: '#1a1a2e' },
    badge: { fontSize: '11px', padding: '2px 10px', borderRadius: '20px', color: '#fff', fontWeight: '500' },
    loading: { fontSize: '13px', color: '#aaa', textAlign: 'center', padding: '1rem 0' },
    descRow: { 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        gap: '12px',
        padding: '8px 0', 
        borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: '#f0f0f0' 
    },
    descValor: { 
        fontSize: '13px', 
        color: '#1a1a2e', 
        lineHeight: '1.5',
        textAlign: 'right',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
    }
}