import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import Button from '../components/atoms/Button'
import FeedbackMessage from '../components/atoms/FeedbackMessage'
import FormField from '../components/molecules/FormField'
import PasswordField from '../components/molecules/PasswordField'

export default function Login() {
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { correo, password })
      localStorage.setItem('token', data.token)
      localStorage.setItem('usuario', JSON.stringify(data.usuario))

      const inicioPorRol = {
        Estudiante: '/estudiante/dashboard',
        Agente: '/agente/dashboard',
        Coordinador: '/coordinador/dashboard',
      }
      navigate(inicioPorRol[data.usuario.rol] || '/login', { replace: true })
    } catch {
      setError('No fue posible iniciar sesión. Verifica el correo y la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="crm-page auth-page" id="contenido-principal">
      <section className="form-card auth-card" aria-labelledby="login-title">
        <div className="form-card-accent" aria-hidden="true" />
        <p className="form-eyebrow">Mesa de ayuda</p>
        <h1 id="login-title" className="form-title">Sistema de Soporte UMG</h1>
        <p className="form-intro">Ingresa con tus credenciales institucionales para continuar.</p>
        {searchParams.get('sesion') === 'expirada' && (
          <FeedbackMessage>Tu sesión expiró. Inicia sesión nuevamente.</FeedbackMessage>
        )}
        <form onSubmit={handleLogin} aria-busy={loading}>
          <FormField id="correo" label="Correo institucional" required>
            <input
              id="correo"
              className="form-control"
              type="email"
              value={correo}
              onChange={e => setCorreo(e.target.value)}
              placeholder="correo@miumg.edu.gt"
              autoComplete="username"
              required
            />
          </FormField>
          <PasswordField
            id="password"
            label="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Contraseña"
            autoComplete="current-password"
            required
          />
          <FeedbackMessage>{error}</FeedbackMessage>
          <Button className="button-full" type="submit" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </Button>
        </form>
      </section>
    </main>
  )
}
