import express from 'express';
import { database } from '../database.js';

const router = express.Router();

// Получить все сделки
router.get('/', async (req, res) => {
    try {
        const trades = await database.getTrades();
        res.json(trades);
    } catch (error) {
        console.error('Error fetching trades:', error);
        res.status(500).json({ error: 'Failed to fetch trades' });
    }
});

// Сохранить сделку
router.post('/', async (req, res) => {
    try {
        const trade = await database.saveTrade(req.body);
        res.json(trade);
    } catch (error) {
        console.error('Error saving trade:', error);
        res.status(500).json({ error: 'Failed to save trade' });
    }
});

// Удалить сделку
router.delete('/:id', async (req, res) => {
    try {
        await database.deleteTrade(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting trade:', error);
        res.status(500).json({ error: 'Failed to delete trade' });
    }
});

// Создание публичной ссылки
router.post('/share', async (req, res) => {
    try {
        const { filters, trades, expiresAt } = req.body;

        // Генерируем уникальный ID для ссылки
        const shareId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

        const shareData = {
            shareId,
            filters,
            trades,
            expiresAt,
            createdAt: new Date().toISOString()
        };

        // Сохраняем в базу данных
        const savedShare = await database.savePublicShare(shareData);

        res.json({
            success: true,
            shareId: shareId,
            expiresAt: expiresAt
        });

    } catch (error) {
        console.error('Error creating public share:', error);
        res.status(500).json({ error: 'Failed to create public share' });
    }
});

// Получение публичной ссылки
router.get('/share/:shareId', async (req, res) => {
    try {
        const { shareId } = req.params;

        const shareData = await database.getPublicShare(shareId);

        if (!shareData) {
            return res.status(404).json({ error: 'Share not found' });
        }

        // Проверяем срок действия
        if (new Date() > new Date(shareData.expiresAt)) {
            await database.deletePublicShare(shareId);
            return res.status(410).json({ error: 'Share expired' });
        }

        res.json({
            success: true,
            data: shareData
        });

    } catch (error) {
        console.error('Error fetching public share:', error);
        res.status(500).json({ error: 'Failed to fetch share' });
    }
});

export default router;