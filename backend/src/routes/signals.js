import express from 'express';
import { database } from '../database.js';

const router = express.Router();

// Получение сигналов из базы данных
router.get('/', async (req, res) => {
    try {
        const { type, session, symbol, limit = 50 } = req.query;
        
        const filter = {};
        if (type) filter.type = type;
        if (session) filter.session = session;
        if (symbol) filter.symbol = symbol;
        filter.limit = parseInt(limit);

        const signals = await database.getSignalsByFilter(filter);
        
        res.json({
            success: true,
            count: signals.length,
            signals: signals
        });

    } catch (error) {
        console.error('Error fetching signals:', error);
        res.status(500).json({ error: 'Failed to fetch signals' });
    }
});

// Статистика сигналов
router.get('/stats', async (req, res) => {
    try {
        const allSignals = await database.getSignals(1000);
        
        const stats = {
            total: allSignals.length,
            long: allSignals.filter(s => s.type === 'long').length,
            short: allSignals.filter(s => s.type === 'short').length,
            sessions: {
                london: allSignals.filter(s => s.session === 'London').length,
                newYork: allSignals.filter(s => s.session === 'New York').length,
                other: allSignals.filter(s => !['London', 'New York'].includes(s.session)).length
            },
            lastSignal: allSignals[0] || null
        };

        res.json(stats);

    } catch (error) {
        console.error('Error fetching signal stats:', error);
        res.status(500).json({ error: 'Failed to fetch signal stats' });
    }
});

// Создание нового сигнала (от TradingView)
router.post('/', async (req, res) => {
    try {
        const { type, symbol, price, session, confidence } = req.body;
        
        // Валидация сигнала
        if (!type || !['long', 'short'].includes(type.toLowerCase())) {
            return res.status(400).json({ error: 'Invalid signal type' });
        }

        // Создаем объект сигнала
        const signal = {
            type: type.toLowerCase(),
            symbol: symbol || 'UNKNOWN',
            price: price || 0,
            session: session || 'Unknown',
            confidence: confidence || 75,
            signalNumber: req.body.signalNumber || 1,
            source: 'TradingView',
            timestamp: new Date().toISOString()
        };

        // Сохраняем сигнал в базу данных
        const savedSignal = await database.saveSignal(signal);
        console.log(`💾 Signal saved to database:`, savedSignal);

        // Отправляем сигнал всем подключенным клиентам через WebSocket
        const sentCount = global.signalsWS.broadcastSignal(savedSignal);

        console.log(`🔔 Signal received from TradingView:`, signal);
        console.log(`📡 Broadcasted to ${sentCount} clients`);

        res.json({ 
            status: 'success',
            message: 'Signal received and broadcasted',
            signal: savedSignal,
            clientsNotified: sentCount
        });

    } catch (error) {
        console.error('Error processing signal:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Удаление сигнала
router.delete('/:id', async (req, res) => {
    try {
        const signalId = req.params.id;
        
        // Проверяем что сигнал существует
        const signals = await database.getSignals(1000);
        const signalExists = signals.find(s => s.id == signalId);
        
        if (!signalExists) {
            return res.status(404).json({ error: 'Signal not found' });
        }
        
        // Удаляем из базы данных
        await database.deleteSignal(signalId);
        
        res.json({ 
            success: true,
            message: 'Signal deleted successfully' 
        });
        
    } catch (error) {
        console.error('Error deleting signal:', error);
        res.status(500).json({ error: 'Failed to delete signal' });
    }
});

export default router;