import express from 'express';
import User from '../models/User.js';
import 'colors';
import authenticateToken from '../middlewares/authenticateToken.js';

const router = express.Router();

router.put('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body

        // Validar que ambos campos estén presentes
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Se requieren la contraseña actual y la nueva contraseña.' });
        }

        // Obtener el usuario autenticado a través del token
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // Verificar la contraseña actual
        const isPasswordCorrect = await user.comparePassword(currentPassword);
        if (!isPasswordCorrect) {
            console.log(`SERVER: `.green + `Se ha intentado actualizar la Contraseña de la cuenta: ` + `${req.user.id}\n`.blue + `Error: Contraseña Incorrecta \n`.red)
            return res.status(401).json({ message: 'La contraseña actual es incorrecta.' });
        }

        // Verificar que la nueva contraseña sea diferente a la actual
        if (await user.comparePassword(newPassword)) {
            return res.status(400).json({ message: 'La nueva contraseña no puede ser igual a la actual.' });
        }

        // Verificar que la nueva constraseña cumpla con algunos estandares
        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 8 caracteres.' });
        }

        // Actualizar la contraseña (se encripta automáticamente con el middleware `pre('save')`)
        user.password = newPassword;

        await user.save();

        res.json({ message: 'Contraseña actualizada con éxito.' });
        console.log(`SERVER: `.green + `Se actualizo la contraseña de la cuenta: `+ `${req.user.id}\n`.blue )

    } catch (error) {
        console.error('Error al cambiar la contraseña:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
})

export default router