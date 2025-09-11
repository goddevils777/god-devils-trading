export class NotificationManager {
    constructor() {
        this.container = null;
        this.createContainer();
    }

    createContainer() {
        // Создаем контейнер для уведомлений если его нет
        if (!document.getElementById('notifications-container')) {
            this.container = document.createElement('div');
            this.container.id = 'notifications-container';
            this.container.className = 'notifications-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('notifications-container');
        }
    }

    show(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;

        // Иконки для разных типов
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        notification.innerHTML = `
            <div class="notification-icon">${icons[type] || icons.info}</div>
            <div class="notification-message">${message}</div>
            <button class="notification-close">×</button>
        `;

        // Добавляем в контейнер
        this.container.appendChild(notification);

        // Анимация появления
        setTimeout(() => {
            notification.classList.add('notification-show');
        }, 10);

        // Обработчик закрытия
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.hide(notification);
        });

        // Автоматическое скрытие
        if (duration > 0) {
            setTimeout(() => {
                this.hide(notification);
            }, duration);
        }

        return notification;
    }

    hide(notification) {
        notification.classList.add('notification-hide');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    success(message, duration = 5000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 7000) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = 6000) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 5000) {
        return this.show(message, 'info', duration);
    }

    // Очистить все уведомления
    clear() {
        const notifications = this.container.querySelectorAll('.notification');
        notifications.forEach(notification => {
            this.hide(notification);
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

    confirm(message, title = 'Подтверждение', confirmText = 'Да', cancelText = 'Отмена') {
        return new Promise((resolve) => {
            // Создаем модальное окно
            const modal = document.createElement('div');
            modal.className = 'notification-modal';

            modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn modal-btn-cancel">${cancelText}</button>
                    <button class="modal-btn modal-btn-confirm">${confirmText}</button>
                </div>
            </div>
        `;

            document.body.appendChild(modal);

            // Анимация появления
            setTimeout(() => modal.classList.add('modal-show'), 10);

            // Обработчики кнопок
            const confirmBtn = modal.querySelector('.modal-btn-confirm');
            const cancelBtn = modal.querySelector('.modal-btn-cancel');
            const backdrop = modal.querySelector('.modal-backdrop');

            const closeModal = (result) => {
                modal.classList.add('modal-hide');
                setTimeout(() => {
                    document.body.removeChild(modal);
                    resolve(result);
                }, 200);
            };

            confirmBtn.addEventListener('click', () => closeModal(true));
            cancelBtn.addEventListener('click', () => closeModal(false));
            backdrop.addEventListener('click', () => closeModal(false));

            // ESC для закрытия
            // ESC и Enter для закрытия
            const handleKeydown = (e) => {
                if (e.key === 'Escape') {
                    document.removeEventListener('keydown', handleKeydown);
                    closeModal(false);
                }
                if (e.key === 'Enter') {
                    e.preventDefault();
                    document.removeEventListener('keydown', handleKeydown);
                    closeModal(true);
                }
            };
            document.addEventListener('keydown', handleKeydown);
        });
    }
}

// Создаем глобальный экземпляр
export const notifications = new NotificationManager();