import './dashboard.css';
import { BacktestModule } from '../backtest/backtest.js';

export class DashboardModule {
    constructor() {
        this.apiUrl = 'https://god-devils-trade.fly.dev/api';
        this.stats = null;
        this.backtestModule = new BacktestModule();
    }

    async render() {
        await this.loadStats();
        await this.backtestModule.loadTrades(); // Загружаем сделки
        const backtestStats = this.backtestModule.getBacktestStats();
        
        return `
            <div class="dashboard-container">
                <div class="dashboard-header">
                    <h1>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" class="dashboard-icon">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
                            <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="2"/>
                            <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="2"/>
                            <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2"/>
                            <path d="M8 14l2 2 4-4" stroke="#0ecb81" stroke-width="2" fill="none"/>
                        </svg>
                        Dashboard
                    </h1>
                    <div class="last-update">
                        Обновлено: ${new Date().toLocaleString('ru-RU')}
                    </div>
                </div>
                
                <!-- Статистика сигналов -->
                <h3 style="color: var(--text-primary); margin-bottom: 16px;">📡 Статистика сигналов</h3>
                <div class="stats-grid">
                    <div class="stat-card total">
                        <div class="stat-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                <path d="M3 13h4l3-8 4 16 3-8h4" stroke="currentColor" stroke-width="2"/>
                            </svg>
                        </div>
                        <div class="stat-content">
                            <div class="stat-number">${this.stats?.total || 0}</div>
                            <div class="stat-label">Всего сигналов</div>
                        </div>
                    </div>
                    
                    <div class="stat-card long">
                        <div class="stat-icon">😇</div>
                        <div class="stat-content">
                            <div class="stat-number">${this.stats?.long || 0}</div>
                            <div class="stat-label">Long сигналы</div>
                            <div class="stat-percentage">${this.getPercentage('long')}%</div>
                        </div>
                    </div>
                    
                    <div class="stat-card short">
                        <div class="stat-icon">😈</div>
                        <div class="stat-content">
                            <div class="stat-number">${this.stats?.short || 0}</div>
                            <div class="stat-label">Short сигналы</div>
                            <div class="stat-percentage">${this.getPercentage('short')}%</div>
                        </div>
                    </div>
                    
                    <div class="stat-card sessions">
                        <div class="stat-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2"/>
                            </svg>
                        </div>
                        <div class="stat-content">
                            <div class="stat-label">Последний сигнал</div>
                            <div class="session-breakdown">
                                ${this.renderLastSignalInfo()}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Статистика backtest -->
                <h3 style="color: var(--text-primary); margin: 32px 0 16px 0;">📊 Статистика торговли</h3>
                <div class="stats-grid">
                    <div class="stat-card total">
                        <div class="stat-icon">📈</div>
                        <div class="stat-content">
                            <div class="stat-number">${backtestStats.totalTrades}</div>
                            <div class="stat-label">Всего сделок</div>
                        </div>
                    </div>
                    
                    <div class="stat-card ${backtestStats.winRate >= 50 ? 'long' : 'short'}">
                        <div class="stat-icon">${backtestStats.winRate >= 50 ? '✅' : '📉'}</div>
                        <div class="stat-content">
                            <div class="stat-number">${backtestStats.winRate}%</div>
                            <div class="stat-label">Win Rate</div>
                            <div class="stat-percentage">${backtestStats.winTrades}W / ${backtestStats.lossTrades}L</div>
                        </div>
                    </div>
                    
                    <div class="stat-card ${backtestStats.totalPnL >= 0 ? 'long' : 'short'}">
                        <div class="stat-icon">${backtestStats.totalPnL >= 0 ? '💰' : '💸'}</div>
                        <div class="stat-content">
                            <div class="stat-number">${backtestStats.totalPnL > 0 ? '+' : ''}${backtestStats.totalPnL}</div>
                            <div class="stat-label">Общий P&L</div>
                            <div class="stat-percentage">RR ${backtestStats.totalPnL > 0 ? '+' : ''}${backtestStats.totalPnL}</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">🔥</div>
                        <div class="stat-content">
                            <div class="stat-label">Макс. серии</div>
                            <div class="session-breakdown">
                                <div class="session-item">
                                    <span>Прибыльных:</span>
                                    <span style="color: var(--green-primary);">${backtestStats.maxWinStreak}</span>
                                </div>
                                <div class="session-item">
                                    <span>Убыточных:</span>
                                    <span style="color: var(--red-primary);">${backtestStats.maxLossStreak}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async loadStats() {
        try {
            const response = await fetch(`${this.apiUrl}/signals/stats`);
            this.stats = await response.json();
            console.log('📊 Dashboard stats loaded:', this.stats);
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            this.stats = { total: 0, long: 0, short: 0, sessions: {} };
        }
    }

    getPercentage(type) {
        if (!this.stats || this.stats.total === 0) return 0;
        return Math.round((this.stats[type] / this.stats.total) * 100);
    }

    renderLastSignalInfo() {
        if (!this.stats?.lastSignal) {
            return `
                <div class="session-item">
                    <span>Нет сигналов</span>
                </div>
            `;
        }

        const signal = this.stats.lastSignal;
        const timeAgo = this.getTimeAgo(signal.createdAt);
        
        return `
            <div class="session-item">
                <span>${signal.type.toUpperCase()}:</span>
                <span>${signal.symbol}</span>
            </div>
            <div class="session-item">
                <span>Время:</span>
                <span>${timeAgo}</span>
            </div>
        `;
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const signalTime = new Date(timestamp);
        const diffMs = now - signalTime;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'только что';
        if (diffMins < 60) return `${diffMins} мин назад`;
        if (diffHours < 24) return `${diffHours} ч назад`;
        return `${diffDays} дн назад`;
    }

    bindEvents() {
        // Dashboard не требует особых событий пока
    }
}