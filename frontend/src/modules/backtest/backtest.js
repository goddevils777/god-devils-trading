import './backtest.css';
import { notifications } from '../../utils/notifications.js';
import { initCustomCalendars } from '../../utils/CustomCalendar.js';

export class BacktestModule {
    constructor() {
        this.trades = JSON.parse(localStorage.getItem('backtestTrades')) || [];
        this.currencies = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD', 'EURGBP', 'EURJPY'];
        this.rrValues = JSON.parse(localStorage.getItem('customRrValues')) || ['-1', '-0.8', '0', '1.5', '2'];
        this.currentFilter = { currency: 'all', result: 'all', category: 'all', group: 'all', dateFrom: '', dateTo: '' };
        this.randomMode = JSON.parse(localStorage.getItem('randomModeState')) || false;
        this.collapsedGroups = new Set(JSON.parse(localStorage.getItem('collapsedGroups')) || []); // Добавить эту строку
    }

    render() {
        return `
            <div class="backtest-container">
                <div class="backtest-header">
                    <h2>📊 Backtest Journal</h2>
                    <div class="header-actions">
                        <button class="clear-all-btn" id="clearAllBtn">Очистить журнал</button>
                        <button class="group-trades-btn" id="groupTradesBtn">Сгруппировать</button>
                        <button class="add-trade-btn" id="addTradeBtn">+ Добавить сделку</button>
                    </div>
                </div>
                
                <div class="trade-form-container" id="tradeFormContainer" style="display: none;">
                    ${this.renderTradeForm()}
                </div>
                
                <div class="filters-container">
                    ${this.renderFilters()}
                </div>
                
                <div class="trades-stats">
                    ${this.renderStats()}
                </div>
                
                <div class="trades-list">
                    ${this.renderTradesList()}
                </div>
            </div>
        `;
    }

