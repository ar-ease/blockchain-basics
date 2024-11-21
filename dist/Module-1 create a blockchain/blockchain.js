"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// Module 1 -Create a blockchain
// part 1 - building a blockchain
const app = (0, express_1.default)();
const crypto_ts_1 = require("crypto-ts");
const now = new Date();
const Time = now.toLocaleTimeString();
console.log(Time);
const encryptedMessage = crypto_ts_1.AES.encrypt("message", "test").toString();
console.log(encryptedMessage);
app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
