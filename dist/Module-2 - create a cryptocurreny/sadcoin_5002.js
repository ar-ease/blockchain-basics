"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//module 2 - creating a cryptocurrency
const crypto_js_1 = require("crypto-js");
class Blockchain {
    constructor() {
        this.chain = [];
        this.transactions = [];
        this.nodes = new Set();
        this.createBlock(1, "0");
    }
    createBlock(proof, previous_hash) {
        const block = {
            index: this.chain.length + 1,
            timestamp: new Date().toString(),
            proof,
            previous_hash,
            transactions: this.transactions,
            nodes: this.nodes,
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
    addTransaction(sender, receiver, amount) {
        this.transactions.push({
            sender,
            receiver,
            amount,
        });
        const previous_block = this.getPreviousBlock();
        return previous_block["index"] + 1;
    }
    addNode(address) {
        try {
            const url = new URL(`http://${address}`);
            this.nodes.add(url.host); // Just using host since that's what you need in fetch
        }
        catch (error) {
            throw new Error(`Invalid node address: ${address}`);
        }
    }
    replaceChain() {
        const network = this.nodes;
        let longest_chain = null;
        let max_length = this.chain.length;
        network.forEach((node) => __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`http://${node}/get_block`);
            const data = yield response.json();
            const length = data.length;
            const chain = data.chain;
            if (length > max_length && this.isChainValid(chain)) {
                max_length = length;
                longest_chain = chain;
            }
        }));
        if (longest_chain) {
            this.chain = longest_chain;
            return true;
        }
        return false;
    }
}
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
const uuid_1 = require("uuid");
const node_address = (0, uuid_1.v4)().replace(/-/g, "");
const blockchain = new Blockchain();
app.get("/", (_req, res) => {
    res.json({
        message: "hello from port 5002",
    });
});
app.get("/mine_block", (_req, res) => {
    const previous_block = blockchain.getPreviousBlock();
    const previous_proof = previous_block.proof;
    const proof = blockchain.proofOfWork(previous_proof);
    const previous_hash = blockchain.hash(previous_block);
    blockchain.addTransaction(node_address, "kenny", 1);
    const block = blockchain.createBlock(proof, previous_hash);
    res
        .status(200)
        .json({
        message: "Congratulations, you just mined a block!",
        index: block.index,
        timestamp: block.timestamp,
        proof: block.proof,
        previous_hash: block.previous_hash,
        transactions: block.transactions,
    })
        .status(200);
});
app.get("/get_block", (_req, res) => {
    res.json({
        chain: blockchain.chain,
        length: blockchain.chain.length,
    });
});
app.get("/is_valid", (_req, res) => {
    const is_valid = blockchain.isChainValid(blockchain.chain);
    if (is_valid) {
        res.json({
            message: "all good.The blockchain is valid",
        });
    }
    else {
        res.json({
            message: "ar-ease, we have a problem",
        });
    }
});
app.post("/add_transaction", (req, res) => {
    const { transaction } = req.body;
    if (!transaction.sender || !transaction.receiver || !transaction.amount) {
        res.status(400).json({ message: "invalid transaction data" });
    }
    const block_index = blockchain.addTransaction(transaction.sender, transaction.receiver, transaction.amount);
    res.json({
        message: `This transaction will be added to block ${block_index}`,
    });
});
app.post("/connect_node", (req, res) => {
    const { node } = req.body;
    console.log("this is the node" + node);
    if (!node) {
        res.status(400).json({ message: "invalid node data" });
    }
    blockchain.addNode(node);
    res.status(200).json({
        message: "All the nodes are now connected",
        total_nodes: Array.from(blockchain.nodes),
    });
});
app.get("/replace_chain", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const is_chain_replaced = blockchain.replaceChain();
    if (is_chain_replaced) {
        res.json({
            message: "The nodes had different chains so the chain was replaced",
            new_chain: blockchain.chain,
        });
    }
    else {
        res.json({
            message: "All good. The chain is the largest one",
            actual_chain: blockchain.chain,
        });
    }
}));
app.listen(5002, () => {
    console.log("server is running on port 5002");
});
