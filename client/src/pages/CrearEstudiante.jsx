import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Button from '../components/atoms/Button'
import FeedbackMessage from '../components/atoms/FeedbackMessage'
import PasswordField from '../components/molecules/PasswordField'

export default function CrearEstudiante() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    correoInstitucional: '',
    password: '',
    carne: '',
    carrera: ''
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
      await api.post('/usuarios/estudiante', formData)
      alert('Estudiante creado exitosamente')
      navigate(-1)
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear estudiante')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="crm-page form-page">
      <main id="contenido-principal" className="form-card user-form-card">
        <p className="form-eyebrow">Administración de usuarios</p>
        <h1 className="form-title">Crear nuevo estudiante</h1>
        <p className="form-intro">Crea el acceso institucional y completa la información académica.</p>
        <FeedbackMessage>{error}</FeedbackMessage>
        <form onSubmit={handleSubmit} className="user-form" aria-busy={loading}>
          <div className="form-field">
            <label className="form-label" htmlFor="estudiante-nombre">Nombre completo *</label>
            <input id="estudiante-nombre" className="form-control" type="text" name="nombreCompleto" value={formData.nombreCompleto} onChange={handleChange} autoComplete="name" required />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="estudiante-correo">Correo institucional *</label>
            <input id="estudiante-correo" className="form-control" type="email" name="correoInstitucional" value={formData.correoInstitucional} onChange={handleChange} autoComplete="email" required />
          </div>
          <PasswordField id="estudiante-password" label="Contraseña" name="password" value={formData.password} onChange={handleChange} autoComplete="new-password" minLength={6} help="Usa al menos 6 caracteres." required />
          <div className="form-field">
            <label className="form-label" htmlFor="estudiante-carne">Carné *</label>
            <input id="estudiante-carne" className="form-control" type="text" name="carne" value={formData.carne} onChange={handleChange} required />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="estudiante-carrera">Carrera *</label>
            <input id="estudiante-carrera" className="form-control" type="text" name="carrera" value={formData.carrera} onChange={handleChange} required />
          </div>
          <div className="form-actions">
            <Button variant="secondary" onClick={() => navigate(-1)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Estudiante'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
