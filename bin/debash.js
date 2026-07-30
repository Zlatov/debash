#!/usr/bin/env node

import readline from "node:readline";

const line = "─".repeat(42);

console.log();
console.log(line);
console.log();
console.log("  Debash");
console.log();
console.log(line);
console.log();

const history = [];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "> ",
});

rl.prompt();

rl.on("line", (input) => {
  const text = input.trim();

  if (text === "exit") {
    rl.close();
    return;
  }

  if (text) {
    history.push({ role: "user", content: text });
    console.log(text);
    history.push({ role: "assistant", content: text });
  }

  rl.prompt();
});

rl.on("close", () => {
  console.log();
  process.exit(0);
});
