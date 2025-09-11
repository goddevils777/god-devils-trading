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

        this.db.run(createSignalsTable, (err) => {
            if (err) {
                console.error('❌ Error creating signals table:', err);
            } else {
                console.log('✅ Signals table ready');
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
}

export const database = new Database();