import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Временное хранилище пользователей (потом заменим на MongoDB)
const users = [];

// Регистрация
router.post('/register', async (req, res) => {
    try {
        const { email, password, confirmPassword } = req.body;

        // Валидация
        if (!email || !password || !confirmPassword) {
            return res.status(400).json({ error: 'Все поля обязательны' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Пароли не совпадают' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Пароль должен быть минимум 6 символов' });
        }

        // Проверка существования пользователя
        const existingUser = users.find(user => user.email === email);
        if (existingUser) {
            return res.status(400).json({ error: 'Пользователь уже существует' });
        }

        // Хеширование пароля
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Создание пользователя
        const user = {
            id: Date.now().toString(),
            email,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };

        users.push(user);

        // Создание JWT токена
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET || 'default-secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.status(201).json({
            message: 'Пользователь создан успешно',
            token,
            user: {
                id: user.id,
                email: user.email,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Вход
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Валидация
        if (!email || !password) {
            return res.status(400).json({ error: 'Email и пароль обязательны' });
        }

        // Поиск пользователя
        const user = users.find(user => user.email === email);
        if (!user) {
            return res.status(401).json({ error: 'Неверные учетные данные' });
        }

        // Проверка пароля
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Неверные учетные данные' });
        }

        // Создание JWT токена
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET || 'default-secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            message: 'Вход выполнен успешно',
            token,
            user: {
                id: user.id,
                email: user.email,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Проверка токена
router.get('/me', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Токен не предоставлен' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
        const user = users.find(user => user.id === decoded.userId);
        
        if (!user) {
            return res.status(401).json({ error: 'Пользователь не найден' });
        }

        res.json({
            user: {
                id: user.id,
                email: user.email,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        res.status(401).json({ error: 'Недействительный токен' });
    }
});

export default router;