    // Обновить метод renderTradeForm для установки состояния:
    renderTradeForm() {
        const lastTradeDate = this.getLastTradeDate();
        const nextDate = this.getNextDate(lastTradeDate);
        const lastGroup = localStorage.getItem('lastSelectedGroup') || '';
        const lastCurrency = localStorage.getItem('lastSelectedCurrency') || 'EURUSD'; // Добавить запоминание валюты

        return `
<div class="trade-form">
    <h3>Новая сделка</h3>
    <form id="tradeForm">
        <div class="form-row">
            <div class="form-group">
                <label>Тип</label>
                <div class="trade-type-buttons">
                <button type="button" class="type-btn" data-type="short">😈 Short</button>
                    <button type="button" class="type-btn active" data-type="long">😇 Long</button>
                    
                </div>
            </div>
            <div class="form-group">
                <label>Валютная пара</label>
                <select name="currency" required>
                    ${this.currencies.map(cur => `<option value="${cur}" ${cur === lastCurrency ? 'selected' : ''}>${cur}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Группа (категория)</label>
                <select name="category">
                    <option value="">Без группы</option>
                    ${this.getExistingGroups().map(group => `
                        <option value="${group}" ${group === lastGroup ? 'selected' : ''}>${group}</option>
                    `).join('')}
                </select>
            </div>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label>Дата</label>
                <div class="date-controls">
                    <button type="button" class="date-btn" id="prevDateBtn">←</button>
                    <input type="date" name="date" value="${nextDate}" required>
                    <button type="button" class="date-btn" id="nextDateBtn">→</button>
                </div>
            </div>
        </div>

<div class="form-row">
            <div class="form-group full-width">
                <label>Скриншот сделки</label>
                <div class="screenshot-paste-area" id="screenshotPasteArea">
                    <div class="paste-placeholder">
                        <span class="paste-icon">📷</span>
                        <p>Нажми Ctrl+V чтобы вставить скриншот из буфера обмена</p>
                        <small>Поддерживаются форматы: PNG, JPG, GIF</small>
                    </div>
                    <div class="image-preview" id="imagePreview" style="display: none;">
                        <img id="previewImage" src="" alt="Preview">
                        <button type="button" class="remove-image-btn" id="removeImageBtn">×</button>
                    </div>
                </div>
                <input type="hidden" name="screenshotData" id="screenshotData">
            </div>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label>Результат (RR)</label>
                <div class="rr-controls">
                    <div class="rr-buttons" id="rrButtonsContainer">
                        ${this.rrValues.map(value => `
                            <button type="button" class="rr-btn" data-rr="${value}">
                                ${parseFloat(value) > 0 ? '+' + value : value}
                            </button>
                        `).join('')}
                        <button type="button" class="add-rr-btn" id="addRrBtn">+</button>
                        <button type="button" class="remove-rr-btn" id="removeRrBtn">−</button>
                    </div>
                    <div class="rr-input-row">
                        <input type="number" name="result" step="0.1" value="" placeholder="0">
                        <span class="random-toggle-label">Random</span>
                        <label class="random-toggle-switch">
                            <input type="checkbox" id="randomMode" ${this.randomMode ? 'checked' : ''}>
                            <span class="random-toggle-slider"></span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="form-actions">
            <button type="button" id="clearFormBtn">Очистить</button>
            <button type="button" id="cancelTradeBtn">Отмена</button>
            <button type="submit">Сохранить</button>
        </div>

        <div class="hotkeys-info">
            <div class="hotkey">
                <kbd>Tab</kbd>
                <span>переключить тип</span>
            </div>
            <div class="hotkey">
                <kbd>Space</kbd>
                <span>переключить RR / рандом</span>
            </div>
            <div class="hotkey">
                <kbd>← →</kbd>
                <span>изменить дату</span>
            </div>
            <div class="hotkey">
                <kbd>Enter</kbd>
                <span>сохранить</span>
            </div>
        </div>
    </form>
</div>
`;
    }

    renderFilters() {
        const groups = [...new Set(this.trades.filter(t => t.groupName).map(t => t.groupName))];

        return `
        <div class="filters">
            <div class="filter-group">
                <label>Валюта:</label>
                <select id="currencyFilter">
                    <option value="all">Все</option>
                    ${this.currencies.map(cur => `<option value="${cur}">${cur}</option>`).join('')}
                </select>
            </div>
            <div class="filter-group">
                <label>Результат:</label>
                <select id="resultFilter">
                    <option value="all">Все</option>
                    <option value="profit">Прибыль</option>
                    <option value="loss">Убыток</option>
                    <option value="breakeven">В ноль</option>
                </select>
            </div>
            <div class="filter-group">
                <label>Группа:</label>
                <select id="groupFilter">
                    <option value="all">Все</option>
                    <option value="ungrouped">Без группы</option>
                    ${groups.map(group => `<option value="${group}">${group}</option>`).join('')}
                </select>
            </div>
            <div class="filter-group">
                <label>От:</label>
                <input type="date" id="dateFromFilter">
            </div>
            <div class="filter-group">
                <label>До:</label>
                <input type="date" id="dateToFilter">
            </div>
            <button id="clearFiltersBtn">Очистить фильтры</button>
        </div>
        `;
    }

    renderStats() {
        const filteredTrades = this.getFilteredTrades();
        const totalTrades = filteredTrades.length;

        if (totalTrades === 0) {
            return `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">0</div>
                    <div class="stat-label">Всего сделок</div>
                </div>
            </div>
        `;
        }

        const winTrades = filteredTrades.filter(t => t.result > 0).length;
        const lossTrades = filteredTrades.filter(t => t.result < 0).length;
        const breakevenTrades = filteredTrades.filter(t => t.result === 0).length;

        // Win Rate считается ТОЛЬКО от прибыльных и убыточных (исключая breakeven)
        const tradesWithResult = winTrades + lossTrades;
        const winRate = tradesWithResult > 0 ? ((winTrades / tradesWithResult) * 100).toFixed(1) : 0;

        const totalPnL = filteredTrades.reduce((sum, t) => sum + t.result, 0).toFixed(2);

        // Подсчет максимальных серий
        const streaks = this.calculateStreaks(filteredTrades);

        return `
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-number">${totalTrades}</div>
            <div class="stat-label">Всего сделок</div>
        </div>
        <div class="stat-card win">
            <div class="stat-number">${winTrades}</div>
            <div class="stat-label">Прибыльные</div>
            <div class="stat-streak">макс. серия: ${streaks.maxWinStreak}</div>
        </div>
        <div class="stat-card loss">
            <div class="stat-number">${lossTrades}</div>
            <div class="stat-label">Убыточные</div>
            <div class="stat-streak">макс. серия: ${streaks.maxLossStreak}</div>
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

    renderTradesList() {
        const filteredTrades = this.getFilteredTrades();

        if (filteredTrades.length === 0) {
            return `<div class="no-trades"><p>Нет сделок для отображения</p></div>`;
        }

        let currentGroup = null;

        return `
    <div class="trades-table">
        <div class="table-header">
            <div>Дата</div>
            <div>Тип</div>
            <div>Валюта</div>
            <div>Результат</div>
            <div>Действия</div>
        </div>
        ${filteredTrades.map((trade, index) => {
            let groupHeader = '';
            let tradeRow = '';

            // Проверяем, можно ли редактировать/удалить сделку (5 минут = 300000 мс)
            const tradeAge = Date.now() - new Date(trade.createdAt).getTime();
            const canModify = tradeAge < 300000; // 5 минут

            // Если это начало новой группы
            if (trade.groupName && trade.groupName !== currentGroup) {
                currentGroup = trade.groupName;
                const isCollapsed = this.collapsedGroups.has(trade.groupName);
                const groupTradesCount = filteredTrades.filter(t => t.groupName === trade.groupName).length;

                groupHeader = `
                    <div class="group-separator">
                        <div class="group-info">
                            <button class="collapse-btn" data-group="${trade.groupName}" title="${isCollapsed ? 'Развернуть' : 'Свернуть'}">
                                ${isCollapsed ? '▶' : '▼'}
                            </button>
                            <span>📁 ${trade.groupName} (${groupTradesCount})</span>
                        </div>
                        <button class="ungroup-btn" data-group="${trade.groupName}" title="Расгруппировать">✕</button>
                    </div>
                `;
            } else if (!trade.groupName && currentGroup !== null) {
                currentGroup = null;
            }

            // Показываем сделку только если группа не свернута
            const shouldShowTrade = !trade.groupName || !this.collapsedGroups.has(trade.groupName);

            if (shouldShowTrade) {
                // Определяем иконку и текст для типа сделки
                const typeIcon = trade.type === 'long' ? '😇' : '😈';
                const typeText = trade.type === 'long' ? 'LONG' : 'SHORT';

                tradeRow = `
                    <div class="table-row ${trade.groupName ? 'grouped' : ''}">
                        <div class="trade-date" data-date="${trade.date}" title="Кликните чтобы использовать эту дату">${this.formatDate(trade.date)}</div>
                        <div class="trade-type ${trade.type} ${canModify ? '' : 'disabled'}" data-id="${trade.id}" title="${canModify ? 'Кликните для смены типа' : 'Нельзя изменить (прошло больше 5 минут)'}">${typeIcon} ${typeText}</div>
                        <div class="trade-currency">${trade.currency}</div>
                        <div class="trade-result ${trade.result > 0 ? 'profit' : trade.result < 0 ? 'loss' : 'breakeven'}">
                            ${trade.result > 0 ? '+' : ''}${trade.result} RR
                        </div>

<div class="trade-actions">
                    ${(() => {
                        console.log(`🔍 Trade ${trade.id}:`);
                        console.log('  - screenshotData:', trade.screenshotData);
                        console.log('  - type of screenshotData:', typeof trade.screenshotData);
                        console.log('  - has screenshotData:', !!trade.screenshotData);
                        console.log('  - screenshotData length:', trade.screenshotData ? trade.screenshotData.length : 'null');

                        if (trade.screenshotData) {
                            console.log('  ✅ Показываем кнопку скриншота');
                            return `
                                <button class="action-btn view-screenshot-btn" data-trade-id="${trade.id}" title="Посмотреть скриншот">
                                    📸
                                </button>
                            `;
                        } else {
                            console.log('  ❌ Скриншот отсутствует');
                            return '';
                        }
                    })()}
                    <button class="action-btn delete-btn" data-trade-id="${trade.id}" title="Удалить сделку">
                        🗑️
                    </button>
                </div>
                    </div>
                `;
            }

            return groupHeader + tradeRow;
        }).join('')}
    </div>
    `;
    }

    calculateStreaks(trades) {
        if (trades.length === 0) {
            return { maxWinStreak: 0, maxLossStreak: 0 };
        }

        // Сортируем сделки по дате (от старой к новой)
        const sortedTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));

        let maxWinStreak = 0;
        let maxLossStreak = 0;
        let currentWinStreak = 0;
        let currentLossStreak = 0;

        for (const trade of sortedTrades) {
            if (trade.result > 0) {
                // Прибыльная сделка
                currentWinStreak++;
                currentLossStreak = 0; // Сбрасываем серию убытков
                maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
            } else if (trade.result < 0) {
                // Убыточная сделка
                currentLossStreak++;
                currentWinStreak = 0; // Сбрасываем серию прибылей
                maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
            }
            // Если trade.result === 0 (breakeven), не сбрасываем серии
        }

