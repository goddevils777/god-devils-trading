import mongoose from 'mongoose';

const signalSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['long', 'short']
    },
    symbol: {
        type: String,
        required: true,
        default: 'UNKNOWN'
    },
    price: {
        type: Number,
        required: true,
        default: 0
    },
    session: {
        type: String,
        required: true,
        default: 'Unknown'
    },
    confidence: {
        type: Number,
        default: 75,
        min: 0,
        max: 100
    },
    signalNumber: {
        type: Number,
        default: 1
    },
    source: {
        type: String,
        default: 'TradingView'
    },
    status: {
        type: String,
        default: 'new',
        enum: ['new', 'active', 'closed']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Индексы для быстрого поиска
signalSchema.index({ type: 1, createdAt: -1 });
signalSchema.index({ session: 1, createdAt: -1 });
signalSchema.index({ symbol: 1, createdAt: -1 });

export const Signal = mongoose.model('Signal', signalSchema);