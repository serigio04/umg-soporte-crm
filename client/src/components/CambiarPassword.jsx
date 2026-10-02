import { useState } from 'react';
import api from '../services/api';

export default function CambiarPassword({ onClose }) {
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordNueva !== confirmarPassword) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await api.put('/usuarios/password', { passwordActual, passwordNueva });
      setSuccess('Contraseña actualizada correctamente');
      setTimeout(onClose, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title}>Cambiar Contraseña</h3>
          <button style={styles.closeBtn} onClick={onClose}>×</button>
        </div>
        
        {success ? (
          <p style={styles.success}>{success}</p>
        ) : (
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Contraseña actual</label>
              <input
                type="password"
                value={passwordActual}
                onChange={e => setPasswordActual(e.target.value)}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Nueva contraseña</label>
              <input
                type="password"
                value={passwordNueva}
                onChange={e => setPasswordNueva(e.target.value)}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Confirmar nueva contraseña</label>
              <input
                type="password"
                value={confirmarPassword}
                onChange={e => setConfirmarPassword(e.target.value)}
                style={styles.input}
                required
              />
            </div>
            
            {error && <p style={styles.error}>{error}</p>}
            
            <button type="submit" style={styles.btn} disabled={loading}>
              {loading ? 'Guardando...' : 'Actualizar contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#fff', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  title: { margin: 0, fontSize: '18px', color: '#1a1a2e' },
  closeBtn: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#888' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '13px', color: '#555' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' },
  btn: { padding: '12px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', marginTop: '8px' },
  error: { color: '#e74c3c', fontSize: '13px', margin: 0 },
  success: { color: '#27ae60', fontSize: '15px', textAlign: 'center', padding: '2rem 0', fontWeight: '500' }
};
