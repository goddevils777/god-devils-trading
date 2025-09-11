import { WebSocketServer } from 'ws';

export class SignalsWebSocket {
    constructor(server) {
        this.server = server;
        this.wss = null;
        this.clients = new Set();
    }

    start() {
        this.wss = new WebSocketServer({ server: this.server });

        this.wss.on('connection', (ws, req) => {
            console.log('📱 New WebSocket connection');
            this.clients.add(ws);

            // Отправляем приветственное сообщение
            ws.send(JSON.stringify({
                type: 'connection',
                message: 'Connected to God & Devils signals',
                timestamp: new Date().toISOString()
            }));

            // Обработка сообщений от клиента
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    console.log('📨 Received:', message);

                    if (message.type === 'ping') {
                        ws.send(JSON.stringify({
                            type: 'pong',
                            timestamp: new Date().toISOString()
                        }));
                    }
                } catch (error) {
                    console.error('Error parsing message:', error);
                }
            });

            // Обработка отключения
            ws.on('close', () => {
                console.log('📱 WebSocket connection closed');
                this.clients.delete(ws);
            });

            // Обработка ошибок
            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                this.clients.delete(ws);
            });
        });

        console.log(`🚀 WebSocket server running on same port as HTTP`);
    }

    // Отправка сигнала всем подключенным клиентам
    broadcastSignal(signal) {
        const message = JSON.stringify({
            type: 'signal',
            data: {
                id: signal.id || Date.now().toString(),
                type: signal.type,
                createdAt: signal.createdAt || new Date().toISOString(),
                session: this.getCurrentSession(),
                status: 'new',
                symbol: signal.symbol || 'Unknown',
                ...signal
            }
        });

        let sentCount = 0;
        this.clients.forEach((client) => {
            if (client.readyState === 1) { // WebSocket.OPEN
                client.send(message);
                sentCount++;
            } else {
                this.clients.delete(client);
            }
        });

        console.log(`📡 Signal broadcasted to ${sentCount} clients`);
        return sentCount;
    }

    // Определение текущей торговой сессии
    getCurrentSession() {
        const now = new Date();
        const hour = now.getUTCHours() + 3; // GMT+3

        if (hour >= 10 && hour < 15) {
            return 'London';
        } else if (hour >= 15 && hour < 22) {
            return 'New York';
        } else {
            return 'Asian';
        }
    }

    // Тестовый метод для отправки сигнала
    sendTestSignal(type = 'long') {
        const signal = {
            type: type,
            symbol: 'EURUSD',
            price: 1.0950 + (Math.random() - 0.5) * 0.01,
            confidence: Math.floor(Math.random() * 30) + 70
        };

        return this.broadcastSignal(signal);
    }

    // Получение статистики подключений
    getStats() {
        return {
            connectedClients: this.clients.size,
            uptime: process.uptime()
        };
    }
}