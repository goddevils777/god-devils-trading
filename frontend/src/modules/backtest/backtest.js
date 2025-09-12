import './backtest.css';
import { notifications } from '../../utils/notifications.js';

export class BacktestModule {
    constructor() {
        this.trades = JSON.parse(localStorage.getItem('backtestTrades')) || [];
        this.currencies = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD', 'EURGBP', 'EURJPY'];
        this.rrValues = JSON.parse(localStorage.getItem('customRrValues')) || ['-1', '-0.8', '0', '1.5', '2'];
        this.currentFilter = { currency: 'all', result: 'all', category: 'all', group: 'all', dateFrom: '', dateTo: '' };
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

    renderTradeForm() {
        const lastTradeDate = this.getLastTradeDate();
        const nextDate = this.getNextDate(lastTradeDate);
        const lastGroup = localStorage.getItem('lastSelectedGroup') || '';

        return `
        <div class="trade-form">
            <h3>Новая сделка</h3>
            <form id="tradeForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>Тип</label>
                        <div class="trade-type-buttons">
                            <button type="button" class="type-btn active" data-type="long">Long</button>
                            <button type="button" class="type-btn" data-type="short">Short</button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Валютная пара</label>
                        <select name="currency" required>
                            ${this.currencies.map(cur => `<option value="${cur}">${cur}</option>`).join('')}
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
                    <div class="form-group">
                        <label>Результат (RR)</label>
                            <div class="rr-controls">
                                <div class="rr-buttons" id="rrButtonsContainer">
                                    <button type="button" class="add-rr-btn" id="addRrBtn">+</button>
                                    <button type="button" class="remove-rr-btn" id="removeRrBtn">−</button>
<span class="mini-toggle-label">R</span>
<label class="mini-toggle-switch">
    <input type="checkbox" id="randomMode">
    <span class="mini-toggle-slider"></span>
</label>
                                </div>
                                <div class="rr-input-row">
                                    <input type="number" name="result" step="0.1" value="" placeholder="0" required>
                                </div>
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
                        <span>выбрать RR</span>
                    </div>
                    <div class="hotkey">
                        <kbd>← →</kbd>
                        <span>изменить дату</span>
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
                    <option value="breakeven">Безубыток</option>
                </select>
            </div>
            <div class="filter-group">
                <label>Группа:</label>
                <select id="groupFilter">
                    <option value="all">Все</option>
                    <option value="ungrouped">Несгруппированные</option>
                    ${groups.map(group => `<option value="${group}">${group}</option>`).join('')}
                </select>
            </div>
            <div class="filter-group">
                <label>С даты:</label>
                <input type="date" id="dateFromFilter">
            </div>
            <div class="filter-group">
                <label>По дату:</label>
                <input type="date" id="dateToFilter">
            </div>
            <button id="clearFiltersBtn">Сбросить</button>
        </div>
    `;
    }

    renderStats() {
        const filteredTrades = this.getFilteredTrades();
        const totalTrades = filteredTrades.length;
        const winTrades = filteredTrades.filter(t => t.result > 0).length;
        const lossTrades = filteredTrades.filter(t => t.result < 0).length;
        const breakEvenTrades = filteredTrades.filter(t => t.result === 0).length;

        // Винрейт считается только от прибыльных и убыточных (исключая безубыточные)
        const tradesWithResult = winTrades + lossTrades;
        const winRate = tradesWithResult > 0 ? ((winTrades / tradesWithResult) * 100).toFixed(1) : 0;
        const totalPnL = filteredTrades.reduce((sum, t) => sum + t.result, 0).toFixed(1);

        return `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">${totalTrades}</div>
                <div class="stat-label">Всего сделок</div>
            </div>
            <div class="stat-card win">
                <div class="stat-number">${winTrades}</div>
                <div class="stat-label">Прибыльных</div>
            </div>
            <div class="stat-card loss">
                <div class="stat-number">${lossTrades}</div>
                <div class="stat-label">Убыточных</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${breakEvenTrades}</div>
                <div class="stat-label">Безубыточных</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${winRate}%</div>
                <div class="stat-label">Винрейт</div>
            </div>
            <div class="stat-card ${totalPnL >= 0 ? 'win' : 'loss'}">
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
        let result = '';

        return `
        <div class="trades-table">
            <div class="table-header">
                <div>Дата</div>
                <div>Тип</div>
                <div>Валюта</div>
                <div>Результат</div>
                <div>Действия</div>
            </div>
            ${filteredTrades.map(trade => {
            let groupHeader = '';

            // Показываем заголовок группы только если группа изменилась
            if (trade.groupName && trade.groupName !== currentGroup) {
                currentGroup = trade.groupName;
                groupHeader = `
                        <div class="group-separator">
                            📁 ${trade.groupName}
                        </div>
                    `;
            } else if (!trade.groupName && currentGroup !== null) {
                // Сбрасываем группу для несгруппированных сделок
                currentGroup = null;
            }

            return `
                    ${groupHeader}
                    <div class="table-row ${trade.groupName ? 'grouped' : ''}">
                        <div class="trade-date">${this.formatDate(trade.date)}</div>
                        <div class="trade-type ${trade.type}">${trade.type.toUpperCase()}</div>
                        <div class="trade-currency">${trade.currency}</div>
                        <div class="trade-result ${trade.result > 0 ? 'profit' : trade.result < 0 ? 'loss' : 'breakeven'}">
                            ${trade.result > 0 ? '+' : ''}${trade.result} RR
                            </div>
                    <div class="trade-actions">
                        <button class="delete-btn" data-id="${trade.id}">✕</button>
                    </div>
                    </div>
                `;
        }).join('')}
        </div>
    `;
    }

    showGroupModal(ungroupedCount) {
        const modal = document.createElement('div');
        modal.className = 'group-modal';
        modal.innerHTML = `
        <div class="modal-backdrop"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3>Создание группы</h3>
            </div>
            <div class="modal-body">
                <p>Несгруппированных сделок: <strong>${ungroupedCount}</strong></p>
                <input type="text" id="groupNameInput" placeholder="Введите название группы" autofocus>
            </div>
            <div class="modal-footer">
                <button id="cancelGroupBtn">Отмена</button>
                <button id="confirmGroupBtn">Создать</button>
            </div>
        </div>
    `;

        document.body.appendChild(modal);

        return new Promise((resolve) => {
            const confirmBtn = modal.querySelector('#confirmGroupBtn');
            const cancelBtn = modal.querySelector('#cancelGroupBtn');
            const backdrop = modal.querySelector('.modal-backdrop');
            const input = modal.querySelector('#groupNameInput');

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



    addCustomRr(value) {
        if (!this.rrValues.includes(value.toString())) {
            this.rrValues.push(value.toString());
            this.rrValues.sort((a, b) => parseFloat(a) - parseFloat(b));
            localStorage.setItem('customRrValues', JSON.stringify(this.rrValues));
            this.updateRrButtons();
        }
    }

    updateRrButtons() {
        const container = document.querySelector('.rr-buttons');
        const addBtn = container.querySelector('.add-rr-btn');

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
                document.querySelector('input[name="result"]').value = value;
            });
        });
    }

    getNextRrValue(currentValue, isRandom = false) {
        if (isRandom) {
            const randomIndex = Math.floor(Math.random() * this.rrValues.length);
            return this.rrValues[randomIndex];
        }

        // Логика: 0 → +максимальное → -максимальное → +следующее → -следующее
        const positiveValues = this.rrValues.filter(v => parseFloat(v) > 0).sort((a, b) => parseFloat(b) - parseFloat(a)); // По убыванию
        const negativeValues = this.rrValues.filter(v => parseFloat(v) < 0).sort((a, b) => parseFloat(a) - parseFloat(b)); // По возрастанию (от -1 к -2)
        const zeroValue = this.rrValues.find(v => parseFloat(v) === 0);

        // Создаем последовательность: 0, +2, -2, +1, -1, +3, -3...
        const sequence = [];
        if (zeroValue) sequence.push(zeroValue);

        const maxLength = Math.max(positiveValues.length, negativeValues.length);
        for (let i = 0; i < maxLength; i++) {
            if (positiveValues[i]) sequence.push(positiveValues[i]);
            if (negativeValues[i]) sequence.push(negativeValues[i]);
        }

        if (currentValue === '' || !sequence.includes(currentValue)) {
            return sequence[0] || this.rrValues[0];
        }

        const currentIndex = sequence.indexOf(currentValue);
        const nextIndex = (currentIndex + 1) % sequence.length;
        return sequence[nextIndex];
    }
    showNewRrInput() {
        if (document.getElementById('newRrInput')) return; // Уже показано

        const addBtn = document.getElementById('addRrBtn');
        const input = document.createElement('input');
        input.type = 'number';
        input.id = 'newRrInput';
        input.step = '0.1';
        input.placeholder = 'RR';
        input.className = 'new-rr-input-inline';

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

    initializeRrButtons() {
        const container = document.querySelector('.rr-buttons');
        const addBtn = container.querySelector('.add-rr-btn');

        // Очищаем все кнопки кроме "+"
        container.querySelectorAll('.rr-btn').forEach(btn => btn.remove());

        // Добавляем все сохраненные RR кнопки
        this.rrValues.forEach(value => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'rr-btn';
            btn.dataset.rr = value;
            btn.textContent = parseFloat(value) > 0 ? `+${value}` : value;
            container.insertBefore(btn, addBtn);

            btn.addEventListener('click', () => {
                document.querySelector('input[name="result"]').value = value;
            });
        });
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

    getExistingGroups() {
        return [...new Set(this.trades.filter(t => t.groupName).map(t => t.groupName))];
    }


    clearAllTrades() {
        this.trades = [];
        this.saveTrades();
        this.updateDisplay();
        notifications.success('Журнал очищен');
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
        dateInput.value = currentDate.toISOString().split('T')[0];
    }

    clearForm() {
        const form = document.getElementById('tradeForm');
        form.reset();

        // Принудительно очищаем поле результата
        const resultInput = document.querySelector('input[name="result"]');
        resultInput.value = '';

        const nextDate = this.getNextDate(this.getLastTradeDate());
        document.querySelector('input[name="date"]').value = nextDate;

        // Сбрасываем активный тип на Long
        document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('[data-type="long"]').classList.add('active');

        // Убираем подсветку с RR кнопок
        document.querySelectorAll('.rr-btn').forEach(btn => btn.classList.remove('selected'));
    }

    getNextDate(lastDate) {
        const date = new Date(lastDate);
        date.setDate(date.getDate() + 1);
        return date.toISOString().split('T')[0];
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
            // Сначала сортируем по группам, потом по дате
            if (a.groupName && !b.groupName) return -1;
            if (!a.groupName && b.groupName) return 1;
            if (a.groupName !== b.groupName) return (a.groupName || '').localeCompare(b.groupName || '');
            return new Date(b.date) - new Date(a.date);
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

    addTrade(tradeData) {

        console.log('🔄 addTrade вызван с данными:', tradeData);

        const trade = {
            id: Date.now(),
            ...tradeData,
            createdAt: new Date().toISOString()
        };

        console.log('💾 Создан объект сделки:', trade);
        console.log('📊 Текущий массив trades до добавления:', this.trades.length);
        // Если выбрана существующая группа
        if (tradeData.category) {
            const existingGroup = this.trades.find(t => t.groupName === tradeData.category);
            if (existingGroup) {
                trade.groupId = existingGroup.groupId;
                trade.groupName = tradeData.category;
            }
        }

        // Сохранить последнюю выбранную группу
        if (tradeData.category) {
            localStorage.setItem('lastSelectedGroup', tradeData.category);
        }

        this.trades.push(trade);
        this.saveTrades();
        this.updateDisplay();
        notifications.success('Сделка добавлена');
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

    bindEvents() {
        console.log('🎯 bindEvents() вызван');
        const self = this;
        console.log('📋 Форма найдена:', document.getElementById('tradeForm'));

        const submitBtn = document.querySelector('#tradeForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.click();
        } else {
            // Если кнопки нет, отправляем событие submit напрямую
            const form = document.getElementById('tradeForm');
            if (form) {
                console.log('🚀 Dispatching submit event from hotkey');
                form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            }
        }
        console.log('🎯 Кнопка submit найдена:', submitButton);

        // Инициализируем RR кнопки при загрузке
        this.initializeRrButtons();
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

        // Быстрый выбор RR
        document.querySelectorAll('.rr-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelector('input[name="result"]').value = btn.dataset.rr;
            });
        });


        // Существующий обработчик submit остается без изменений
        // Обработчик submit через делегирование
        document.addEventListener('submit', (e) => {
            console.log('🎯 SUBMIT EVENT CAUGHT! Target:', e.target.id, e.target);

            if (e.target.id === 'tradeForm') {
                console.log('🔥 Form submitted via delegation!');
                e.preventDefault();
                console.log('🔥 Form submitted via delegation!');

                const formData = new FormData(e.target);
                const activeType = document.querySelector('.type-btn.active').dataset.type;

                console.log('Form data:', {
                    type: activeType,
                    currency: formData.get('currency'),
                    date: formData.get('date'),
                    result: formData.get('result'),
                    category: formData.get('category')
                });

                self.addTrade({  // this. -> self.
                    type: activeType,
                    currency: formData.get('currency'),
                    date: formData.get('date'),
                    result: parseFloat(formData.get('result')),
                    category: formData.get('category')
                });

                self.clearForm();  // this. -> self.
                document.getElementById('tradeFormContainer').style.display = 'none';
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

        // Удаление сделок
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn')) {
                const tradeId = e.target.dataset.id;
                this.deleteTrade(tradeId);
            }
        });

        // Быстрый выбор RR с подсветкой
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('rr-btn')) {
                const value = e.target.dataset.rr;
                document.querySelector('input[name="result"]').value = value;

                // Подсветка выбранной кнопки
                document.querySelectorAll('.rr-btn').forEach(btn => btn.classList.remove('selected'));
                e.target.classList.add('selected');
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


        // Очистка и группировка
        document.getElementById('clearAllBtn').addEventListener('click', async () => {
            const confirmed = await notifications.confirm(
                'Удалить все сделки из журнала?',
                'Очистка журнала',
                'Удалить',
                'Отмена'
            );
            if (confirmed) this.clearAllTrades();
        });

        document.getElementById('groupTradesBtn').addEventListener('click', () => {
            this.groupTrades();
        });

        // Добавление нового RR значения
        document.getElementById('addRrBtn').addEventListener('click', () => {
            this.showNewRrInput();
        });

        // Удаление RR значения
        document.getElementById('removeRrBtn').addEventListener('click', () => {
            this.removeCurrentRr();
        });

        // Горячие клавиши
        // Горячие клавиши
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

            // Enter для сохранения формы (когда форма открыта)
            if (e.key === 'Enter' && isFormOpen && !e.target.matches('select, input[type="date"], input[type="number"]')) {
                e.preventDefault();
                document.querySelector('#tradeForm button[type="submit"]').click();
                return;
            }

            if (isFormOpen) {
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

                if (e.code === 'Tab' && isFormOpen) {
                    // Проверяем, что мы не в полях ввода и форма открыта
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

                if (e.code === 'Space' && !e.target.matches('input, select')) {
                    e.preventDefault();
                    const resultInput = document.querySelector('input[name="result"]');
                    const isRandom = document.getElementById('randomMode').checked;

                    const currentValue = resultInput.value;
                    const nextValue = this.getNextRrValue(currentValue, isRandom);
                    resultInput.value = nextValue;

                    // Подсветка кнопки
                    document.querySelectorAll('.rr-btn').forEach(btn => btn.classList.remove('selected'));
                    const selectedBtn = document.querySelector(`[data-rr="${nextValue}"]`);
                    if (selectedBtn) selectedBtn.classList.add('selected');
                }
            }
        });
    }
}