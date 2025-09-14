// frontend/src/utils/CustomCalendar.js
export class CustomCalendar {
    constructor(inputElement, options = {}) {
        this.input = inputElement;
        this.options = {
            onDateSelect: options.onDateSelect || null,
            language: options.language || 'en-US',
            theme: options.theme || 'default',
            ...options
        };
        
        // Если в input есть значение, устанавливаем его как текущую дату для календаря
        if (inputElement.value) {
            this.currentDate = new Date(inputElement.value + 'T00:00:00');
            this.selectedDate = new Date(inputElement.value + 'T00:00:00');
        } else {
            this.currentDate = new Date();
            this.selectedDate = null;
        }
        
        this.isOpen = false;
        
        this.monthNames = this.options.language === 'ru-RU' ? 
            ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
             'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'] :
            ['January', 'February', 'March', 'April', 'May', 'June',
             'July', 'August', 'September', 'October', 'November', 'December'];
             
        this.weekDays = this.options.language === 'ru-RU' ?
            ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'] :
            ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        
        this.setupCustomCalendar();
    }
    
    setupCustomCalendar() {
        // Скрываем нативный календарь
        this.input.style.position = 'relative';
        
        // Создаем обертку
        const wrapper = document.createElement('div');
        wrapper.className = 'custom-date-wrapper';
        this.input.parentNode.insertBefore(wrapper, this.input);
        wrapper.appendChild(this.input);
        
        // Создаем кнопку календаря
        const calendarBtn = document.createElement('button');
        calendarBtn.type = 'button';
        calendarBtn.className = 'custom-calendar-btn';
        calendarBtn.innerHTML = '📅';
        calendarBtn.setAttribute('aria-label', 'Open calendar');
        wrapper.appendChild(calendarBtn);
        
        // Создаем календарь
        this.calendar = document.createElement('div');
        this.calendar.className = 'custom-calendar';
        this.calendar.setAttribute('role', 'dialog');
        this.calendar.setAttribute('aria-label', 'Date picker');
        wrapper.appendChild(this.calendar);
        
        this.attachEventListeners(wrapper, calendarBtn);
        this.loadStyles();
    }
    
    attachEventListeners(wrapper, calendarBtn) {
        // Открытие календаря
        calendarBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });
        
        this.input.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });
        
        // Закрытие при клике вне календаря
        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                this.close();
            }
        });
        
        // Клавиатурная навигация
        this.calendar.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });
    }
    
    handleKeyDown(e) {
        switch(e.key) {
            case 'Escape':
                this.close();
                this.input.focus();
                break;
            case 'Enter':
                if (e.target.classList.contains('calendar-day') && !e.target.classList.contains('empty')) {
                    this.selectDate(e.target.dataset.date);
                }
                break;
        }
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    open() {
        this.isOpen = true;
        this.calendar.style.display = 'block';
        
        // Анимация появления
        requestAnimationFrame(() => {
            this.calendar.style.opacity = '1';
            this.calendar.style.transform = 'translateY(0)';
        });
        
        this.render();
        
        // Фокус на календаре для accessibility
        setTimeout(() => {
            const todayEl = this.calendar.querySelector('.calendar-day.today') || 
                           this.calendar.querySelector('.calendar-day:not(.empty)');
            if (todayEl) todayEl.focus();
        }, 100);
    }
    
    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        this.calendar.style.opacity = '0';
        this.calendar.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            this.calendar.style.display = 'none';
        }, 200);
    }
    
    render() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const today = new Date();
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        let html = `
            <div class="calendar-header">
                <button type="button" class="calendar-nav" data-action="prev-month" aria-label="Previous month">‹</button>
                <span class="calendar-title">${this.monthNames[month]} ${year}</span>
                <button type="button" class="calendar-nav" data-action="next-month" aria-label="Next month">›</button>
            </div>
            <div class="calendar-weekdays">
                ${this.weekDays.map(day => `<div>${day}</div>`).join('')}
            </div>
            <div class="calendar-days">
        `;
        
        // Пустые ячейки для начала месяца
        for (let i = 0; i < firstDay; i++) {
            html += '<div class="calendar-day empty" aria-hidden="true"></div>';
        }
        
        // Дни месяца
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = date.toISOString().split('T')[0];
            const isToday = date.toDateString() === today.toDateString();
            const isSelected = this.selectedDate && date.toDateString() === this.selectedDate.toDateString();
            
            html += `<div class="calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" 
                          data-date="${dateStr}" 
                          role="button" 
                          tabindex="0"
                          aria-label="${this.monthNames[month]} ${day}, ${year}"
                          ${isSelected ? 'aria-pressed="true"' : ''}>${day}</div>`;
        }
        
        html += '</div>';
        this.calendar.innerHTML = html;
        
        // Привязываем события
        this.calendar.addEventListener('click', (e) => this.handleCalendarClick(e));
    }
    
    handleCalendarClick(e) {
        if (e.target.classList.contains('calendar-day') && !e.target.classList.contains('empty')) {
            const dateStr = e.target.dataset.date;
            this.selectDate(dateStr);
        } else if (e.target.classList.contains('calendar-nav')) {
            const action = e.target.dataset.action;
            if (action === 'prev-month') {
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                this.render();
            } else if (action === 'next-month') {
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                this.render();
            }
        }
    }
    
    selectDate(dateStr) {
        this.input.value = dateStr;
        this.selectedDate = new Date(dateStr);
        this.close();
        
        // Callback
        if (this.options.onDateSelect) {
            this.options.onDateSelect(dateStr);
        }
        
        // Trigger события
        this.input.dispatchEvent(new Event('change', { bubbles: true }));
        this.input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    destroy() {
        if (this.calendar) {
            this.calendar.remove();
        }
        // Восстанавливаем оригинальную структуру
        const wrapper = this.input.closest('.custom-date-wrapper');
        if (wrapper) {
            wrapper.parentNode.insertBefore(this.input, wrapper);
            wrapper.remove();
        }
    }
    
    loadStyles() {
        // Проверяем, загружены ли уже стили
        if (document.querySelector('#custom-calendar-styles')) return;
        
        const styleSheet = document.createElement('style');
        styleSheet.id = 'custom-calendar-styles';
        styleSheet.textContent = this.getCSS();
        document.head.appendChild(styleSheet);
    }
    
    getCSS() {
        return `
/* Custom Calendar Styles */
.custom-date-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
}

.custom-calendar-btn {
    position: absolute;
    right: 8px;
    background: none;
    border: none;
    font-size: 16px;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.15s ease;
    z-index: 10;
}

.custom-calendar-btn:hover {
    background: var(--yellow-primary);
    transform: scale(1.1);
}

.custom-calendar {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 1000;
    background: var(--bg-card);
    border: 1px solid var(--border-primary);
    border-radius: 8px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    padding: 16px;
    min-width: 280px;
    margin-top: 4px;
    opacity: 0;
    transform: translateY(-10px);
    transition: all 0.2s ease;
}

.calendar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
}

.calendar-nav {
    background: var(--bg-secondary);
    border: 1px solid var(--border-primary);
    border-radius: 4px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s ease;
    color: var(--text-secondary);
    font-size: 18px;
    font-weight: bold;
}

.calendar-nav:hover {
    background: var(--yellow-primary);
    color: #000;
    border-color: var(--yellow-primary);
}

.calendar-title {
    font-weight: 600;
    color: var(--text-primary);
    font-size: 16px;
}

.calendar-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    margin-bottom: 8px;
}

.calendar-weekdays > div {
    text-align: center;
    font-size: 12px;
    color: var(--text-secondary);
    font-weight: 500;
    padding: 8px 4px;
}

.calendar-days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
}

.calendar-day {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 6px;
    font-size: 14px;
    color: var(--text-primary);
    transition: all 0.15s ease;
    user-select: none;
    border: none;
    background: none;
}

.calendar-day:hover:not(.empty) {
    background: var(--yellow-primary);
    color: #000;
    transform: scale(1.05);
}

.calendar-day:focus:not(.empty) {
    outline: 2px solid var(--yellow-primary);
    outline-offset: 2px;
}

.calendar-day.today {
    background: var(--blue-primary, #3b82f6);
    color: white;
    font-weight: 600;
}

.calendar-day.selected {
    background: var(--green-primary);
    color: white;
    font-weight: 600;
}

.calendar-day.selected:hover {
    background: var(--green-primary);
    color: white;
    transform: scale(1.05);
}

.calendar-day.empty {
    cursor: default;
    color: transparent;
}

/* Hide native calendar picker */
.custom-date-wrapper input[type="date"]::-webkit-calendar-picker-indicator {
    opacity: 0;
    pointer-events: none;
    position: absolute;
    right: 0;
    width: 0;
    height: 0;
}

.custom-date-wrapper input[type="date"]::-webkit-inner-spin-button,
.custom-date-wrapper input[type="date"]::-webkit-clear-button {
    -webkit-appearance: none;
    display: none;
}

/* Firefox */
.custom-date-wrapper input[type="date"]::-moz-calendar-picker-indicator {
    opacity: 0;
    pointer-events: none;
}
        `;
    }
}

// Функция-хелпер для инициализации
export function initCustomCalendars(selector = 'input[type="date"]', options = {}) {
    const dateInputs = document.querySelectorAll(selector);
    const instances = [];
    
    dateInputs.forEach(input => {
        if (!input.classList.contains('custom-calendar-initialized')) {
            input.classList.add('custom-calendar-initialized');
            const instance = new CustomCalendar(input, options);
            instances.push(instance);
        }
    });
    
    return instances;
}