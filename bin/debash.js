#!/usr/bin/env node

import readline from "node:readline";
import { getApiKey } from "../src/config.js";
import { sendMessage } from "../src/deepseek.js";

const line = "─".repeat(42);

console.log();
console.log(line);
console.log();
console.log("  Debash");
console.log();
console.log(line);
console.log();

const apiKey = await getApiKey();

if (!apiKey) {
  console.log("Без API-ключа debash не может отвечать. Запустите заново, когда ключ будет готов.");
  process.exit(1);
}

const history = [
  {
    role: "system",
    content: "Ты — debash, минималистичный консольный помощник разработчика. Отвечай кратко и по делу.",
  },
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "> ",
});

const queue = [];
let processing = false;

async function processQueue() {
  if (processing) {
    return;
  }
  processing = true;

  while (queue.length > 0) {
    const text = queue.shift();

    if (text === "exit") {
      rl.close();
      processing = false;
      return;
    }

    if (text) {
      history.push({ role: "user", content: text });

      try {
        const reply = await sendMessage(history, apiKey);
        history.push({ role: "assistant", content: reply });
        console.log(reply);
      } catch (error) {
        console.log(`Ошибка запроса к DeepSeek: ${error.message}`);
      }
    }

    rl.prompt();
  }

  processing = false;
}

rl.prompt();

rl.on("line", (input) => {
  queue.push(input.trim());
  processQueue();
});

rl.on("close", () => {
  console.log();
  process.exit(0);
});
