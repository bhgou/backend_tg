"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bot_1 = __importDefault(require("./bot"));
const router = express_1.default.Router();
// Вебхук для Telegram
router.post('/webhook', (req, res) => {
    bot_1.default.handleUpdate(req.body, res);
});
router.get('/webhook', (req, res) => {
    res.send('Webhook is working');
});
exports.default = router;
