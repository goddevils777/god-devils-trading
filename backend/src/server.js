import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { SignalsWebSocket } from './websocket.js';
import { database } from './database.js';
import { createServer } from 'http';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const server = createServer(app);  // Перемести сюда после создания app
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'https://god-devils-trading.netlify.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Логирование всех запросов
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Rate limiting - увеличенные лимиты для разработки
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5000 // увеличено с 100 до 1000 запросов
});
app.use('/api/', limiter);

// Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: '😇 God & Devils 😈 API is running' });
});

// Тестовый роут для отладки
app.get('/api/trades-test', (req, res) => {
    console.log('Trades test route hit!');
    res.json({ message: 'Trades test route works!' });
});

// Auth routes
import authRoutes from './routes/auth.js';
app.use('/api/auth', authRoutes);

// Signals routes
import signalsRoutes from './routes/signals.js';
app.use('/api/signals', signalsRoutes);

// Trades routes - с отладкой

import tradesRoutes from './routes/trades.js';
app.use('/api/trades', tradesRoutes);


// Тестовый роут для отправки сигнала
app.post('/api/test-signal', (req, res) => {
    const { type = 'long' } = req.body;
    const sentCount = global.signalsWS.sendTestSignal(type);
    res.json({
        message: 'Test signal sent',
        type,
        sentTo: sentCount,
        timestamp: new Date().toISOString()
    });
});

app.get('/api/test-signal', (req, res) => {
    const sentCount = global.signalsWS.sendTestSignal('long');
    res.json({
        message: 'Test LONG signal sent via GET',
        type: 'long',
        sentTo: sentCount,
        timestamp: new Date().toISOString()
    });
});



// Роут для получения сигналов от TradingView (webhook)
app.post('/api/signal', async (req, res) => {
    try {
        const { type, symbol, price, session, confidence } = req.body;

        if (!type || !['long', 'short'].includes(type.toLowerCase())) {
            return res.status(400).json({ error: 'Invalid signal type' });
        }

        const signal = {
            type: type.toLowerCase(),
            symbol: symbol || 'UNKNOWN',
            price: price || 0,
            session: session || 'Unknown',
            confidence: confidence || 75,
            signalNumber: req.body.signalNumber || 1,
            source: 'TradingView'
        };

        const savedSignal = await database.saveSignal(signal);
        const sentCount = global.signalsWS.broadcastSignal(savedSignal);

        console.log(`🔔 Signal from TradingView:`, signal);
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

// Добавь этот роут после существующих API роутов
app.post('/api/screenshot/download', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url || !url.includes('tradingview.com')) {
            return res.status(400).json({ error: 'Invalid TradingView URL' });
        }

        console.log('📸 Загружаем скриншот:', url);

        // Конвертируем TradingView URL
        let imageUrl = url;
        if (url.includes('/x/')) {
            const match = url.match(/\/x\/([^\/]+)/);
            if (match) {
                const chartId = match[1];
                imageUrl = `https://www.tradingview.com/x/${chartId}/chart.png`;
            }
        }

        // Загружаем изображение
        const response = await fetch(imageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'image/*',
                'Referer': 'https://www.tradingview.com/',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Конвертируем в base64
        const buffer = await response.buffer();
        const base64 = `data:${response.headers.get('content-type')};base64,${buffer.toString('base64')}`;

        console.log('✅ Скриншот загружен, размер:', buffer.length, 'байт');

        res.json({
            success: true,
            data: {
                originalUrl: url,
                imageUrl: imageUrl,
                base64: base64,
                timestamp: new Date().toISOString(),
                size: buffer.length
            }
        });

    } catch (error) {
        console.error('❌ Ошибка загрузки скриншота:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to download screenshot',
            message: error.message
        });
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});





// WebSocket сервер для сигналов
const signalsWS = new SignalsWebSocket(server);

// 404 handler - ДОЛЖЕН БЫТЬ ПОСЛЕДНИМ
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

signalsWS.start();

// Глобальный объект для доступа к WebSocket из других модулей
global.signalsWS = signalsWS;

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 API available at http://localhost:${PORT}/api`);
    console.log(`🔌 WebSocket server running on same port`);
});