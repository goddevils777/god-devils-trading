import './share.css';

export class ShareModule {
    constructor() {
        this.shareData = null;
    }

    async render(shareId) {
        try {
            // Загружаем данные публичной ссылки
            const response = await fetch(`http://localhost:8080/api/trades/share/${shareId}`);

            if (!response.ok) {
                if (response.status === 404) {
                    return this.renderNotFound();
                }
                if (response.status === 410) {
                    return this.renderExpired();
                }
                throw new Error('Failed to load share data');
            }

            const result = await response.json();
            this.shareData = result.data;

            const htmlContent = this.renderShareView();

            // ДОБАВЬ ЭТУ СТРОКУ - привязываем события после рендера
            setTimeout(() => this.bindEvents(), 0);

            return htmlContent;

        } catch (error) {
            console.error('Error loading share:', error);
            return this.renderError();
        }
    }

    renderShareView() {
        const { trades, filters } = this.shareData;

        // Форматируем примененные фильтры
        const filterInfo = this.formatFilters(filters);

        return `
        <div class="share-container">
            <div class="share-header">
                <h2>📊 Публичный доступ к сделкам</h2>
                ${filterInfo ? `<div class="filter-info">${filterInfo}</div>` : '<div class="filter-info">Фильтры: Все сделки</div>'}
            </div>
            
            <div class="trades-stats">
                ${this.renderStats(trades)}
            </div>
            
            <div class="trades-list">
                ${this.renderTradesList(trades)}
            </div>
        </div>
    `;
    }

    formatTimeLeft(daysLeft) {
        if (daysLeft <= 0) return 'истекла';

        const months = Math.floor(daysLeft / 30);
        const days = daysLeft % 30;

        let result = '';
        if (months > 0) result += `${months} мес`;
        if (days > 0) result += `${months > 0 ? ' ' : ''}${days} дн`;

        return result || '0 дн';
    }

    formatFilters(filters) {
        const parts = [];

        if (filters.currency && filters.currency !== 'all') {
            parts.push(`Валюта: ${filters.currency}`);
        }

        if (filters.result && filters.result !== 'all') {
            const resultMap = { profit: 'Прибыль', loss: 'Убыток', breakeven: 'В ноль' };
            parts.push(`Результат: ${resultMap[filters.result] || filters.result}`);
        }

        if (filters.group && filters.group !== 'all') {
            if (filters.group === 'ungrouped') {
                parts.push('Группа: Без группы');
            } else {
                parts.push(`Группа: ${filters.group}`);
            }
        }

        if (filters.dateFrom || filters.dateTo) {
            let dateRange = 'Период: ';
            if (filters.dateFrom && filters.dateTo) {
                const fromDate = new Date(filters.dateFrom).toLocaleDateString('ru-RU');
                const toDate = new Date(filters.dateTo).toLocaleDateString('ru-RU');
                dateRange += `${fromDate} — ${toDate}`;
            } else if (filters.dateFrom) {
                const fromDate = new Date(filters.dateFrom).toLocaleDateString('ru-RU');
                dateRange += `с ${fromDate}`;
            } else if (filters.dateTo) {
                const toDate = new Date(filters.dateTo).toLocaleDateString('ru-RU');
                dateRange += `до ${toDate}`;
            }
            parts.push(dateRange);
        }

        return parts.length > 0 ? `Фильтры: ${parts.join(' • ')}` : null;
    }

