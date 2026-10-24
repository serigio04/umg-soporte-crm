import { useEffect, useEffectEvent, useRef, useState } from 'react'
import api from '../../services/api'
import socket, { getTicketSocket } from '../../services/socket'

function agregarMensaje(lista, mensaje) {
  if (lista.some(item => item.idMensaje === mensaje.idMensaje)) return lista
  return [...lista, mensaje].sort((a, b) => a.idMensaje - b.idMensaje)
}

export default function TicketChat({ idTicket, cerrado, usuario, onTicketUpdated }) {
  const [mensajes, setMensajes] = useState([])
  const [contenido, setContenido] = useState('')
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [estadoTiempoReal, setEstadoTiempoReal] = useState('Conectando...')
  const listaRef = useRef(null)
  const notificarActualizacion = useEffectEvent(payload => onTicketUpdated?.(payload))

  useEffect(() => {
    let activo = true

    api.get(`/tickets/${idTicket}/mensajes`)
      .then(({ data }) => {
        if (activo) setMensajes(actuales => data.reduce(agregarMensaje, actuales))
      })
      .catch(err => {
        if (activo) setError(err.response?.data?.message || 'No se pudo cargar la conversación')
      })
      .finally(() => {
        if (activo) setCargando(false)
      })

    function unirse() {
      socket.emit('ticket:join', { idTicket }, respuesta => {
        if (!activo) return
        setEstadoTiempoReal(respuesta?.ok ? 'Actualizaciones en tiempo real activas' : 'Actualización manual disponible')
      })
    }

    function recibirMensaje(mensaje) {
      if (Number(mensaje.idTicket) === Number(idTicket)) {
        setMensajes(actuales => agregarMensaje(actuales, mensaje))
      }
    }

    function recibirActualizacion(payload) {
      if (Number(payload.idTicket) === Number(idTicket)) notificarActualizacion(payload)
    }

    function conexionFallida() {
      setEstadoTiempoReal('Actualización manual disponible')
    }

    const ticketSocket = getTicketSocket()
    ticketSocket.on('connect', unirse)
    ticketSocket.on('connect_error', conexionFallida)
    ticketSocket.on('ticket:message', recibirMensaje)
    ticketSocket.on('ticket:updated', recibirActualizacion)
    if (ticketSocket.connected) unirse()

    return () => {
      activo = false
      ticketSocket.emit('ticket:leave', { idTicket })
      ticketSocket.off('connect', unirse)
      ticketSocket.off('connect_error', conexionFallida)
      ticketSocket.off('ticket:message', recibirMensaje)
      ticketSocket.off('ticket:updated', recibirActualizacion)
    }
  }, [idTicket])

  useEffect(() => {
    const lista = listaRef.current
    if (lista) lista.scrollTop = lista.scrollHeight
  }, [mensajes])

  async function enviarMensaje(event) {
    event.preventDefault()
    const mensaje = contenido.trim()
    if (!mensaje || cerrado || enviando) return

    setError('')
    setEnviando(true)
    try {
      const { data } = await api.post(`/tickets/${idTicket}/mensajes`, { contenido: mensaje })
      setMensajes(actuales => agregarMensaje(actuales, data))
      setContenido('')
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo enviar el mensaje')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="ticket-panel ticket-chat" aria-labelledby="ticket-chat-title">
      <div className="ticket-panel-heading">
        <div>
          <p className="ticket-panel-kicker">Conversación</p>
          <h2 id="ticket-chat-title">Chat del ticket</h2>
        </div>
        <span className="ticket-live-status" aria-live="polite">{estadoTiempoReal}</span>
      </div>

      {error && <p className="ticket-inline-error" role="alert">{error}</p>}

      <div className="ticket-message-list" ref={listaRef} aria-label="Mensajes del ticket" aria-live="polite">
        {cargando && <p className="ticket-chat-empty">Cargando conversación...</p>}
        {!cargando && mensajes.length === 0 && (
          <p className="ticket-chat-empty">Aún no hay mensajes. Inicia la conversación sobre este ticket.</p>
        )}
        {mensajes.map(mensaje => {
          const propio = Number(mensaje.autor.idUsuario) === Number(usuario?.idUsuario)
          return (
            <article className={`ticket-message${propio ? ' ticket-message-own' : ''}`} key={mensaje.idMensaje}>
              <div className="ticket-message-meta">
                <strong>{propio ? 'Tú' : mensaje.autor.nombreCompleto}</strong>
                <span>{mensaje.autor.rol}</span>
                <time dateTime={mensaje.fechaCreacion}>
                  {new Date(mensaje.fechaCreacion).toLocaleString('es-GT')}
                </time>
              </div>
              <p>{mensaje.contenido}</p>
            </article>
          )
        })}
      </div>

      {cerrado ? (
        <p className="ticket-chat-closed" role="status">Este ticket está cerrado. La conversación es de solo lectura.</p>
      ) : (
        <form className="ticket-chat-form" onSubmit={enviarMensaje}>
          <label htmlFor="ticket-message">Nuevo mensaje</label>
          <textarea
            id="ticket-message"
            value={contenido}
            onChange={event => setContenido(event.target.value)}
            placeholder="Escribe un mensaje claro y evita compartir datos sensibles."
            maxLength={4000}
            rows={3}
            disabled={enviando}
            required
          />
          <div className="ticket-chat-form-footer">
            <span>{contenido.length}/4000</span>
            <button type="submit" disabled={enviando || !contenido.trim()}>
              {enviando ? 'Enviando...' : 'Enviar mensaje'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
