import './dashboard.css';

export class DashboardModule {
    constructor() {
        this.apiUrl = 'https://god-devils-trade.fly.dev/api';
        this.stats = null;
    }

    async render() {
        await this.loadStats();
        
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
    Аналитика Сигналов
</h1>
                    <div class="last-update">
                        Обновлено: ${new Date().toLocaleString('ru-RU')}
                    </div>
                </div>
                
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
                            <div class="stat-label">Сессии</div>
                            <div class="session-breakdown">
                                <div class="session-item">
                                    <span>London:</span>
                                    <span>${this.stats?.sessions?.london || 0}</span>
                                </div>
                                <div class="session-item">
                                    <span>New York:</span>
                                    <span>${this.stats?.sessions?.newYork || 0}</span>
                                </div>
                                <div class="session-item">
                                    <span>Другие:</span>
                                    <span>${this.stats?.sessions?.other || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="recent-activity">
                    <h3>Последний сигнал</h3>
                    ${this.renderLastSignal()}
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

    renderLastSignal() {
        if (!this.stats?.lastSignal) {
            return `
                <div class="no-recent-signal">
                    <p>Пока нет сигналов</p>
                </div>
            `;
        }

        const signal = this.stats.lastSignal;
        const timeAgo = this.getTimeAgo(signal.createdAt);
        
        return `
            <div class="last-signal-card ${signal.type}">
                <div class="signal-icon">
                    ${signal.type === 'long' ? '😇' : '😈'}
                </div>
                <div class="signal-details">
                    <div class="signal-type">${signal.type.toUpperCase()}</div>
                    <div class="signal-info">
                        <span>${signal.symbol}</span>
                        <span>${signal.session}</span>
                        <span>${timeAgo}</span>
                    </div>
                </div>
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