    renderStats(trades) {
        const totalTrades = trades.length;
        const winTrades = trades.filter(t => t.result > 0).length;
        const lossTrades = trades.filter(t => t.result < 0).length;
        const breakevenTrades = trades.filter(t => t.result === 0).length;
        const winRate = totalTrades > 0 ? ((winTrades / totalTrades) * 100).toFixed(1) : 0;
        const totalPnL = trades.reduce((sum, t) => sum + t.result, 0).toFixed(2);

        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">${totalTrades}</div>
                    <div class="stat-label">Всего сделок</div>
                </div>
                <div class="stat-card win">
                    <div class="stat-number">${winTrades}</div>
                    <div class="stat-label">Прибыльные</div>
                </div>
                <div class="stat-card loss">
                    <div class="stat-number">${lossTrades}</div>
                    <div class="stat-label">Убыточные</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${breakevenTrades}</div>
                    <div class="stat-label">В ноль</div>
                </div>
                <div class="stat-card ${winRate >= 50 ? 'win' : 'loss'}">
                    <div class="stat-number">${winRate}%</div>
                    <div class="stat-label">Win Rate</div>
                </div>
                <div class="stat-card ${totalPnL > 0 ? 'win' : totalPnL < 0 ? 'loss' : ''}">
                    <div class="stat-number">${totalPnL} RR</div>
                    <div class="stat-label">Общий P&L</div>
                </div>
            </div>
        `;
    }

    renderTradesList(trades) {
        return `
        <div class="trades-table">
            <div class="table-header">
                <div>Дата</div>
                <div>Тип</div>
                <div>Валюта</div>
                <div>Результат</div>
                <div>Скриншот</div>
            </div>
            ${trades.map(trade => `
                <div class="table-row">
                    <div class="trade-date">${this.formatDate(trade.date)}</div>
                    <div class="trade-type ${trade.type}">
                        ${trade.type === 'long' ? '😇 LONG' : '😈 SHORT'}
                    </div>
                    <div class="trade-currency">${trade.currency}</div>
                    <div class="trade-result ${trade.result > 0 ? 'profit' : trade.result < 0 ? 'loss' : 'breakeven'}">
                        ${trade.result > 0 ? '+' : ''}${trade.result} RR
                    </div>
                    <div class="trade-screenshot">
                        ${trade.screenshotData ?
                `<button class="view-screenshot-btn" data-trade-id="${trade.id}">📸</button>` :
                '<span class="no-screenshot">—</span>'
            }
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    }

    renderNotFound() {
        return `
            <div class="share-error">
                <h2>🔍 Ссылка не найдена</h2>
                <p>Публичная ссылка не существует или была удалена.</p>
            </div>
        `;
    }

    renderExpired() {
        return `
            <div class="share-error">
                <h2>⏰ Ссылка истекла</h2>
                <p>Срок действия этой публичной ссылки истёк (более 3 месяцев).</p>
            </div>
        `;
    }

    renderError() {
        return `
            <div class="share-error">
                <h2>❌ Ошибка загрузки</h2>
                <p>Не удалось загрузить данные. Попробуйте позже.</p>
            </div>
        `;
    }

    formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('ru-RU');
    }

    bindEvents() {
        // Обработчик просмотра скриншота
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-screenshot-btn')) {
                const tradeId = parseInt(e.target.dataset.tradeId);
                this.showScreenshotModal(tradeId);
            }
        });
    }

    showScreenshotModal(tradeId) {
        const trade = this.shareData.trades.find(t => t.id === tradeId);
        if (!trade || !trade.screenshotData) {
            return;
        }

        // Создаем список сделок со скриншотами
        this.tradesWithScreenshots = this.shareData.trades.filter(t => t.screenshotData);
        this.currentTradeIndex = this.tradesWithScreenshots.findIndex(t => t.id === tradeId);

        const modal = document.createElement('div');
        modal.className = 'screenshot-modal';
        modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <div class="modal-trade-info"></div>
                <button class="modal-close-btn">×</button>
            </div>
            <div class="modal-body">
                <button class="nav-btn prev" id="prevTradeBtn">←</button>
                <img src="" alt="Screenshot" class="modal-screenshot" data-zoom-level="1">
                <button class="nav-btn next" id="nextTradeBtn">→</button>
                <div class="modal-controls">
                    <span id="modalZoomInfo">Клик для увеличения • ← → навигация</span>
                </div>
            </div>
        </div>
    `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';

        const img = modal.querySelector('.modal-screenshot');
        const prevBtn = modal.querySelector('#prevTradeBtn');
        const nextBtn = modal.querySelector('#nextTradeBtn');
        const zoomInfo = modal.querySelector('#modalZoomInfo');

        // Переменные для drag & drop
        this.hasMoved = false;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.imgStartX = 0;
        this.imgStartY = 0;

        // Загружаем текущую сделку
        this.loadTradeInModal(trade, img, modal);

        // Зум к точке клика
        img.addEventListener('click', (e) => {
            if (this.hasMoved) return;
            e.stopPropagation();
            this.zoomToPoint(img, e, zoomInfo);
        });

        // Drag & Drop
        img.addEventListener('mousedown', (e) => {
            const zoomLevel = parseInt(img.dataset.zoomLevel || '1');
            if (zoomLevel > 1) {
                this.isDragging = true;
                this.hasMoved = false;
                img.classList.add('dragging');

                this.dragStartX = e.clientX;
                this.dragStartY = e.clientY;
                this.imgStartX = parseInt(img.style.left) || 0;
                this.imgStartY = parseInt(img.style.top) || 0;

                e.preventDefault();
                e.stopPropagation();
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            this.hasMoved = true;
            e.preventDefault();

            const deltaX = e.clientX - this.dragStartX;
            const deltaY = e.clientY - this.dragStartY;
            const newX = this.imgStartX + deltaX;
            const newY = this.imgStartY + deltaY;

            img.style.left = newX + 'px';
            img.style.top = newY + 'px';
        });

        document.addEventListener('mouseup', (e) => {
            if (this.isDragging) {
                this.isDragging = false;
                img.classList.remove('dragging');
                e.stopPropagation();
            }
        });

        // Навигация
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showPreviousScreenshot(img, modal);
        });

        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showNextScreenshot(img, modal);
        });