        return { maxWinStreak, maxLossStreak };
    }

    toggleGroupCollapse(groupName) {
        if (this.collapsedGroups.has(groupName)) {
            this.collapsedGroups.delete(groupName);
        } else {
            this.collapsedGroups.add(groupName);
        }

        // Сохраняем состояние в localStorage
        localStorage.setItem('collapsedGroups', JSON.stringify([...this.collapsedGroups]));

        // Обновляем отображение
        this.updateDisplay();
    }

    getFilteredTrades() {
        return this.trades.filter(trade => {
            if (this.currentFilter.currency !== 'all' && trade.currency !== this.currentFilter.currency) {
                return false;
            }

            if (this.currentFilter.result !== 'all') {
                if (this.currentFilter.result === 'profit' && trade.result <= 0) return false;
                if (this.currentFilter.result === 'loss' && trade.result >= 0) return false;
                if (this.currentFilter.result === 'breakeven' && trade.result !== 0) return false;
            }

            if (this.currentFilter.group && this.currentFilter.group !== 'all') {
                if (this.currentFilter.group === 'ungrouped' && trade.groupName) return false;
                if (this.currentFilter.group !== 'ungrouped' && trade.groupName !== this.currentFilter.group) return false;
            }

            if (this.currentFilter.dateFrom && trade.date < this.currentFilter.dateFrom) return false;
            if (this.currentFilter.dateTo && trade.date > this.currentFilter.dateTo) return false;

            return true;
        }).sort((a, b) => {
            // Сначала сортируем по группам
            if (a.groupName && !b.groupName) return -1;
            if (!a.groupName && b.groupName) return 1;
            if (a.groupName !== b.groupName) return (a.groupName || '').localeCompare(b.groupName || '');

            // Внутри группы сортируем по времени создания: НОВЫЕ ВВЕРХУ
            // Если есть createdAt - используем его, иначе используем дату сделки
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : new Date(a.date).getTime();
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : new Date(b.date).getTime();
            return timeB - timeA;
        });
    }

    formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('ru-RU');
    }

    saveTrades() {
        console.log('💾 saveTrades() вызван');
        console.log('📝 Сохраняю trades:', this.trades);
        localStorage.setItem('backtestTrades', JSON.stringify(this.trades));
        console.log('✅ Данные сохранены в localStorage');
    }

    async addTrade(tradeData) {
        console.log('🔄 addTrade вызван с данными:', tradeData);
        console.log('📸 screenshotData в tradeData:', tradeData.screenshotData);

        const trade = {
            id: Date.now(),
            type: tradeData.type,
            currency: tradeData.currency,
            date: tradeData.date,
            result: tradeData.result,
            category: tradeData.category,
            screenshotData: tradeData.screenshotData || null, // Сохраняем данные скриншота
            createdAt: new Date().toISOString()
        };

        console.log('💾 Создан объект сделки:', trade);
        console.log('📸 screenshotData в сделке:', trade.screenshotData ? 'Есть' : 'Отсутствует');

        if (tradeData.category) {
            const existingGroup = this.trades.find(t => t.groupName === tradeData.category);
            if (existingGroup) {
                trade.groupId = existingGroup.groupId;
                trade.groupName = tradeData.category;
            }
        }

        // Сохраняем последние выбранные значения
        if (tradeData.category) {
            localStorage.setItem('lastSelectedGroup', tradeData.category);
        }

        if (tradeData.currency) {
            localStorage.setItem('lastSelectedCurrency', tradeData.currency);
        }

        this.trades.push(trade);
        this.saveTrades();
        this.updateDisplay();

        const screenshotText = trade.screenshotData ? ' 📸' : '';
        notifications.success(`Сделка добавлена${screenshotText}`);
    }

    // Методы для работы со скриншотами
    showScreenshotLoading(show) {
        const input = document.querySelector('input[name="screenshotUrl"]');
        if (input) {
            if (show) {
                input.classList.add('screenshot-loading');
                input.disabled = true;
            } else {
                input.classList.remove('screenshot-loading');
                input.disabled = false;
            }
        }
    }

    // Обновленный метод showScreenshotModal
    showScreenshotModal(tradeId) {
        const trade = this.trades.find(t => t.id === tradeId);
        if (!trade || !trade.screenshotData) {
            notifications.error('Скриншот не найден');
            return;
        }

        // Создаем модальное окно если его еще нет
        this.createScreenshotModal();

        // Обновляем список сделок со скриншотами
        this.updateTradesWithScreenshots(tradeId);

        // Загружаем сделку в модальное окно
        this.loadTradeInModal(trade);

        // Показываем модальное окно
        this.modal.style.display = 'flex';
        document.body.classList.add('modal-open');
    }


    // Методы для работы со скриншотами
    setScreenshotPreview(base64Data) {
        const placeholder = document.querySelector('.paste-placeholder');
        const preview = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImage');
        const hiddenInput = document.getElementById('screenshotData');

        if (placeholder && preview && previewImg && hiddenInput) {
            // Скрываем placeholder и показываем превью
            placeholder.style.display = 'none';
            preview.style.display = 'block';

            // Устанавливаем изображение
            previewImg.src = base64Data;

            // Сохраняем данные в скрытое поле
            hiddenInput.value = base64Data;

            console.log('📸 Скриншот установлен в превью');
        }
    }

    clearScreenshot() {
        const placeholder = document.querySelector('.paste-placeholder');
        const preview = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImage');
        const hiddenInput = document.getElementById('screenshotData');

        if (placeholder && preview && previewImg && hiddenInput) {
            // Показываем placeholder и скрываем превью
            placeholder.style.display = 'flex';
            preview.style.display = 'none';

            // Очищаем данные
            previewImg.src = '';
            hiddenInput.value = '';

            console.log('📸 Скриншот удален');
            notifications.info('Скриншот удален');
        }
    }



    deleteTrade(tradeId) {
        this.trades = this.trades.filter(t => t.id !== parseInt(tradeId));
        this.saveTrades();
        this.updateDisplay();
        notifications.success('Сделка удалена');
    }

    updateDisplay() {
        document.querySelector('.trades-stats').innerHTML = this.renderStats();
        document.querySelector('.trades-list').innerHTML = this.renderTradesList();
    }

    highlightDateButton(direction) {
        const btn = document.getElementById(direction === 'prev' ? 'prevDateBtn' : 'nextDateBtn');
        btn.classList.add('pressed');
        setTimeout(() => btn.classList.remove('pressed'), 150);
    }

    cycleRrValue() {
        const resultInput = document.querySelector('input[name="result"]');
        const rrButtons = document.querySelectorAll('.rr-btn');

        if (this.randomMode) {
            // Рандомный режим - выбираем случайное значение
            const randomIndex = Math.floor(Math.random() * this.rrValues.length);
            const randomValue = this.rrValues[randomIndex];

            resultInput.value = randomValue;

            // Обновляем подсветку
            rrButtons.forEach(btn => btn.classList.remove('selected'));
            const targetBtn = document.querySelector(`[data-rr="${randomValue}"]`);
            if (targetBtn) {
                targetBtn.classList.add('selected');
            }
        } else {
            // Обычный режим - создаем последовательность: 0, +макс, -макс, +след, -след

            // Разделяем значения по категориям
            const zeroValues = this.rrValues.filter(v => parseFloat(v) === 0);
            const positiveValues = this.rrValues.filter(v => parseFloat(v) > 0)
                .sort((a, b) => parseFloat(b) - parseFloat(a)); // По убыванию: +2, +1.5
            const negativeValues = this.rrValues.filter(v => parseFloat(v) < 0)
                .sort((a, b) => parseFloat(a) - parseFloat(b)); // По возрастанию: -2, -0.8

            // Создаем последовательность: 0, +2, -2, +1.5, -0.8
            const sequence = [];

            // Добавляем 0 в начало если есть
            if (zeroValues.length > 0) {
                sequence.push(zeroValues[0]);
            }

            // Чередуем положительные и отрицательные по убыванию абсолютных значений
            const maxLength = Math.max(positiveValues.length, negativeValues.length);

            for (let i = 0; i < maxLength; i++) {
                // Добавляем положительное (от большего к меньшему)
                if (i < positiveValues.length) {
                    sequence.push(positiveValues[i]);
                }
                // Добавляем отрицательное (от большего по модулю к меньшему)
                if (i < negativeValues.length) {
                    sequence.push(negativeValues[i]);
                }
            }

            console.log('Sequence:', sequence); // Для отладки

            const currentValue = resultInput.value;
            let currentIndex = sequence.indexOf(currentValue);

            if (currentIndex === -1) currentIndex = -1; // Начнем с первого элемента

            const nextIndex = (currentIndex + 1) % sequence.length;
            const nextValue = sequence[nextIndex];

            resultInput.value = nextValue;

            // Обновляем подсветку
            rrButtons.forEach(btn => btn.classList.remove('selected'));
            const targetBtn = document.querySelector(`[data-rr="${nextValue}"]`);
            if (targetBtn) {
                targetBtn.classList.add('selected');
            }

            console.log(`Current: ${currentValue} -> Next: ${nextValue}`); // Для отладки
        }
    }

    initializeRrButtons() {
        const container = document.getElementById('rrButtonsContainer');
        const addBtn = document.getElementById('addRrBtn');
        if (!container || !addBtn) return;

        // Очищаем существующие кнопки (кроме кнопки добавления)
        container.querySelectorAll('.rr-btn:not(#addRrBtn)').forEach(btn => btn.remove());

        // Создаем кнопки для каждого RR значения
        this.rrValues.forEach(value => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'rr-btn';
            btn.dataset.rr = value;

            // ДОБАВЛЯЕМ ЦВЕТОВЫЕ КЛАССЫ
            const numValue = parseFloat(value);
            if (numValue > 0) {
                btn.classList.add('positive');
            } else if (numValue < 0) {
                btn.classList.add('negative');
            }

            btn.textContent = numValue > 0 ? `+${value}` : value;
            container.insertBefore(btn, addBtn);

            btn.addEventListener('click', () => {
                const resultInput = document.querySelector('input[name="result"]');
                resultInput.value = value;

                // Подсветка выбранной кнопки
                container.querySelectorAll('.rr-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });
    }

    getExistingGroups() {
        return [...new Set(this.trades.filter(t => t.groupName).map(t => t.groupName))];
    }

    clearAllTrades() {
        const filteredTrades = this.getFilteredTrades();

        if (filteredTrades.length === 0) {
            notifications.warning('Нет отфильтрованных сделок для удаления');
            return;
        }

        // Получаем ID отфильтрованных сделок
        const filteredTradeIds = new Set(filteredTrades.map(t => t.id));

        // Удаляем только отфильтрованные сделки
        const originalCount = this.trades.length;
        this.trades = this.trades.filter(trade => !filteredTradeIds.has(trade.id));
        const deletedCount = originalCount - this.trades.length;

        this.saveTrades();
        this.updateDisplay();

        if (deletedCount === originalCount) {
            notifications.success('Журнал полностью очищен');
        } else {
            notifications.success(`Удалено ${deletedCount} отфильтрованных сделок из ${originalCount}`);
        }
    }

    async groupTrades() {
        const ungroupedTrades = this.trades.filter(t => !t.groupId);
        if (ungroupedTrades.length === 0) {
            notifications.warning('Нет несгруппированных сделок');
            return;
        }

        const groupName = await this.showGroupModal(ungroupedTrades.length);
        if (!groupName) return;

        const groupId = Date.now();
        ungroupedTrades.forEach(trade => {
            trade.groupId = groupId;
            trade.groupName = groupName;
        });

        this.saveTrades();
        this.updateDisplay();
        notifications.success(`Создана группа "${groupName}" с ${ungroupedTrades.length} сделками`);
    }

    getLastTradeDate() {
        if (this.trades.length === 0) return new Date().toISOString().split('T')[0];
        const sortedTrades = [...this.trades].sort((a, b) => new Date(b.date) - new Date(a.date));
        return sortedTrades[0].date;
    }

    changeDateBy(days) {
        const dateInput = document.querySelector('input[name="date"]');
        const currentDate = new Date(dateInput.value);
        currentDate.setDate(currentDate.getDate() + days);
        const newDateStr = currentDate.toISOString().split('T')[0];
        dateInput.value = newDateStr;

        // ДОБАВЛЯЕМ: Обновляем день недели в лейбле
        this.updateDateLabel(newDateStr);

        // Trigger change event для других обработчиков
        dateInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // ДОБАВЛЯЕМ новый метод для обновления лейбла
    updateDateLabel(dateStr) {
        const date = new Date(dateStr + 'T12:00:00');
        const daysRu = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
        const dayName = daysRu[date.getDay()];

        // Ищем label для поля даты
        const dateInput = document.querySelector('input[name="date"]');
        const label = dateInput?.closest('.form-group')?.querySelector('label');

        if (label) {
            const originalText = label.textContent.split('(')[0]; // Убираем старый день если есть
            label.textContent = `${originalText}(${dayName})`;
        }
    }

    // Методы для работы со скриншотами
    аsetScreenshotPreview(base64Data) {
        const placeholder = document.querySelector('.paste-placeholder');
        const preview = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImage');
        const hiddenInput = document.getElementById('screenshotData');

        if (placeholder && preview && previewImg && hiddenInput) {
            // Скрываем placeholder и показываем превью
            placeholder.style.display = 'none';
            preview.style.display = 'block';

            // Устанавливаем изображение
            previewImg.src = base64Data;

            // Сохраняем данные в скрытое поле
            hiddenInput.value = base64Data;

            console.log('📸 Скриншот установлен в превью');
        }
    }

    clearScreenshot() {
        const placeholder = document.querySelector('.paste-placeholder');
        const preview = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImage');
        const hiddenInput = document.getElementById('screenshotData');

        if (placeholder && preview && previewImg && hiddenInput) {
            // Показываем placeholder и скрываем превью
            placeholder.style.display = 'flex';
            preview.style.display = 'none';

            // Очищаем данные
            previewImg.src = '';
            hiddenInput.value = '';

            console.log('📸 Скриншот удален');
            notifications.info('Скриншот удален');
        }
    }



    // Обновленный метод clearForm
    clearForm() {
        const form = document.getElementById('tradeForm');
        form.reset();

        // НЕ очищаем поле результата - оставляем как есть
        // const resultInput = document.querySelector('input[name="result"]');
        // resultInput.value = '';

        const nextDate = this.getNextDate(this.getLastTradeDate());
        document.querySelector('input[name="date"]').value = nextDate;

        document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('[data-type="long"]').classList.add('active');

        // НЕ убираем подсветку с RR кнопок
        // document.querySelectorAll('.rr-btn').forEach(btn => btn.classList.remove('selected'));
    }

    getNextDate(lastDate) {
        const date = new Date(lastDate);
        date.setDate(date.getDate() + 1);
        return date.toISOString().split('T')[0];
    }

    showGroupModal(tradesCount) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal-backdrop';
            modal.innerHTML = `
                <div class="modal">
                    <h3>Создать группу</h3>
                    <p>Сгруппировать ${tradesCount} сделок</p>
                    <input type="text" id="groupNameInput" placeholder="Название группы" maxlength="50">
                    <div class="modal-actions">
                        <button id="cancelGroupBtn">Отмена</button>
                        <button id="confirmGroupBtn">Создать</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            const input = modal.querySelector('#groupNameInput');
            const confirmBtn = modal.querySelector('#confirmGroupBtn');
            const cancelBtn = modal.querySelector('#cancelGroupBtn');
            const backdrop = modal;

            input.focus();

            const closeModal = (result) => {
                document.body.removeChild(modal);
                resolve(result);
            };

            confirmBtn.addEventListener('click', () => {
                const groupName = input.value.trim();
                if (groupName) closeModal(groupName);
            });

            cancelBtn.addEventListener('click', () => closeModal(null));
            backdrop.addEventListener('click', () => closeModal(null));

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const groupName = input.value.trim();
                    if (groupName) closeModal(groupName);
                }
                if (e.key === 'Escape') closeModal(null);
            });
        });
    }

    showNewRrInput() {
        if (document.getElementById('newRrInput')) return; // Уже показано

        const addBtn = document.getElementById('addRrBtn');
        const input = document.createElement('input');
        input.type = 'number';
        input.id = 'newRrInput';
        input.step = '0.1';
        input.placeholder = 'RR';
        input.className = 'new-rr-input';
        input.style.cssText = `
            width: 80px;
            padding: 4px 8px;
            margin-left: 4px;
            background: var(--bg-secondary);
            border: 1px solid var(--border-primary);
            border-radius: 4px;
            color: var(--text-primary);
            font-size: 12px;
        `;

        addBtn.parentNode.insertBefore(input, addBtn.nextSibling);
        input.focus();

        // Обработчики для нового поля
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.processNewRr();
            }
            if (e.key === 'Escape') {
                this.hideNewRrInput();
            }
        });

        input.addEventListener('blur', () => {
            setTimeout(() => this.hideNewRrInput(), 150);
        });
    }

    hideNewRrInput() {
        const input = document.getElementById('newRrInput');
        if (input) {
            input.remove();
        }
    }

    ungroupTrades(groupName) {
        const groupedTrades = this.trades.filter(t => t.groupName === groupName);

        if (groupedTrades.length === 0) {
            notifications.warning('Группа не найдена');
            return;
        }

        // Убираем группировку
        groupedTrades.forEach(trade => {
            delete trade.groupId;
            delete trade.groupName;
        });

        this.saveTrades();
        this.updateDisplay();
        notifications.success(`Расгруппировано ${groupedTrades.length} сделок из группы "${groupName}"`);
    }

    processNewRr() {
        const input = document.getElementById('newRrInput');
        const newValue = input.value.trim();

        if (newValue && !isNaN(newValue)) {
            this.addCustomRr(parseFloat(newValue));
            this.hideNewRrInput();
        } else if (newValue) {
            notifications.error('Введите корректное число');
        }
    }

    addCustomRr(value) {
        const valueStr = value.toString();
        if (!this.rrValues.includes(valueStr)) {
            this.rrValues.push(valueStr);
            this.rrValues.sort((a, b) => parseFloat(a) - parseFloat(b));
            localStorage.setItem('customRrValues', JSON.stringify(this.rrValues));
            this.updateRrButtons();
            notifications.success(`Добавлено RR: ${value}`);
        } else {
            notifications.warning('Такое RR значение уже существует');
        }
    }

    removeCurrentRr() {
        const resultInput = document.querySelector('input[name="result"]');
        const currentValue = resultInput.value;

        if (currentValue && this.rrValues.includes(currentValue)) {
            // Не удаляем если осталось меньше 3 значений
            if (this.rrValues.length <= 3) {
                notifications.warning('Нельзя удалить - должно остаться минимум 3 значения RR');
                return;
            }

            this.rrValues = this.rrValues.filter(v => v !== currentValue);
            localStorage.setItem('customRrValues', JSON.stringify(this.rrValues));

            // Удаляем кнопку из интерфейса
            const btnToRemove = document.querySelector(`[data-rr="${currentValue}"]`);
            if (btnToRemove) {
                btnToRemove.style.transition = 'all 0.3s ease';
                btnToRemove.style.opacity = '0';
                btnToRemove.style.transform = 'scale(0.8)';
                setTimeout(() => btnToRemove.remove(), 300);
            }

            // Очищаем поле
            resultInput.value = '';
            notifications.success(`Удалено RR: ${currentValue}`);
        } else {
            notifications.warning('Выберите RR значение для удаления');
        }
    }



    updateRrButtons() {
        const container = document.querySelector('.rr-buttons');
        const addBtn = container.querySelector('.add-rr-btn');
        const removeBtn = container.querySelector('.remove-rr-btn');

        // Удаляем старые кнопки RR
        container.querySelectorAll('.rr-btn').forEach(btn => btn.remove());

        // Добавляем новые кнопки RR
        this.rrValues.forEach(value => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'rr-btn';
            btn.dataset.rr = value;
            btn.textContent = parseFloat(value) > 0 ? `+${value}` : value;
            container.insertBefore(btn, addBtn);

            btn.addEventListener('click', () => {
                const resultInput = document.querySelector('input[name="result"]');
                resultInput.value = value;

                // Подсветка выбранной кнопки
                container.querySelectorAll('.rr-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });
    }

    changeTradeType(tradeId) {
        const trade = this.trades.find(t => t.id === parseInt(tradeId));
        if (!trade) return;

        // Проверяем возраст сделки
        const tradeAge = Date.now() - new Date(trade.createdAt).getTime();
        if (tradeAge >= 300000) { // 5 минут
            notifications.warning('Нельзя изменить тип сделки (прошло больше 5 минут)');
            return;
        }

        // Меняем тип
        trade.type = trade.type === 'long' ? 'short' : 'long';

        this.saveTrades();
        this.updateDisplay();

        const typeIcon = trade.type === 'long' ? '😇' : '😈';
        const typeText = trade.type === 'long' ? 'LONG' : 'SHORT';
        notifications.success(`Тип сделки изменен на ${typeIcon} ${typeText}`);
    }


    createScreenshotModal() {
        // Проверяем если модалка уже создана
        if (document.getElementById('screenshotModal')) return;

        const modal = document.createElement('div');
        modal.id = 'screenshotModal';
        modal.className = 'screenshot-modal';
        modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-trade-info"></div>
                    <button class="modal-close-btn">×</button>
                </div>
                <div class="modal-body">
                    <button class="nav-btn prev" id="prevTradeBtn">←</button>
                    <img class="modal-screenshot" src="" alt="Screenshot">
                    <button class="nav-btn next" id="nextTradeBtn">→</button>
                    <div class="modal-controls">
                        <span id="modalZoomInfo">Клик для увеличения • ← → навигация</span>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Элементы модального окна
        const img = modal.querySelector('.modal-screenshot');
        const backdrop = modal.querySelector('.modal-backdrop');
        const closeBtn = modal.querySelector('.modal-close-btn');
        const prevBtn = modal.querySelector('#prevTradeBtn');
        const nextBtn = modal.querySelector('#nextTradeBtn');
        const zoomInfo = modal.querySelector('#modalZoomInfo');

        // Переменные для drag & drop
        let isDragging = false;
        let dragStartX, dragStartY, imgStartX, imgStartY;
        let currentTradeIndex = 0;
        let tradesWithScreenshots = [];

        // Закрытие модального окна
        const closeModal = () => {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
            this.resetImageTransform(img);
        };

        closeBtn.addEventListener('click', closeModal);
        backdrop.addEventListener('click', closeModal);

        // Клик на изображение - увеличение к точке клика
        img.addEventListener('click', (e) => {
            e.stopPropagation();
            this.zoomToPoint(img, e, zoomInfo);
        });

        // Исправленный Drag & Drop
        img.addEventListener('mousedown', (e) => {
            const zoomLevel = parseInt(img.dataset.zoomLevel || '1');
            if (zoomLevel > 1) {
                isDragging = true;
                img.classList.add('dragging');

                // Сохраняем начальные позиции мыши и изображения
                dragStartX = e.clientX;
                dragStartY = e.clientY;
                imgStartX = parseInt(img.style.left) || 0;
                imgStartY = parseInt(img.style.top) || 0;

                e.preventDefault();
                e.stopPropagation();
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();

            // Простое перемещение без сложных вычислений границ
            const deltaX = e.clientX - dragStartX;
            const deltaY = e.clientY - dragStartY;
            const newX = imgStartX + deltaX;
            const newY = imgStartY + deltaY;

            // Применяем новые позиции
            img.style.left = newX + 'px';
            img.style.top = newY + 'px';
        });

        document.addEventListener('mouseup', (e) => {
            if (isDragging) {
                isDragging = false;
                img.classList.remove('dragging');
                e.stopPropagation();
            }
        });

        // Навигация между сделками
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showPreviousScreenshot();
        });

        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showNextScreenshot();
        });

        // Клавиатурная навигация
        document.addEventListener('keydown', (e) => {
            if (modal.style.display !== 'none') {
                switch (e.key) {
                    case 'Escape':
                        closeModal();
                        break;
                    case 'ArrowLeft':
                        e.preventDefault();
                        this.showPreviousScreenshot();
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        this.showNextScreenshot();
                        break;
                    case ' ':
                        e.preventDefault();
                        this.zoomToPoint(img, e, zoomInfo);
                        break;
                }
            }
        });

        // Сохраняем ссылки для использования в других методах
        this.modal = modal;
        this.modalImg = img;
        this.modalZoomInfo = zoomInfo;
        this.modalPrevBtn = prevBtn;
        this.modalNextBtn = nextBtn;
    }

    zoomToPoint(img, event, zoomInfo) {
        let currentZoom = parseInt(img.dataset.zoomLevel || '1');
        const newZoom = currentZoom >= 3 ? 1 : currentZoom + 1;

        if (newZoom === 1) {
            this.resetImageTransform(img);
        } else {
            img.classList.add('zoomed');
            img.style.transform = `scale(${newZoom}) translate(-50%, -50%)`;
            img.dataset.zoomLevel = newZoom;
        }

        // Обновляем информацию о зуме
        if (zoomInfo) {
            const position = `${this.currentTradeIndex + 1} / ${this.tradesWithScreenshots.length}`;
            const zoomText = newZoom === 1 ? 'Клик для увеличения' : `${newZoom}x • Зажми и тяни`;
            zoomInfo.textContent = `${position} • ${zoomText} • ← → навигация`;
        }
    }

    // Вспомогательные методы для модального окна
    updateTradesWithScreenshots(currentTradeId) {
        // Получаем все сделки со скриншотами, отсортированные по времени создания
        this.tradesWithScreenshots = this.trades
            .filter(t => t.screenshotData)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Находим индекс текущей сделки
        this.currentTradeIndex = this.tradesWithScreenshots.findIndex(t => t.id === currentTradeId);

        // Обновляем состояние навигационных кнопок
        this.updateNavigationButtons();
    }

    updateNavigationButtons() {
        if (!this.modalPrevBtn || !this.modalNextBtn) return;

        const totalTrades = this.tradesWithScreenshots.length;

        this.modalPrevBtn.disabled = this.currentTradeIndex >= totalTrades - 1;
        this.modalNextBtn.disabled = this.currentTradeIndex <= 0;

        // Обновляем информацию о позиции
        if (this.modalZoomInfo) {
            const position = `${this.currentTradeIndex + 1} / ${totalTrades}`;
            this.modalZoomInfo.textContent = `${position} • Клик для увеличения • ← → навигация`;
        }
    }

    showPreviousScreenshot() {
        if (this.currentTradeIndex < this.tradesWithScreenshots.length - 1) {
            this.currentTradeIndex++;
            const prevTrade = this.tradesWithScreenshots[this.currentTradeIndex];
            this.loadTradeInModal(prevTrade);
        }
    }

    showNextScreenshot() {
        if (this.currentTradeIndex > 0) {
            this.currentTradeIndex--;
            const nextTrade = this.tradesWithScreenshots[this.currentTradeIndex];
            this.loadTradeInModal(nextTrade);
        }
    }

    loadTradeInModal(trade) {
        if (!this.modalImg || !this.modal) return;

        // Сбрасываем трансформации
        this.resetImageTransform(this.modalImg);

        // Загружаем новое изображение
        this.modalImg.src = trade.screenshotData;

        // Обновляем информацию о сделке
        const tradeInfo = this.modal.querySelector('.modal-trade-info');

        // В методе loadTradeInModal() замени блок обновления информации:
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

        // Обновляем навигацию
        this.updateNavigationButtons();
    }

    zoomScreenshot(img, zoomInfo) {
        let currentZoom = parseInt(img.dataset.zoomLevel || '1');

        // Циклический зум: 1x -> 2x -> 3x -> 1x
        currentZoom = currentZoom >= 3 ? 1 : currentZoom + 1;

        if (currentZoom === 1) {
            this.resetImageTransform(img);
        } else {
            img.style.transform = `scale(${currentZoom})`;
            img.style.position = 'relative';
            img.style.left = '0px';
            img.style.top = '0px';
            img.classList.add('zoomed');
        }

        img.dataset.zoomLevel = currentZoom;

        // Обновляем информацию о зуме
        if (zoomInfo) {
            const position = `${this.currentTradeIndex + 1} / ${this.tradesWithScreenshots.length}`;
            const zoomText = currentZoom === 1 ? 'Клик для увеличения' : `${currentZoom}x • Зажми и тяни`;
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


    zoomScreenshot(img) {
        let currentZoom = parseInt(img.dataset.zoomLevel);

        // Циклический зум: 1x -> 2x -> 3x -> 1x
        currentZoom = currentZoom >= 3 ? 1 : currentZoom + 1;

        img.style.transform = `scale(${currentZoom})`;
        img.dataset.zoomLevel = currentZoom;

        const zoomInfo = img.closest('.modal-body').querySelector('.zoom-info');
        zoomInfo.textContent = currentZoom === 1 ? 'Кликни на изображение для увеличения' : `Увеличение: ${currentZoom}x`;

        console.log('🔍 Зум изображения:', currentZoom + 'x');
    }
    bindEvents() {
        console.log('🎯 bindEvents() вызван');
        const self = this;

        // Инициализируем RR кнопки при загрузке
        this.initializeRrButtons();

        // Инициализация кастомных календарей
        setTimeout(() => {
            initCustomCalendars('input[type="date"]', {
                language: 'en-US',
                onDateSelect: (selectedDate) => {
                    console.log('Date selected:', selectedDate);
                }
            });
        }, 100);

        // Обработчик просмотра скриншота
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-screenshot-btn')) {
                const tradeId = parseInt(e.target.dataset.tradeId);
                this.showScreenshotModal(tradeId);
            }
        });

        // Обработчик вставки изображений из буфера обмена - С ОТЛАДКОЙ
        document.addEventListener('paste', (e) => {
            console.log('📋 Paste event detected');

            const pasteArea = document.getElementById('screenshotPasteArea');
            const formContainer = document.getElementById('tradeFormContainer');

            console.log('📋 Paste area found:', !!pasteArea);
            console.log('📋 Form container display:', formContainer?.style.display);

            if (!pasteArea || formContainer?.style.display === 'none') {
                console.log('📋 Форма не открыта, игнорируем paste');
                return;
            }

            const items = e.clipboardData?.items;
            console.log('📋 Clipboard items:', items ? items.length : 'null');

            if (!items) {
                console.log('📋 Нет clipboard items');
                return;
            }

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                console.log('📋 Item', i, ':', item.type);

                if (item.type.indexOf('image') !== -1) {
                    console.log('📋 Найдено изображение:', item.type);
                    e.preventDefault(e);

                    const file = item.getAsFile();
                    console.log('📋 File:', file);

                    if (!file) {
                        console.log('📋 Не удалось получить файл');
                        continue;
                    }

                    const reader = new FileReader();

                    reader.onload = (event) => {
                        console.log('📋 FileReader onload');
                        const base64 = event.target.result;
                        console.log('📋 Base64 length:', base64.length);

                        self.setScreenshotPreview(base64);
                        notifications.success('Скриншот вставлен из буфера обмена');
                    };

                    reader.onerror = (error) => {
                        console.error('📋 FileReader error:', error);
                    };

                    reader.readAsDataURL(file);
                    break;
                }
            }
        });
        // Обработчик удаления изображения - ИСПРАВЛЕНО
        document.addEventListener('click', (e) => {
            if (e.target.id === 'removeImageBtn') {
                self.clearScreenshot(); // Используем self вместо this
            }
        });

        // Клик по области для фокуса
        document.addEventListener('click', (e) => {
            if (e.target.closest('#screenshotPasteArea')) {
                notifications.info('Нажми ⌘+V чтобы вставить скриншот');
            }
        });

        // Сохранение последней выбранной валюты при изменении
        document.addEventListener('change', (e) => {
            if (e.target.name === 'currency') {
                localStorage.setItem('lastSelectedCurrency', e.target.value);
            }
        });

        // Сохранение последней выбранной группы при изменении - ИСПРАВЛЕНО
        document.addEventListener('change', (e) => {
            if (e.target.name === 'category') {
                // Сохраняем ЛЮБОЕ значение, даже пустое (для "Без группы")
                localStorage.setItem('lastSelectedGroup', e.target.value);
                console.log('Сохранена группа:', e.target.value || 'Без группы');
            }
        });

        // Добавление нового RR значения
        document.getElementById('addRrBtn').addEventListener('click', () => {
            this.showNewRrInput();
        });

        // Удаление RR значения
        document.getElementById('removeRrBtn').addEventListener('click', () => {
            this.removeCurrentRr();
        });

        // Показать/скрыть форму
        document.getElementById('addTradeBtn').addEventListener('click', () => {
            const container = document.getElementById('tradeFormContainer');
            container.style.display = container.style.display === 'none' ? 'block' : 'none';
        });

        document.getElementById('cancelTradeBtn').addEventListener('click', () => {
            document.getElementById('tradeFormContainer').style.display = 'none';
        });

        // Переключение типа сделки
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Рандом режим
        document.getElementById('randomMode').addEventListener('change', (e) => {
            this.randomMode = e.target.checked;
            localStorage.setItem('randomModeState', JSON.stringify(this.randomMode));
        });

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('ungroup-btn')) {
                const groupName = e.target.dataset.group;
                this.ungroupTrades(groupName);
            }
        });

        // Сворачивание/разворачивание групп
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('collapse-btn')) {
                const groupName = e.target.dataset.group;
                this.toggleGroupCollapse(groupName);
            }
        });

        // Обновленный обработчик submit формы в bindEvents():
        document.getElementById('tradeForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('🔥 Form submitted!');

            const formData = new FormData(e.target);
            const activeType = document.querySelector('.type-btn.active').dataset.type;
            let rrValue = formData.get('result');

            // Если поле RR пустое - выбираем случайное значение
            if (!rrValue || rrValue.trim() === '') {
                const randomIndex = Math.floor(Math.random() * this.rrValues.length);
                rrValue = this.rrValues[randomIndex];

                // Устанавливаем значение в поле
                document.querySelector('input[name="result"]').value = rrValue;

                // Подсвечиваем соответствующую кнопку
                document.querySelectorAll('.rr-btn').forEach(btn => btn.classList.remove('selected'));
                const targetBtn = document.querySelector(`[data-rr="${rrValue}"]`);
                if (targetBtn) {
                    targetBtn.classList.add('selected');
                }

                notifications.info(`Автоматически выбрано RR: ${rrValue}`);
            }

            const tradeData = {
                type: activeType,
                currency: formData.get('currency'),
                date: formData.get('date'),
                result: parseFloat(rrValue),
                category: formData.get('category'),
                screenshotData: formData.get('screenshotData') || null // Изменено на screenshotData
            };

            console.log('📊 Trade data:', tradeData);

            try {
                await self.addTrade(tradeData);

                // Очищаем только поле RR для следующей сделки
                document.querySelector('input[name="result"]').value = '';
                document.querySelectorAll('.rr-btn').forEach(btn => btn.classList.remove('selected'));

                // Очищаем скриншот
                this.clearScreenshot();

            } catch (error) {
                console.error('❌ Ошибка при добавлении сделки:', error);
                notifications.error('Ошибка при сохранении сделки');
            }
        });

        // Фильтры
        document.getElementById('currencyFilter').addEventListener('change', (e) => {
            this.currentFilter.currency = e.target.value;
            this.updateDisplay();
        });

        document.getElementById('resultFilter').addEventListener('change', (e) => {
            this.currentFilter.result = e.target.value;
            this.updateDisplay();
        });

        document.getElementById('dateFromFilter').addEventListener('change', (e) => {
            this.currentFilter.dateFrom = e.target.value;
            this.updateDisplay();
        });

        document.getElementById('dateToFilter').addEventListener('change', (e) => {
            this.currentFilter.dateTo = e.target.value;
            this.updateDisplay();
        });

        document.getElementById('groupFilter').addEventListener('change', (e) => {
            this.currentFilter.group = e.target.value;
            this.updateDisplay();
        });

        document.getElementById('clearFiltersBtn').addEventListener('click', () => {
            this.currentFilter = { currency: 'all', result: 'all', dateFrom: '', dateTo: '' };
            document.getElementById('currencyFilter').value = 'all';
            document.getElementById('resultFilter').value = 'all';
            document.getElementById('dateFromFilter').value = '';
            document.getElementById('dateToFilter').value = '';
            this.updateDisplay();
        });

        // Клик на дату для подстановки в форму
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('trade-date')) {
                const date = e.target.dataset.date;
                const formContainer = document.getElementById('tradeFormContainer');

                // Открываем форму если закрыта
                if (formContainer.style.display === 'none') {
                    formContainer.style.display = 'block';
                }

                // Подставляем дату
                document.querySelector('input[name="date"]').value = date;
                notifications.info(`Дата ${this.formatDate(date)} подставлена в форму`);
            }
        });

        // Клик на тип сделки для изменения
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('trade-type') && !e.target.classList.contains('disabled')) {
                const tradeId = e.target.dataset.id;
                this.changeTradeType(tradeId);
            }
        });

        // Обновить существующий обработчик удаления сделок
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn') && !e.target.classList.contains('disabled')) {
                const tradeId = e.target.dataset.id;
                const trade = this.trades.find(t => t.id === parseInt(tradeId));

                if (trade) {
                    const tradeAge = Date.now() - new Date(trade.createdAt).getTime();
                    if (tradeAge >= 300000) { // 5 минут
                        notifications.warning('Нельзя удалить сделку (прошло больше 5 минут)');
                        return;
                    }
                }

                this.deleteTrade(tradeId);
            }
        });

        // Управление датой
        document.getElementById('prevDateBtn').addEventListener('click', () => {
            this.changeDateBy(-1);
        });

        document.getElementById('nextDateBtn').addEventListener('click', () => {
            this.changeDateBy(1);
        });

        // Очистка формы
        document.getElementById('clearFormBtn').addEventListener('click', () => {
            this.clearForm();
        });

        // Обновить этот блок в методе bindEvents()
        document.getElementById('clearAllBtn').addEventListener('click', async () => {
            const filteredCount = this.getFilteredTrades().length;
            const totalCount = this.trades.length;

            let message;
            if (filteredCount === totalCount) {
                message = `Удалить все ${totalCount} сделок из журнала?`;
            } else {
                message = `Удалить ${filteredCount} отфильтрованных сделок из ${totalCount} общих?`;
            }

            const confirmed = await notifications.confirm(
                message,
                'Очистка журнала',
                'Удалить',
                'Отмена'
            );
            if (confirmed) this.clearAllTrades();
        });

        document.getElementById('groupTradesBtn').addEventListener('click', () => {
            this.groupTrades();
        });

        // Горячие клавиши
        document.addEventListener('keydown', (e) => {
            const formContainer = document.getElementById('tradeFormContainer');
            const isFormOpen = formContainer && formContainer.style.display !== 'none';

            // Пробел для открытия формы (только если форма закрыта)
            if (e.code === 'Space' && !isFormOpen && !e.target.matches('input, textarea, select')) {
                e.preventDefault();
                document.getElementById('addTradeBtn').click();
                return;
            }

            // Если форма открыта
            if (isFormOpen) {
                // Пробел для переключения RR значений (когда форма открыта)
                if (e.code === 'Space' && !e.target.matches('input, textarea, select')) {
                    e.preventDefault();
                    this.cycleRrValue();
                    return;
                }

                // Enter для сохранения формы
                if (e.key === 'Enter' && !e.target.matches('select, input[type="date"], input[type="number"]')) {
                    e.preventDefault();
                    document.querySelector('#tradeForm button[type="submit"]').click();
                    return;
                }

                // Стрелки влево/вправо для даты с подсветкой
                if (e.code === 'ArrowLeft') {
                    e.preventDefault();
                    this.changeDateBy(-1);
                    this.highlightDateButton('prev');
                }

                if (e.code === 'ArrowRight') {
                    e.preventDefault();
                    this.changeDateBy(1);
                    this.highlightDateButton('next');
                }

                // Tab для переключения типа сделки
                if (e.code === 'Tab') {
                    // Проверяем, что мы не в полях ввода
                    if (!e.target.matches('input, select, button')) {
                        e.preventDefault();
                        const activeBtn = document.querySelector('.type-btn.active');
                        if (activeBtn) {
                            const isLong = activeBtn.dataset.type === 'long';
                            document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
                            document.querySelector(`[data-type="${isLong ? 'short' : 'long'}"]`).classList.add('active');
                        }
                    }
                }
            }
        });

        // Инициализация дня недели при загрузке страницы
        setTimeout(() => {
            const dateInput = document.querySelector('input[name="date"]');
            if (dateInput && dateInput.value) {
                this.updateDateLabel(dateInput.value);
                console.log('Инициализирован день недели для даты:', dateInput.value);
            }
        }, 100);
    }
}