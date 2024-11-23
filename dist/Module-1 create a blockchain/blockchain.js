"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const crypto_js_1 = require("crypto-js");
const app = (0, express_1.default)();
class Blockchain {
    constructor() {
        this.chain = [];
        this.createBlock(1, "0");
    }
    createBlock(proof, previous_hash) {
        const block = {
            index: this.chain.length + 1,
            timestamp: new Date().toString(),
            proof,
            previous_hash,
        };
        this.chain.push(block);
        return block;
    }
    getPreviousBlock() {
        return this.chain[this.chain.length - 1];
    }
    proofOfWork(previous_proof) {
        let new_proof = 1;
        let check_proof = false;
        while (!check_proof) {
            const hash_operation = (0, crypto_js_1.SHA256)((new_proof ** 2 - previous_proof ** 2).toString()).toString();
            if (hash_operation.substring(0, 4) === "0000") {
                check_proof = true;
            }
            else {
                new_proof += 1;
            }
        }
        return new_proof;
    }
    hash(block) {
        const encoded_block = JSON.stringify(block, Object.keys(block).sort());
        return (0, crypto_js_1.SHA256)(encoded_block).toString();
    }
    isChainValid(chain) {
        let previous_block = chain[0];
        let block_index = 1;
        while (block_index < chain.length) {
            const block = chain[block_index];
            if (block.previous_hash !== this.hash(previous_block)) {
                return false;
            }
            const proof = block.proof;
            const previous_proof = previous_block.proof;
            const hash_operation = (0, crypto_js_1.SHA256)((proof ** 2 - previous_proof ** 2).toString()).toString();
            if (hash_operation.substring(0, 4) !== "0000") {
                return false;
            }
            previous_block = block;
            block_index += 1;
        }
        return true;
    }
}
const blockchain = new Blockchain();
app.get("/", (req, res) => {
    res.json({
        message: "hello from port 3000",
    });
});
app.get("/mine_block", (req, res) => {
    const previous_block = blockchain.getPreviousBlock();
    const previous_proof = previous_block.proof;
    const proof = blockchain.proofOfWork(previous_proof);
    const previous_hash = blockchain.hash(previous_block);
    const block = blockchain.createBlock(proof, previous_hash);
    res
        .json({
        message: "Congratulations, you just mined a block!",
        index: block.index,
        timestamp: block.timestamp,
        proof: block.proof,
        previous_hash: block.previous_hash,
    })
        .status(200);
});
app.get("/get_block", (req, res) => {
    res.json({
        chain: blockchain.chain,
        length: blockchain.chain.length,
    });
});
app.get("/is_valid", (req, res) => {
    const is_valid = blockchain.isChainValid(blockchain.chain);
    if (is_valid) {
        res.json({
            message: "all good.The blockchain is valid",
        });
    }
    else {
        res.json({
            message: "Houston, we have a problem",
        });
    }
});
app.listen(3000, () => {
    console.log("server is running on port 3000");
});