        // Обновляем навигационные кнопки
        this.updateNavigationButtons(prevBtn, nextBtn, zoomInfo);


        modal.querySelector('.modal-close-btn').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // Клавиатурная навигация
        const handleKeydown = (e) => {
            switch (e.key) {
                case 'Escape':
                    closeModal();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.showPreviousScreenshot(img, modal);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.showNextScreenshot(img, modal);
                    break;
            }
        };
        document.addEventListener('keydown', handleKeydown);

        // Убираем обработчик при закрытии
        const originalCloseModal = closeModal;
        closeModal = () => {
            document.removeEventListener('keydown', handleKeydown);
            originalCloseModal();
        };
    }

    toggleZoom(img) {
        let currentZoom = parseInt(img.dataset.zoomLevel || '1');
        const newZoom = currentZoom >= 3 ? 1 : currentZoom + 1;

        if (newZoom === 1) {
            img.style.transform = 'scale(1)';
            img.style.cursor = 'zoom-in';
        } else {
            img.style.transform = `scale(${newZoom})`;
            img.style.cursor = 'zoom-out';
        }

        img.dataset.zoomLevel = newZoom;
    }
    zoomToPoint(img, event, zoomInfo) {
        let currentZoom = parseInt(img.dataset.zoomLevel || '1');
        const newZoom = currentZoom >= 3 ? 1 : currentZoom + 1;

        if (newZoom === 1) {
            this.resetImageTransform(img);
        } else {
            img.classList.add('zoomed');
            img.style.transform = `scale(${newZoom})`;
            img.style.transformOrigin = 'center center';
            img.dataset.zoomLevel = newZoom;
        }

        if (zoomInfo) {
            const position = `${this.currentTradeIndex + 1} / ${this.tradesWithScreenshots.length}`;
            const zoomText = newZoom === 1 ? 'Клик для увеличения' : `${newZoom}x • Зажми и тяни`;
            zoomInfo.textContent = `${position} • ${zoomText} • ← → навигация`;
        }
    }

    resetImageTransform(img) {
        img.style.transform = 'scale(1)';
        img.style.position = 'relative';
        img.style.left = '0px';
        img.style.top = '0px';
        img.dataset.zoomLevel = '1';
        img.classList.remove('zoomed');
    }

    loadTradeInModal(trade, img, modal) {
        this.resetImageTransform(img);
        img.src = trade.screenshotData;
        img.dataset.zoomLevel = '1';

        this.isDragging = false;
        this.hasMoved = false;

        const tradeInfo = modal.querySelector('.modal-trade-info');
        if (tradeInfo) {
            const typeIcon = trade.type === 'long' ? '😇' : '😈';
            const typeText = trade.type === 'long' ? 'LONG' : 'SHORT';
            const typeClass = trade.type === 'long' ? 'trade-type-long' : 'trade-type-short';
            const resultText = trade.result > 0 ? `+${trade.result}` : trade.result;
            tradeInfo.innerHTML = `
            <span class="${typeClass}">${typeIcon} ${typeText}</span> 
            <strong>${trade.currency}</strong> • 
            <span class="${trade.result > 0 ? 'profit' : 'loss'}">${resultText}</span> • 
            ${this.formatDate(trade.date)}
        `;
        }
    }

    showPreviousScreenshot(img, modal) {
        if (this.currentTradeIndex < this.tradesWithScreenshots.length - 1) {
            this.currentTradeIndex++;
            const prevTrade = this.tradesWithScreenshots[this.currentTradeIndex];
            this.loadTradeInModal(prevTrade, img, modal);
            this.updateNavigationButtons(
                modal.querySelector('#prevTradeBtn'),
                modal.querySelector('#nextTradeBtn'),
                modal.querySelector('#modalZoomInfo')
            );
        }
    }

    showNextScreenshot(img, modal) {
        if (this.currentTradeIndex > 0) {
            this.currentTradeIndex--;
            const nextTrade = this.tradesWithScreenshots[this.currentTradeIndex];
            this.loadTradeInModal(nextTrade, img, modal);
            this.updateNavigationButtons(
                modal.querySelector('#prevTradeBtn'),
                modal.querySelector('#nextTradeBtn'),
                modal.querySelector('#modalZoomInfo')
            );
        }
    }

    updateNavigationButtons(prevBtn, nextBtn, zoomInfo) {
        const totalTrades = this.tradesWithScreenshots.length;

        prevBtn.disabled = this.currentTradeIndex >= totalTrades - 1;
        nextBtn.disabled = this.currentTradeIndex <= 0;

        if (zoomInfo) {
            const position = `${this.currentTradeIndex + 1} / ${totalTrades}`;
            zoomInfo.textContent = `${position} • Клик для увеличения • ← → навигация`;
        }
    }
}