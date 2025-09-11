import './signals.css';
import { notifications } from '../../utils/notifications.js';

export class SignalsModule {
    constructor() {
        this.signals = [];
        this.wsConnection = null;
        this.apiUrl = 'https://god-devils-trade.fly.dev/api';
        this.currentTypeFilter = 'all';
        this.currentTimeFilter = 'all';
        this.loadSavedSignals();
    }

    render() {
        console.log('🎨 Rendering signals, count:', this.signals.length);
        return `
        <div class="signals-container">
            <div class="signals-header">
                <h2>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="signals-icon">
        <path d="M3 13h4l3-8 4 16 3-8h4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="18" cy="6" r="3" fill="#fcd535"/>
        <circle cx="6" cy="18" r="2" fill="#0ecb81"/>
    </svg>
    Торговые Сигналы
</h2>
                <div class="signals-status">
                    <span class="status-indicator" id="connectionStatus">🟢</span>
                    <span id="statusText">Подключено</span>
                </div>
            </div>
            
<div class="monitoring-status">
    <span id="monitoringText">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="search-icon">
            <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
            <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2"/>
        </svg>
        Мониторим сигналы
    </span>
</div>
            
            <div class="filters-container">
                <div class="type-filters">
                    <button class="filter-btn active" data-filter="all">Все</button>
                    <button class="filter-btn" data-filter="long">😇 Long</button>
                    <button class="filter-btn" data-filter="short">😈 Short</button>
                </div>
                
                <div class="time-filters">
                    <button class="time-filter-btn active" data-time="all">Все время</button>
                    <button class="time-filter-btn" data-time="today">Сегодня</button>
                    <button class="time-filter-btn" data-time="yesterday">Вчера</button>
                    <button class="time-filter-btn" data-time="3days">3 дня</button>
                    <button class="time-filter-btn" data-time="week">Неделя</button>
                    <button class="time-filter-btn" data-time="month">Месяц</button>
                </div>
            </div>
            
            <div class="signals-list" id="signalsList">
                ${this.renderFilteredSignals()}
            </div>
        </div>
    `;
    }

    renderFilteredSignals() {
        const filteredSignals = this.getFilteredSignals();

        if (filteredSignals.length === 0) {
            return `
            <div class="no-signals">
                <p>Нет сигналов для выбранного фильтра</p>
                <div class="loading-spinner"></div>
            </div>
        `;
        }

        return filteredSignals.map(signal => `
        <div class="signal-card ${signal.type}" data-signal-id="${signal.id}">
            <div class="signal-icon">
                ${signal.type === 'long' ? '😇' : '😈'}
            </div>
            <div class="signal-info">
                <div class="signal-type">${signal.type.toUpperCase()}</div>
                <div class="signal-time">${this.formatTime(signal.createdAt)}</div>
                <div class="signal-session">${signal.session}</div>
                <div class="signal-symbol">${signal.symbol}</div>
            </div>
                <div class="signal-status ${this.getSignalStatus(signal)}">
                    ${this.getSignalStatusText(signal)}
                </div>
            <button class="delete-signal-btn" data-signal-id="${signal.id}" title="Удалить сигнал">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
        </div>
    `).join('');
    }

    getFilteredSignals() {
        let filtered = [...this.signals];

        // Фильтр по типу
        if (this.currentTypeFilter !== 'all') {
            filtered = filtered.filter(signal => signal.type === this.currentTypeFilter);
        }

        // Фильтр по времени
        if (this.currentTimeFilter !== 'all') {
            const now = new Date();
            const { startDate, endDate } = this.getFilterDateRange(this.currentTimeFilter, now);

            filtered = filtered.filter(signal => {
                const signalDate = new Date(signal.createdAt);
                return signalDate >= startDate && signalDate <= endDate;
            });
        }

        return filtered;
    }

    getFilterDateRange(timeFilter, now) {
        const endDate = new Date(now);
        const startDate = new Date(now);

        switch (timeFilter) {
            case 'today':
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'yesterday':
                startDate.setDate(startDate.getDate() - 1);
                startDate.setHours(0, 0, 0, 0);
                endDate.setDate(endDate.getDate() - 1);
                endDate.setHours(23, 59, 59, 999);
                break;
            case '3days':
                startDate.setDate(startDate.getDate() - 3);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate.setDate(startDate.getDate() - 7);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'month':
                startDate.setMonth(startDate.getMonth() - 1);
                startDate.setHours(0, 0, 0, 0);
                break;
            default:
                return { startDate: new Date(0), endDate: new Date() };
        }

        return { startDate, endDate };
    }

    async loadSavedSignals() {
        try {
            console.log('🔄 Loading saved signals from database...');
            const response = await fetch(`${this.apiUrl}/signals?limit=20`);
            console.log('📡 Response status:', response.status);

            const data = await response.json();
            console.log('📥 Response data:', data);

            if (data.success) {
                this.signals = data.signals;
                console.log(`📊 Loaded ${data.signals.length} saved signals`);
                console.log('📋 Signals array:', this.signals);

                // Обновляем отображение после загрузки
                this.updateSignalsList();
            }
        } catch (error) {
            console.error('❌ Error loading saved signals:', error);
        }
    }

