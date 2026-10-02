import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

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
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Crear Nuevo Agente</h2>
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
            <label style={styles.label}>Especialidad</label>
            <select name="especialidad" value={formData.especialidad} onChange={handleChange} required style={styles.input}>
              <option value="General">General (Coordinador)</option>
              <option value="Incidente">Incidente</option>
              <option value="Solicitud">Solicitud</option>
              <option value="Cambio">Cambio</option>
            </select>
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Nivel de Acceso</label>
            <select name="nivelAcceso" value={formData.nivelAcceso} onChange={handleChange} required style={styles.input}>
              <option value={1}>1 - Básico</option>
              <option value={2}>2 - Medio</option>
              <option value={3}>3 - Coordinador</option>
            </select>
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Sede Asignada</label>
            <input type="text" name="sedeAsignada" value={formData.sedeAsignada} onChange={handleChange} required style={styles.input} />
          </div>
          <div style={styles.btnGroup}>
            <button type="button" onClick={() => navigate(-1)} style={styles.cancelBtn}>Cancelar</button>
            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? 'Creando...' : 'Crear Agente'}
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
