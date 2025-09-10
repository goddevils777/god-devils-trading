console.log('🚀 Main.js loading...');

import './styles/main.css';

console.log('✅ CSS imported');

import { AuthModule } from './modules/auth/auth.js';
import { SignalsModule } from './modules/signals/signals.js';
import { AppRouter } from './utils/router.js';

console.log('✅ Modules imported');

class App {
    constructor() {
        console.log('🏗️ App constructor called');
        this.router = new AppRouter();
        this.init();
    }

    init() {
        console.log('⚡ App init called');
        this.setupServiceWorker();
        this.router.init();
        console.log('✅ App fully initialized');
    }

    setupServiceWorker() {
        console.log('📱 Setting up service worker');
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(err => {
                console.log('❌ SW registration failed:', err);
            });
        }
    }
}

console.log('📄 DOM loading...');

// Запуск приложения
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM loaded, starting app');
    try {
        new App();
        console.log('🎉 App started successfully');
    } catch (error) {
        console.error('💥 App startup failed:', error);
    }
});

console.log('🏁 Main.js loaded completely');