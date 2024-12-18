import express from 'express';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import config from '../config.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware para verificar el token
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).send({ error: 'No token provided' });

    jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(500).send({ error: 'Failed to authenticate token' });
        req.userId = decoded.id;
        next();
    });
};

/**
 * @route GET /api/transactions/balance
 * @desc Obtener el saldo del usuario
 * @access Privado
 * @returns {Object} - { balance: number }
 */
router.get('/balance', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }
        res.json({ balance: user.balance });
    } catch (error) {
        res.status(500).send({ error: 'Error al consultar el saldo', details: error.message });
    }
});

/**
 * @route POST /api/transactions/deposit
 * @desc Realizar un depósito en la cuenta del usuario
 * @access Privado
 * @param {number} amount - Monto a depositar
 * @returns {Object} - { balance: number }
 */
router.post('/deposit', verifyToken, async (req, res) => {
    const { amount } = req.body;

    // Validaciones
    if (amount === undefined) {
        return res.status(400).send({ error: 'El monto es requerido' });
    }
    if (typeof amount !== 'number') {
        return res.status(400).send({ error: 'El monto debe ser un número' });
    }
    if (amount <= 0) {
        return res.status(400).send({ error: 'El monto debe ser mayor que 0' });
    }

    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }
        user.balance += amount;
        await user.save();

        // Registrar la transacción
        const transaction = new Transaction({
            userId: user._id,
            type: 'deposit',
            amount: amount,
            date: new Date()
        });
        await transaction.save();

        res.json({ balance: user.balance });
    } catch (error) {
        res.status(500).send({ error: 'Error al realizar el depósito', details: error.message });
    }
});

/**
 * @route POST /api/transactions/withdraw
 * @desc Realizar un retiro de la cuenta del usuario
 * @access Privado
 * @param {number} amount - Monto a retirar
 * @returns {Object} - { balance: number }
 */
router.post('/withdraw', verifyToken, async (req, res) => {
    const { amount } = req.body;

    // Validaciones
    if (amount === undefined) {
        return res.status(400).send({ error: 'El monto es requerido' });
    }
    if (typeof amount !== 'number') {
        return res.status(400).send({ error: 'El monto debe ser un número' });
    }
    if (amount <= 0) {
        return res.status(400).send({ error: 'El monto debe ser mayor que 0' });
    }

    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }
        if (user.balance < amount) {
            return res.status(400).send({ error: 'Saldo insuficiente' });
        }
        user.balance -= amount;
        await user.save();

        // Registrar la transacción
        const transaction = new Transaction({
            userId: user._id,
            type: 'withdraw',
            amount: amount,
            dare: new Date()
        });
        await transaction.save();

        res.json({ balance: user.balance });
    } catch (error) {
        res.status(500).send({ error: 'Error al realizar el retiro', details: error.message });
    }
});

/**
 * @route GET /api/transactions/history
 * @desc Obtener el historial de transacciones del usuario
 * @access Privado
 * @returns {Array} - [{ userId: string, type: string, amount: number, date: Date }]
 */
router.get('/history', verifyToken, async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.userId }).sort({ date: -1 });
        res.json(transactions);
    } catch (error) {
        res.status(500).send({ error: 'Error al obtener el historial de transacciones', details: error.message });
    }
});

/**
 * @route POST /api/transactions/transfer
 * @desc Transferir un monto entre dos cuentas 
 * @access Privado
 * @returns {Array} - [{ message: 'Transfer successful', fromBalance: fromUser.balance, toBalance: toUser.balance }]
 */
router.post('/transfer', verifyToken, async (req, res) => {
    const { toUserId, amount } = req.body;

    if (!toUserId || !amount || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).send({ error: 'Invalid recipient or amount' });
    }

    try {
        const fromUser = await User.findById(req.userId);
        const toUser = await User.findById(toUserId);

        if (!fromUser || !toUser) {
            return res.status(404).send({ error: 'User not found' });
        }

        if (fromUser.balance < amount) {
            return res.status(400).send({ error: 'Insufficient funds' });
        }

        fromUser.balance -= amount;
        toUser.balance += amount;

        await fromUser.save();
        await toUser.save();

        const transfer = new Transfer({
            fromUserId: fromUser._id,
            toUserId: toUser._id,
            amount,
            date: new Date()
        });

        await transfer.save();

        res.json({ message: 'Transfer successful', fromBalance: fromUser.balance, toBalance: toUser.balance });
    } catch (error) {
        res.status(500).send({ error: 'Error processing transfer', details: error.message });
    }
});

router.get('/report', verifyToken, async (req, res) => {
    const { month, year } = req.query;

    if (!month || !year) {
        return res.status(400).send({ error: 'Month and year are required' });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    try {
        const transactions = await Transaction.find({
            userId: req.userId,
            date: {
                $gte: startDate,
                $lte: endDate
            }
        });

        const deposits = transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0);
        const withdrawals = transactions.filter(t => t.type === 'withdraw').reduce((sum, t) => sum + t.amount, 0);

        res.json({
            month,
            year,
            deposits,
            withdrawals,
            balance: deposits - withdrawals
        });
    } catch (error) {
        res.status(500).send({ error: 'Error generating report', details: error.message });
    }
});

export default router;