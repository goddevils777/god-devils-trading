import './auth.css';
import { notifications } from '../../utils/notifications.js';

export class AuthModule {
    constructor() {
        this.apiUrl = 'https://god-devils-trade.fly.dev/api';
        this.token = localStorage.getItem('token');
    }

    render() {
        return `
            <div class="auth-container">
                <div class="auth-header">
                    <h1 class="logo">😇 God & Devils 😈</h1>
                    <p>Trading Strategy Platform</p>
                </div>
                
                <div class="auth-tabs">
                    <button class="tab-btn active" data-tab="login">Вход</button>
                    <button class="tab-btn" data-tab="register">Регистрация</button>
                </div>
                
                <div class="auth-forms">
                    <form id="loginForm" class="auth-form active">
                        <input type="email" placeholder="Email" required>
                        <input type="password" placeholder="Пароль" required>
                        <button type="submit">Войти</button>
                    </form>
                    
                    <form id="registerForm" class="auth-form">
                        <input type="email" placeholder="Email" required>
                        <input type="password" placeholder="Пароль" required>
                        <input type="password" placeholder="Повторите пароль" required>
                        <button type="submit">Регистрация</button>
                    </form>
                </div>
            </div>
        `;
    }

    bindEvents() {
        this.setupTabs();
        this.setupForms();
    }

    setupTabs() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });
    }

    switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));

        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(tab + 'Form').classList.add('active');
    }

    setupForms() {
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login(e.target);
        });

        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.register(e.target);
        });
    }

    async login(form) {
        try {
            const formData = new FormData(form);
            const email = formData.get('email') || form.querySelector('input[type="email"]').value;
            const password = formData.get('password') || form.querySelector('input[type="password"]').value;

            const response = await fetch(`${this.apiUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                this.showSuccess('Вход выполнен успешно!');
                setTimeout(() => window.location.reload(), 1000);
            } else {
                this.showError(data.error);
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Ошибка подключения к серверу');
        }
    }

    async register(form) {
        try {
            const inputs = form.querySelectorAll('input');
            const email = inputs[0].value;
            const password = inputs[1].value;
            const confirmPassword = inputs[2].value;

            const response = await fetch(`${this.apiUrl}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, confirmPassword })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                this.showSuccess('Регистрация успешна!');
                setTimeout(() => window.location.reload(), 1000);
            } else {
                this.showError(data.error);
            }
        } catch (error) {
            console.error('Register error:', error);
            this.showError('Ошибка подключения к серверу');
        }
    }

    showError(message) {
        notifications.error(message);
    }

    showSuccess(message) {
        notifications.success(message);
    }
}