const jwt = require('jsonwebtoken')
const config = require('../config')

const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1] // Extraer el token del header 'Authorization'

    if (!token) {
        return res.sendStatus(401) // No autorizado si no hay token
    }

    jwt.verify(token, config.JWT_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403) // Prohibido si el token no es válido
        }
        req.user = user; // Almacenar la información del usuario en req.user
        next() // Llamar al siguiente middleware o ruta
    })
}

module.exports = authenticateToken