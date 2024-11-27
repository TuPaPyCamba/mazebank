import jwt from 'jsonwebtoken'
import config from '../config.js'

// middleware de autenticación para leer el token de la cookie
const authenticateToken = (req, res, next) => {
    const token = req.cookies.token // Obtiene el token desde la cookie

    if (!token) {
        return res.status(401).json({ message: "Acceso denegado" })
    }

    jwt.verify(token, config.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: "Token no válido" })
        req.user = user // añade el usuario autenticado a la solicitud
        next()
    })
}

export default authenticateToken