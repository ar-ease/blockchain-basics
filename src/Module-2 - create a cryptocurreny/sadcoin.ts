//module 2 - creating a cryptocurrency
import express from "express";
import { SHA256 } from "crypto-js";

const app = express();
interface Block {
  index: number;
  timestamp: string;
  proof: number;
  previous_hash: string;
  transactions: any[];
  nodes: Set<any>;
}

class Blockchain {
  public chain: Block[];
  public transactions: any[];
  public nodes: Set<any>;

  constructor() {
    this.chain = [];
    this.transactions = [];

    this.nodes = new Set();
    this.createBlock(1, "0");
  }

  createBlock(proof: number, previous_hash: string): Block {
    const block: Block = {
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

  getPreviousBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  proofOfWork(previous_proof: number): number {
    let new_proof = 1;
    let check_proof = false;

    while (!check_proof) {
      const hash_operation = SHA256(
        (new_proof ** 2 - previous_proof ** 2).toString(),
      ).toString();
      if (hash_operation.substring(0, 4) === "0000") {
        check_proof = true;
      } else {
        new_proof += 1;
      }
    }
    return new_proof;
  }

  hash(block: Block): string {
    const encoded_block = JSON.stringify(block, Object.keys(block).sort());
    return SHA256(encoded_block).toString();
  }

  isChainValid(chain: Block[]): boolean {
    let previous_block = chain[0];
    let block_index = 1;

    while (block_index < chain.length) {
      const block = chain[block_index];
      if (block.previous_hash !== this.hash(previous_block)) {
        return false;
      }

      const proof = block.proof;
      const previous_proof = previous_block.proof;

      const hash_operation = SHA256(
        (proof ** 2 - previous_proof ** 2).toString(),
      ).toString();

      if (hash_operation.substring(0, 4) !== "0000") {
        return false;
      }

      previous_block = block;
      block_index += 1;
    }
    return true;
  }
  addTransaction(sender: string, receiver: string, amount: number) {
    this.transactions.push({
      sender,
      receiver,
      amount,
    });
    const previous_block = this.getPreviousBlock();
    return previous_block["index"] + 1;
  }
  addNode(address: string) {
    this.nodes.add(new URL(address));
  }
  replaceChain() {
    const network = this.nodes;
    let longest_chain = null;
    let max_length = this.chain.length;

    network.forEach(async (node) => {
      const response = await fetch(`http://${node}/get_block`);
      const data = await response.json();
      const length = data.length;
      const chain = data.chain;
      if (length > max_length && this.isChainValid(chain)) {
        max_length = length;
        longest_chain = chain;
      }
    });

    if (longest_chain) {
      this.chain = longest_chain;
      return true;
    }
    return false;
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
  } else {
    res.json({
      message: "Houston, we have a problem",
    });
  }
});
app.listen(3000, () => {
  console.log("server is running on port 3000");
});
