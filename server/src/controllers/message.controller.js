const messageService = require('../services/message.service')

async function listar(req, res) {
  try {
    const idTicket = validarIdTicket(req.params.idTicket)
    const mensajes = await messageService.listar(idTicket, req.usuario)
    res.json(mensajes)
  } catch (error) {
    responderError(error, res)
  }
}

async function enviar(req, res) {
  try {
    const idTicket = validarIdTicket(req.params.idTicket)
    const mensaje = await messageService.enviar(idTicket, req.body.contenido, req.usuario)
    res.status(201).json(mensaje)
  } catch (error) {
    responderError(error, res)
  }
}

function responderError(error, res) {
  if (error.message === 'ID_TICKET_INVALIDO') return res.status(400).json({ message: 'ID de ticket inválido' })
  if (error.message === 'TICKET_NO_ENCONTRADO') return res.status(404).json({ message: 'Ticket no encontrado' })
  if (error.message === 'TICKET_CERRADO') return res.status(409).json({ message: 'El ticket cerrado es de solo lectura' })
  if (error.message === 'MENSAJE_INVALIDO') return res.status(400).json({ message: 'El mensaje debe contener entre 1 y 4000 caracteres' })
  console.error('Error en chat:', error)
  res.status(500).json({ message: 'Error interno' })
}

function validarIdTicket(valor) {
  const idTicket = Number(valor)
  if (!Number.isInteger(idTicket) || idTicket <= 0) throw new Error('ID_TICKET_INVALIDO')
  return idTicket
}

module.exports = { listar, enviar }
