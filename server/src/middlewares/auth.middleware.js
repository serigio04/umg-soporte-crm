const jwt = require('jsonwebtoken')
const { pool } = require('../config/db')

function verificarToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1] // Bearer <token>

    if (!token)
        return res.status(401).json({ message: 'Token requerido' })

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = payload; // { idUsuario, rol }
        //console.log('Token verificado, payload:', payload);
        next()
    } catch (error) {
        if (error.name === 'TokenExpiredError')
            return res.status(401).json({ message: 'Token expirado' })
        res.status(403).json({ message: 'Token inválido' })
    }
}

function soloRol(...roles) {
    return (req, res, next) => {
        //console.log('Verificando rol del usuario:', req.usuario);
        //console.log('Roles permitidos para esta ruta:', roles);
        if (!roles.includes(req.usuario.rol))
        return res.status(403).json({ message: 'No tienes permiso para esto' })
        next()
    }
}

async function agentePropioOCoordinador(req, res, next) {
    if (req.usuario.rol === 'Coordinador') return next()
    if (req.usuario.rol !== 'Agente')
        return res.status(403).json({ message: 'No tienes permiso para esto' })

    const idAgente = Number(req.params.idAgente)
    if (!Number.isInteger(idAgente) || idAgente <= 0)
        return res.status(400).json({ message: 'ID de agente inválido' })

    try {
        const result = await pool.query(
            'SELECT 1 FROM agentes WHERE idagente = $1 AND idusuario = $2',
            [idAgente, req.usuario.idUsuario]
        )
        if (result.rows.length === 0)
            return res.status(403).json({ message: 'No puedes consultar información de otro agente' })
        next()
    } catch (error) {
        next(error)
    }
}

module.exports = { verificarToken, soloRol, agentePropioOCoordinador }
