import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardEstudiante from './pages/DashboardEstudiante';
import CrearTicket from './pages/CrearTicket';
import HistorialTickets from './pages/HistorialTickets';
import DashboardAgente from './pages/DashboardAgente';
import TicketsAsignados from './pages/TicketsAsignados';
import DetalleTicket from './pages/DetalleTicket';
import HistorialTicketsAgente from './pages/HistorialTicketsAgente';

// Importar nuevos componentes para Base de Conocimiento y Seguridad
import RutaProtegida from './components/RutaProtegida';
import PreguntasFrecuentes from './pages/PreguntasFrecuentes';
import GestionConocimiento from './pages/GestionConocimiento';

// Importar componentes agregados por el equipo
import CrearAgente from './pages/CrearAgente';
import CrearEstudiante from './pages/CrearEstudiante';
import DashboardCoordinador from './pages/DashboardCoordinador';
import TicketsCoordinador from './pages/HistorialTicketsCoordinador';
import EncuestaTicket from './pages/EncuestaTicket';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />

        {/* Rutas Protegidas para Estudiante */}
        <Route element={<RutaProtegida rolesPermitidos={['Estudiante']} />}>
          <Route path="/estudiante/dashboard" element={<DashboardEstudiante />} />
          <Route path="/estudiante/tickets" element={<HistorialTickets />} />
          <Route path="/preguntas-frecuentes" element={<PreguntasFrecuentes />} />
          <Route path="/encuesta/ticket/:idTicket" element={<EncuestaTicket />} />
        </Route>

        {/* Rutas Protegidas para Agente / Coordinador */}
        <Route element={<RutaProtegida rolesPermitidos={['Agente', 'Coordinador']} />}>
          <Route path="/agente/dashboard" element={<DashboardAgente />} />
          <Route path="/agente/tickets" element={<TicketsAsignados />} />
          <Route path="/agente/tickets/historial" element={<HistorialTicketsAgente />} />
          <Route path="/agente/conocimiento" element={<GestionConocimiento />} />
          <Route path="/agente/crear-agente" element={<CrearAgente />} />
          <Route path="/agente/crear-estudiante" element={<CrearEstudiante />} />
        </Route>

        {/* Rutas Protegidas únicamente para Coordinador */}
        <Route element={<RutaProtegida rolesPermitidos={['Coordinador']} />}>
          <Route path="/coordinador/dashboard" element={<DashboardCoordinador />} />
          <Route path="/coordinador/tickets" element={<TicketsCoordinador />} />
        </Route>

        {/* Rutas Compartidas Autenticadas (ambos roles pueden crear/ver detalles de tickets) */}
        <Route element={<RutaProtegida rolesPermitidos={['Estudiante', 'Agente', 'Coordinador']} />}>
          <Route path="/tickets/nuevo" element={<CrearTicket />} />
          <Route path="/tickets/:idTicket" element={<DetalleTicket />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App;
