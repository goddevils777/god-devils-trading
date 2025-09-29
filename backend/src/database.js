import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class Database {
    constructor() {
        this.db = null;
        this.init();
    }

    init() {
        const dbPath = process.env.NODE_ENV === 'production'
            ? '/app/data/signals.db'
            : join(__dirname, '..', 'signals.db');
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('❌ SQLite connection error:', err);
            } else {
                console.log('📦 SQLite database connected');
                this.createTables();
            }
        });
    }

    createTables() {
        const createSignalsTable = `
        CREATE TABLE IF NOT EXISTS signals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL CHECK(type IN ('long', 'short')),
            symbol TEXT NOT NULL DEFAULT 'UNKNOWN',
            price REAL NOT NULL DEFAULT 0,
            session TEXT NOT NULL DEFAULT 'Unknown',
            confidence INTEGER DEFAULT 75,
            signalNumber INTEGER DEFAULT 1,
            source TEXT DEFAULT 'TradingView',
            status TEXT DEFAULT 'new' CHECK(status IN ('new', 'active', 'closed')),
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;

        const createTradesTable = `
        CREATE TABLE IF NOT EXISTS trades (
            id INTEGER PRIMARY KEY,
            type TEXT NOT NULL CHECK(type IN ('long', 'short')),
            currency TEXT NOT NULL,
            date TEXT NOT NULL,
            result REAL NOT NULL,
            category TEXT,
            screenshotData TEXT,
            createdAt TEXT NOT NULL,
            groupId INTEGER,
            groupName TEXT
        )
    `;

        const createPublicSharesTable = `
        CREATE TABLE IF NOT EXISTS public_shares (
            shareId TEXT PRIMARY KEY,
            filters TEXT NOT NULL,
            trades TEXT NOT NULL,
            expiresAt TEXT NOT NULL,
            createdAt TEXT NOT NULL
        )
    `;

        this.db.run(createSignalsTable, (err) => {
            if (err) {
                console.error('❌ Error creating signals table:', err);
            } else {
                console.log('✅ Signals table ready');
            }
        });

        this.db.run(createTradesTable, (err) => {
            if (err) {
                console.error('❌ Error creating trades table:', err);
            } else {
                console.log('✅ Trades table ready');
            }
        });

        this.db.run(createPublicSharesTable, (err) => {
            if (err) {
                console.error('❌ Error creating public_shares table:', err);
            } else {
                console.log('✅ Public shares table ready');
            }
        });
    }

    saveSignal(signal) {
        return new Promise((resolve, reject) => {
            const query = `
    INSERT INTO signals (type, symbol, price, session, confidence, signalNumber, source, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

            const values = [
                signal.type,
                signal.symbol,
                signal.price,
                signal.session,
                signal.confidence,
                signal.signalNumber || 1,
                signal.source || 'TradingView',
                signal.status || 'new',
                new Date().toISOString()
            ];

            this.db.run(query, values, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, ...signal });
                }
            });
        });
    }

    getSignals(limit = 50) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM signals 
                ORDER BY createdAt DESC 
                LIMIT ?
            `;

            this.db.all(query, [limit], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    getSignalsByFilter(filter = {}) {
        return new Promise((resolve, reject) => {
            let query = 'SELECT * FROM signals WHERE 1=1';
            const values = [];

            if (filter.type) {
                query += ' AND type = ?';
                values.push(filter.type);
            }

            if (filter.session) {
                query += ' AND session = ?';
                values.push(filter.session);
            }

            if (filter.symbol) {
                query += ' AND symbol = ?';
                values.push(filter.symbol);
            }

            query += ' ORDER BY createdAt DESC LIMIT ?';
            values.push(filter.limit || 50);

            this.db.all(query, values, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }
    deleteSignal(signalId) {
        return new Promise((resolve, reject) => {
            const query = 'DELETE FROM signals WHERE id = ?';

            this.db.run(query, [signalId], function (err) {
                if (err) {
                    console.error('Database delete error:', err);
                    reject(err);
                } else {
                    console.log(`🗑️ Signal ${signalId} deleted, affected rows: ${this.changes}`);
                    resolve({ deletedRows: this.changes });
                }
            });
        });
    }

    saveTrade(trade) {
        return new Promise((resolve, reject) => {
            const query = `
            INSERT INTO trades (
                id, type, currency, date, result, category, 
                screenshotData, createdAt, groupId, groupName
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

            const values = [
                trade.id,
                trade.type,
                trade.currency,
                trade.date,
                trade.result,
                trade.category || null,
                trade.screenshotData || null,
                trade.createdAt,
                trade.groupId || null,
                trade.groupName || null
            ];

            this.db.run(query, values, function (err) {
                if (err) {
                    console.error('❌ Error saving trade:', err);
                    reject(err);
                } else {
                    console.log('✅ Trade saved to database:', trade.id);
                    resolve(trade);
                }
            });
        });
    }

    getTrades() {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM trades ORDER BY createdAt DESC';

            this.db.all(query, [], (err, rows) => {
                if (err) {
                    console.error('❌ Error getting trades:', err);
                    reject(err);
                } else {
                    console.log(`📊 Retrieved ${rows.length} trades from database`);
                    resolve(rows);
                }
            });
        });
    }

    deleteTrade(tradeId) {
        return new Promise((resolve, reject) => {
            const query = 'DELETE FROM trades WHERE id = ?';

            this.db.run(query, [tradeId], function (err) {
                if (err) {
                    console.error('❌ Error deleting trade:', err);
                    reject(err);
                } else {
                    console.log('🗑️ Trade deleted from database:', tradeId);
                    resolve({ deletedRows: this.changes });
                }
            });
        });
    }

    savePublicShare(shareData) {
        return new Promise((resolve, reject) => {
            const query = `
            INSERT INTO public_shares (shareId, filters, trades, expiresAt, createdAt)
            VALUES (?, ?, ?, ?, ?)
        `;

            const values = [
                shareData.shareId,
                JSON.stringify(shareData.filters),
                JSON.stringify(shareData.trades),
                shareData.expiresAt,
                shareData.createdAt
            ];

            this.db.run(query, values, function (err) {
                if (err) {
                    console.error('❌ Error saving public share:', err);
                    reject(err);
                } else {
                    console.log('✅ Public share saved:', shareData.shareId);
                    resolve(shareData);
                }
            });
        });
    }

    getPublicShare(shareId) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM public_shares WHERE shareId = ?';

            this.db.get(query, [shareId], (err, row) => {
                if (err) {
                    console.error('❌ Error getting public share:', err);
                    reject(err);
                } else if (row) {
                    // Парсим JSON данные обратно
                    const shareData = {
                        ...row,
                        filters: JSON.parse(row.filters),
                        trades: JSON.parse(row.trades)
                    };
                    resolve(shareData);
                } else {
                    resolve(null);
                }
            });
        });
    }

    deletePublicShare(shareId) {
        return new Promise((resolve, reject) => {
            const query = 'DELETE FROM public_shares WHERE shareId = ?';

            this.db.run(query, [shareId], function (err) {
                if (err) {
                    console.error('❌ Error deleting public share:', err);
                    reject(err);
                } else {
                    console.log('🗑️ Public share deleted:', shareId);
                    resolve({ deletedRows: this.changes });
                }
            });
        });
    }

    // Добавь этот метод в конец класса Database перед закрывающей скобкой:
    updateTrade(tradeId, updatedTrade) {
        return new Promise((resolve, reject) => {
            const query = `
            UPDATE trades SET 
                type = ?, currency = ?, date = ?, result = ?, 
                category = ?, screenshotData = ?, groupId = ?, groupName = ?
            WHERE id = ?
        `;

            const values = [
                updatedTrade.type,
                updatedTrade.currency,
                updatedTrade.date,
                updatedTrade.result,
                updatedTrade.category || null,
                updatedTrade.screenshotData || null,
                updatedTrade.groupId || null,
                updatedTrade.groupName || null,
                tradeId
            ];

            this.db.run(query, values, function (err) {
                if (err) {
                    console.error('❌ Error updating trade:', err);
                    reject(err);
                } else {
                    console.log('✅ Trade updated in database:', tradeId);
                    resolve({ changes: this.changes });
                }
            });
        });
    }
}



export const database = new Database();