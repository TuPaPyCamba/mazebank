import jwt from 'jsonwebtoken'
import config from '../config.js';

const checkAuth = (req, res, next) => {
    console.log("Cookies recibidas:", req.cookies); // Ver las cookies recibidas
    const token = req.cookies.token;

    if (!token) {
        console.log("No se encontró el token");
        return res.status(401).json({ message: "Acceso denegado" });
    }

    jwt.verify(token, config.JWT_SECRET, (err, user) => {
        if (err) {
            console.log("Error al verificar el token:", err);
            return res.status(403).json({ message: "Token no válido" });
        }
        req.user = user;
        console.log("Usuario autenticado:", req.user);
        next();
    });
};

export default checkAuth