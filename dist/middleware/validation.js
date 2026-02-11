"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMarketListing = void 0;
const validateMarketListing = (req, res, next) => {
    const { itemId, price, duration } = req.body;
    if (!itemId || typeof itemId !== 'number') {
        return res.status(400).json({
            success: false,
            error: 'Неверный ID предмета'
        });
    }
    if (!price || typeof price !== 'number' || price < 10 || price > 1000000) {
        return res.status(400).json({
            success: false,
            error: 'Цена должна быть от 10 до 1,000,000 CR'
        });
    }
    if (!duration || typeof duration !== 'number' || duration < 1 || duration > 30) {
        return res.status(400).json({
            success: false,
            error: 'Длительность должна быть от 1 до 30 дней'
        });
    }
    next();
};
exports.validateMarketListing = validateMarketListing;
