import { useEffect, useRef, useState } from 'react';
import api from '../services/api';
import Button from './atoms/Button';
import FeedbackMessage from './atoms/FeedbackMessage';
import Icon from './atoms/Icon';
import PasswordField from './molecules/PasswordField';

export default function CambiarPassword({ onClose }) {
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const modalRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const closeTimerRef = useRef(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const modal = modalRef.current;
    const focusables = () => Array.from(modal?.querySelectorAll('button, input, [tabindex]:not([tabindex="-1"])') || []);

    focusables()[0]?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCloseRef.current();
      if (event.key !== 'Tab') return;
      const elements = focusables();
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(closeTimerRef.current);
      previousFocus?.focus();
    };
  }, []);

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
      closeTimerRef.current = setTimeout(() => onCloseRef.current(), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="password-dialog-title" className="modal-card password-dialog">
        <div className="modal-header">
          <div>
            <p className="form-eyebrow">Seguridad de la cuenta</p>
            <h2 id="password-dialog-title" className="modal-title">Cambiar contraseña</h2>
          </div>
          <Button variant="ghost" size="icon" aria-label="Cerrar cambio de contraseña" onClick={onClose}>
            <Icon name="close" />
          </Button>
        </div>
        
        {success ? (
          <FeedbackMessage type="success">{success}</FeedbackMessage>
        ) : (
          <form onSubmit={handleSubmit} className="password-form" aria-busy={loading}>
            <PasswordField id="password-actual" label="Contraseña actual" value={passwordActual} onChange={e => setPasswordActual(e.target.value)} autoComplete="current-password" required />
            <PasswordField id="password-nueva" label="Nueva contraseña" value={passwordNueva} onChange={e => setPasswordNueva(e.target.value)} autoComplete="new-password" required />
            <PasswordField id="password-confirmacion" label="Confirmar nueva contraseña" value={confirmarPassword} onChange={e => setConfirmarPassword(e.target.value)} autoComplete="new-password" required />
            
            <FeedbackMessage>{error}</FeedbackMessage>
            
            <Button className="button-full" type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Actualizar contraseña'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
