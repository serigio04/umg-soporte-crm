import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function Login() {
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    try {
      const { data } = await api.post('/auth/login', { correo, password })
      localStorage.setItem('token', data.token)
      localStorage.setItem('usuario', JSON.stringify(data.usuario))

      // Redirige según el rol
      if (data.usuario.rol === 'Estudiante') navigate('/estudiante/dashboard')
      if (data.usuario.rol === 'Coordinador') {
        navigate('/coordinador/dashboard')
      } else if (data.usuario.rol === 'Agente') {
        navigate('/agente/dashboard')
      } else {
        navigate('/estudiante/dashboard')
      }
    } catch (err) {
      setError('Correo o contraseña incorrectos', + err)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Sistema de Soporte UMG</h2>
        <form onSubmit={handleLogin}>
          <div style={styles.field}>
            <label style={styles.label}>Correo institucional</label>
            <input
              style={styles.input}
              type="email"
              value={correo}
              onChange={e => setCorreo(e.target.value)}
              placeholder="correo@miumg.edu.gt"
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Contraseña</label>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.btn} type="submit">Iniciar sesión</button>
        </form>
      </div>
    </div>
  )
}

const styles = {
    container: { 
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f4f4' 
    },
    card: { 
        background: '#fff', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' 
    },
    title: { 
        textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.2rem', color: '#1a1a2e' 
    },
    field: { 
        marginBottom: '1rem' 
    },
    label: { 
        display: 'block', fontSize: '13px', marginBottom: '4px', color: '#555' 
    },
    input: { 
        width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' 
    },
    error: { 
        color: '#c0392b', fontSize: '13px', marginBottom: '1rem' 
    },
    btn: { 
        width: '100%', padding: '11px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' 
    }
}