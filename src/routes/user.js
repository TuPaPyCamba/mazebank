import express from 'express';
import authenticateToken from '../middlewares/authenticateToken.js'
import User from '../models/User.js'

const router = express.Router()

// Ruta para obtener datos del usuario (perfil)
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json({ user });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los datos del usuario', error })
    }
})

// Ruta para obtener datos del dashboard
router.get('/basicdata', authenticateToken, async (req, res) => {
    try {
        // Buscar al usuario autenticado en la base de datos usando el ID del token
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Seleccion de datos necesarios a enviar
        const { userName, name, email, profileImg, surnames: { paternal, maternal } } = user;

        res.json({
            user: { userName, name, email, profileImg, surnames: { paternal, maternal } }
        })
    } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
})

// Ruta para obtener datos del perfil
router.get('/profiledata', authenticateToken, async (req, res) => {
    try {
        // Buscar al usuario autenticado en la base de datos usando el ID del token
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Seleccion de datos necesarios a enviar
        const { userName, name, surnames: { paternal, maternal }, profileImg, email, phoneNumber, birthdate, placeOfBirth: { city, state, country }, address, rfc, occupation} = user;

        res.json({
            user : { userName, name, surnames: { paternal, maternal }, profileImg, email, phoneNumber, birthdate, placeOfBirth: { city, state, country }, address, rfc, occupation}
        })
    } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
})

router.get('/:id/name', authenticateToken, async (req, res) => {
    const userId = req.params.id

    try {
        // Buscar al usuario por su ID y seleccionar solo el campo "name"
        const user = await User.findById(userId).select('name');

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json({ name: user.name });
    } catch (error) {
        console.error('Error al obtener el nombre del usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
})

export default router