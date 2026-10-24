import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Button from '../components/atoms/Button'
import FeedbackMessage from '../components/atoms/FeedbackMessage'
import PasswordField from '../components/molecules/PasswordField'

export default function CrearAgente() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    correoInstitucional: '',
    password: '',
    especialidad: 'General',
    nivelAcceso: 2,
    sedeAsignada: 'Campus Central'
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/usuarios/agente', formData)
      alert('Agente creado exitosamente')
      navigate(-1)
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear agente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="crm-page form-page">
      <main id="contenido-principal" className="form-card user-form-card">
        <p className="form-eyebrow">Administración de usuarios</p>
        <h1 className="form-title">Crear nuevo agente</h1>
        <p className="form-intro">Registra los datos y permisos iniciales del integrante del equipo.</p>
        <FeedbackMessage>{error}</FeedbackMessage>
        <form onSubmit={handleSubmit} className="user-form" aria-busy={loading}>
          <div className="form-field">
            <label className="form-label" htmlFor="agente-nombre">Nombre completo *</label>
            <input id="agente-nombre" className="form-control" type="text" name="nombreCompleto" value={formData.nombreCompleto} onChange={handleChange} autoComplete="name" required />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="agente-correo">Correo institucional *</label>
            <input id="agente-correo" className="form-control" type="email" name="correoInstitucional" value={formData.correoInstitucional} onChange={handleChange} autoComplete="email" required />
          </div>
          <PasswordField id="agente-password" label="Contraseña" name="password" value={formData.password} onChange={handleChange} autoComplete="new-password" minLength={6} help="Usa al menos 6 caracteres." required />
          <div className="form-field">
            <label className="form-label" htmlFor="agente-especialidad">Especialidad *</label>
            <select id="agente-especialidad" className="form-control" name="especialidad" value={formData.especialidad} onChange={handleChange} required>
              <option value="General">General (Coordinador)</option>
              <option value="Incidente">Incidente</option>
              <option value="Solicitud">Solicitud</option>
              <option value="Cambio">Cambio</option>
            </select>
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="agente-nivel">Nivel de acceso *</label>
            <select id="agente-nivel" className="form-control" name="nivelAcceso" value={formData.nivelAcceso} onChange={handleChange} required>
              <option value={1}>1 - Básico</option>
              <option value={2}>2 - Medio</option>
              <option value={3}>3 - Coordinador</option>
            </select>
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="agente-sede">Sede asignada *</label>
            <input id="agente-sede" className="form-control" type="text" name="sedeAsignada" value={formData.sedeAsignada} onChange={handleChange} required />
          </div>
          <div className="form-actions">
            <Button variant="secondary" onClick={() => navigate(-1)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Agente'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
