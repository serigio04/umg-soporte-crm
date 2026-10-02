import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

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
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Crear Nuevo Estudiante</h2>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Nombre Completo</label>
            <input type="text" name="nombreCompleto" value={formData.nombreCompleto} onChange={handleChange} required style={styles.input} />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Correo Institucional</label>
            <input type="email" name="correoInstitucional" value={formData.correoInstitucional} onChange={handleChange} required style={styles.input} />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Contraseña</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength={6} style={styles.input} />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Carné</label>
            <input type="text" name="carne" value={formData.carne} onChange={handleChange} required style={styles.input} />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Carrera</label>
            <input type="text" name="carrera" value={formData.carrera} onChange={handleChange} required style={styles.input} />
          </div>
          <div style={styles.btnGroup}>
            <button type="button" onClick={() => navigate(-1)} style={styles.cancelBtn}>Cancelar</button>
            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? 'Creando...' : 'Crear Estudiante'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f4f4', padding: '20px' },
  card: { background: '#fff', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '500px' },
  title: { fontSize: '1.25rem', color: '#1a1a2e', marginBottom: '1.5rem', textAlign: 'center' },
  error: { background: '#fdecea', color: '#e74c3c', padding: '10px', borderRadius: '8px', marginBottom: '1rem', fontSize: '14px', textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '13px', color: '#555', fontWeight: '500' },
  input: { padding: '10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '14px' },
  btnGroup: { display: 'flex', gap: '10px', marginTop: '1rem' },
  submitBtn: { flex: 1, padding: '12px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' },
  cancelBtn: { flex: 1, padding: '12px', background: '#f0f0f0', color: '#333', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }
}
