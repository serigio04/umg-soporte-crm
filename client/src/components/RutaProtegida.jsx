import { Navigate, Outlet } from 'react-router-dom';

/**
 * Componente que protege rutas según autenticación y rol de usuario.
 * 
 * @param {Object} props
 * @param {Array<string>} props.rolesPermitidos - Lista de roles permitidos para acceder a la ruta.
 */
export default function RutaProtegida({ rolesPermitidos }) {
  const token = localStorage.getItem('token');
  const usuarioRaw = localStorage.getItem('usuario');
  
  let usuario = null;
  try {
    usuario = usuarioRaw ? JSON.parse(usuarioRaw) : null;
  } catch (e) {
    console.error('Error parsing user data from localStorage', e);
  }

  // Si no está autenticado, redirigir al login
  if (!token || !usuario) {
    return <Navigate to="/login" replace />;
  }

  // Si se definieron roles permitidos y el usuario no cuenta con el rol necesario
  if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) {
    // Redirigir según su rol correspondiente para evitar bucles o bloqueos
    if (usuario.rol === 'Estudiante') {
      return <Navigate to="/estudiante/dashboard" replace />;
    } else if (usuario.rol === 'Agente' || usuario.rol === 'Coordinador') {
      return <Navigate to="/agente/dashboard" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }

  // Si pasa todas las validaciones, renderizar el componente de la ruta
  return <Outlet />;
}