    async loadSignalStats() {
        try {
            const response = await fetch(`${this.apiUrl}/signals/stats`);
            const stats = await response.json();
            console.log('📈 Signal stats:', stats);
            return stats;
        } catch (error) {
            console.error('Error loading signal stats:', error);
            return null;
        }
    }

    bindEvents() {
        this.setupFilters();
        this.connectWebSocket();
    }

    setupFilters() {
        // Фильтры по типу сигналов
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.currentTypeFilter = filter;

                // Обновляем активную кнопку
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                this.updateSignalsList();
            });
        });

        // Фильтры по времени
        document.querySelectorAll('.time-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const timeFilter = e.target.dataset.time;
                this.currentTimeFilter = timeFilter;

                // Обновляем активную кнопку
                document.querySelectorAll('.time-filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                this.updateSignalsList();
            });
        });
        // Обработчик удаления сигналов
        document.addEventListener('click', (e) => {
            if (e.target.closest('.delete-signal-btn')) {
                const signalId = e.target.closest('.delete-signal-btn').dataset.signalId;
                this.deleteSignal(signalId);
            }
        });
    }


    async deleteSignal(signalId) {
        const confirmed = await notifications.confirm(
            'Этот сигнал будет удален навсегда. Продолжить?',
            'Удаление сигнала',
            'Удалить',
            'Отмена'
        );

        if (!confirmed) return;

        try {
            const response = await fetch(`${this.apiUrl}/signals/${signalId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // Удаляем из локального массива
                this.signals = this.signals.filter(signal => signal.id != signalId);
                this.updateSignalsList();
                notifications.success('Сигнал удален');
            } else {
                notifications.error('Ошибка при удалении сигнала');
            }
        } catch (error) {
            console.error('Error deleting signal:', error);
            notifications.error('Ошибка при удалении сигнала');
        }
    }

    connectWebSocket() {
        try {
            this.wsConnection = new WebSocket('wss://god-devils-trade.fly.dev');

            this.wsConnection.onopen = () => {
                console.log('🔌 Connected to signals WebSocket');
                this.updateConnectionStatus(true);
            };

            this.wsConnection.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    console.log('📨 Received message:', message);

                    if (message.type === 'signal') {
                        this.addSignal(message.data);
                    } else if (message.type === 'connection') {
                        console.log('✅ WebSocket connection confirmed');
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            this.wsConnection.onclose = () => {
                console.log('📱 WebSocket connection closed');
                this.updateConnectionStatus(false);

                // Попытка переподключения через 5 секунд
                setTimeout(() => {
                    console.log('🔄 Attempting to reconnect...');
                    this.connectWebSocket();
                }, 5000);
            };

            this.wsConnection.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.updateConnectionStatus(false);
            };

        } catch (error) {
            console.error('Failed to connect to WebSocket:', error);
            this.updateConnectionStatus(false);
        }
    }

    addSignal(signal) {
        this.signals.unshift(signal);
        this.updateSignalsList();
        this.showNotification(signal);
        this.playNotificationSound();
        this.updateMonitoringStatus(signal);
    }

    playNotificationSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Создаем приятный звук уведомления
        const playTone = (frequency, startTime, duration) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(frequency, startTime);
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        };

        // Мелодичная последовательность
        const now = audioContext.currentTime;
        playTone(523.25, now, 0.15);        // C5
        playTone(659.25, now + 0.08, 0.15); // E5
        playTone(783.99, now + 0.16, 0.25); // G5
    }

    updateMonitoringStatus(signal) {
        const statusElement = document.getElementById('monitoringText');
        if (statusElement) {
            const signalEmoji = signal.type === 'long' ? '😇' : '😈';
            statusElement.textContent = `🎯 Получен сигнал ${signalEmoji} ${signal.type.toUpperCase()}!`;
            statusElement.classList.add('signal-received');

            // Возвращаем к обычному статусу через 5 секунд
            setTimeout(() => {
                statusElement.textContent = '🔍 Мониторим сигналы...';
                statusElement.classList.remove('signal-received');
            }, 5000);
        }
    }

    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('connectionStatus');
        const textElement = document.getElementById('statusText');

        if (statusElement && textElement) {
            statusElement.textContent = connected ? '🟢' : '🔴';
            textElement.textContent = connected ? 'Подключено' : 'Отключено';
        }
    }

    updateSignalsList() {
        const listElement = document.getElementById('signalsList');
        if (listElement) {
            listElement.innerHTML = this.renderFilteredSignals();
        }
    }

    showNotification(signal) {
        const signalEmoji = signal.type === 'long' ? '😇' : '😈';
        notifications.success(`${signalEmoji} ${signal.type.toUpperCase()} Signal!`, 3000);

        // Убираем browser notification чтобы избежать дублирования
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('ru-RU', {
            timeZone: 'Europe/Kiev',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getSignalStatus(signal) {
        const signalTime = new Date(signal.createdAt);
        const now = new Date();
        const diffMinutes = (now - signalTime) / (1000 * 60);

        return diffMinutes <= 15 ? 'new' : 'active';
    }

    getSignalStatusText(signal) {
        const signalTime = new Date(signal.createdAt);
        const now = new Date();
        const diffMinutes = (now - signalTime) / (1000 * 60);

        return diffMinutes <= 15 ? 'NEW' : '';
    }
}