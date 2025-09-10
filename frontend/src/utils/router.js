import { AuthModule } from '../modules/auth/auth.js';
import { SignalsModule } from '../modules/signals/signals.js';
import { DashboardModule } from '../modules/dashboard/dashboard.js';

export class AppRouter {
    constructor() {
        this.routes = {
            '/': 'auth',
            '/login': 'auth',
            '/dashboard': 'dashboard',
            '/signals': 'signals'
        };
        this.currentRoute = '/';
        this.isAuthenticated = localStorage.getItem('token') !== null;
        this.authModule = new AuthModule();
        this.signalsModule = new SignalsModule();
    }

    init() {
        this.handleRouteChange();
        window.addEventListener('popstate', () => this.handleRouteChange());
        this.setupNavigation();
    }

    handleRouteChange() {
        const path = window.location.pathname;
        this.currentRoute = path;
        this.render();
    }

    async render() {
        const app = document.getElementById('app');

        if (!this.isAuthenticated && this.currentRoute !== '/' && this.currentRoute !== '/login') {
            this.navigate('/');
            return;
        }

        if (this.isAuthenticated && (this.currentRoute === '/' || this.currentRoute === '/login')) {
            this.navigate('/dashboard');
            return;
        }

        switch (this.currentRoute) {
            case '/':
            case '/login':
                app.innerHTML = this.authModule.render();
                setTimeout(() => this.authModule.bindEvents(), 0);
                break;
            case '/dashboard':
                app.innerHTML = await this.renderDashboard();
                setTimeout(async () => {
                    const dashboard = new DashboardModule();
                    dashboard.bindEvents();
                }, 0);
                break;
            case '/signals':
                app.innerHTML = this.renderSignalsPage();
                setTimeout(() => this.signalsModule.bindEvents(), 0);
                break;
            default:
                app.innerHTML = this.render404();
        }
    }

    async renderDashboard() {
        const dashboard = new DashboardModule();
        const dashboardContent = await dashboard.render();

        return `
        <div class="dashboard">
            <nav class="sidebar">
                <div class="logo">😇 God & Devils 😈</div>
                <ul class="nav-menu">
                    <li><a href="/dashboard" class="nav-link active">Dashboard</a></li>
                    <li><a href="/signals" class="nav-link">Сигналы</a></li>
                    <li><button class="logout-btn">Выйти</button></li>
                </ul>
            </nav>
            <main class="main-content">
                ${dashboardContent}
            </main>
        </div>
    `;
    }
    renderSignalsPage() {
        return `
            <div class="dashboard">
                <nav class="sidebar">
                    <div class="logo">😇 God & Devils 😈</div>
                    <ul class="nav-menu">
                        <li><a href="/dashboard" class="nav-link">Dashboard</a></li>
                        <li><a href="/signals" class="nav-link active">Сигналы</a></li>
                        <li><button class="logout-btn">Выйти</button></li>
                    </ul>
                </nav>
                <main class="main-content">
                    ${this.signalsModule.render()}
                </main>
            </div>
        `;
    }

    render404() {
        return '<h1>404 - Страница не найдена</h1>';
    }

    setupNavigation() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('.nav-link')) {
                e.preventDefault();
                this.navigate(e.target.getAttribute('href'));
            }

            if (e.target.matches('.logout-btn')) {
                this.logout();
            }
        });
    }

    navigate(path) {
        window.history.pushState({}, '', path);
        this.handleRouteChange();
    }

    logout() {
        localStorage.removeItem('token');
        this.isAuthenticated = false;
        this.navigate('/');
    }
}