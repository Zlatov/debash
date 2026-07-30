#!/usr/bin/env node

import readline from "node:readline";
import pc from "picocolors";
import { getApiKey } from "../src/config.js";
import { sendMessage } from "../src/deepseek.js";
import { bashTool, saveRecipeTool, runBashCommand, findDangerousMatch } from "../src/tools.js";
import { loadProjectContext } from "../src/context.js";
import { loadCache, saveRecipe } from "../src/cache.js";
import { statusIcon, withSpinner, llmMessage, debashMessage, debashError } from "../src/ui.js";
import { renderMarkdown } from "../src/markdown.js";

let lastBlockType = null;

function printBlock(type, text) {
  if (lastBlockType !== null && lastBlockType !== type) {
    console.log();
  }
  console.log(text);
  lastBlockType = type;
}

console.log();
console.log(pc.bold("▌║█║▌│║▌│║▌║▌█║ debash ▌│║▌║▌│║║▌█║▌║█"));
console.log();

const apiKey = await getApiKey();

if (!apiKey) {
  printBlock("debash", debashError("Без API-ключа debash не может отвечать. Запустите заново, когда ключ будет готов."));
  process.exit(1);
}

const history = [
  {
    role: "system",
    content:
      "Ты — debash, минималистичный консольный помощник разработчика. " +
      "Если для ответа нужно что-то проверить или выполнить в проекте — используй инструмент bash. " +
      "Перед тем как предлагать или выполнять команды, изучи проект: если выше уже есть содержимое " +
      "README/CLAUDE/AGENTS/DEBASH.md — используй его; дополнительно проверь структуру каталогов и " +
      "файлы вроде Makefile, docker-compose.yml, package.json, если это важно для задачи. " +
      "Предпочитай уже существующие в проекте способы (make-таргеты, npm-скрипты и т.п.) собственным " +
      "придуманным командам. Если выше уже есть рецепты из прошлых debash-сессий для похожей задачи — " +
      "сразу используй их, не исследуй проект заново. Правило про save_recipe: если для ответа на " +
      "запрос пользователя тебе пришлось сначала посмотреть на файлы проекта (Makefile, package.json, " +
      "docker-compose.yml и т.п.), чтобы понять, какую команду выполнить — обязательно вызови " +
      "save_recipe после успешного результата, даже если сама финальная команда одна. Важно не число " +
      "команд, а то, что в следующий раз это не придётся выяснять заново. Не вызывай save_recipe, " +
      "только если пользователь сам явно назвал нужную команду и исследовать было нечего. " +
      "Не сохраняй неудачные попытки. Работай относительно текущей рабочей директории. " +
      "Отвечай кратко и по делу.",
  },
];

const { messages: contextMessages, found: contextFiles } = await loadProjectContext();
history.push(...contextMessages);

if (contextFiles.length > 0) {
  printBlock("debash", debashMessage(`Изучаю проект: найдено ${contextFiles.join(", ")}`));
} else {
  printBlock(
    "debash",
    debashMessage("Изучаю проект: README/CLAUDE/AGENTS/DEBASH.md не найдены, буду исследовать по ходу работы."),
  );
}

const cacheContent = await loadCache();
if (cacheContent) {
  history.push({
    role: "system",
    content: `Рецепты команд, проверенные в предыдущих debash-сессиях в этом проекте:\n\n${cacheContent}`,
  });
  printBlock("debash", debashMessage("Найден кэш рецептов из предыдущих сессий debash для этого проекта."));
}

const tools = [bashTool, saveRecipeTool];
const MAX_STEPS = 10;

let pendingConfirmationResolve = null;

function askConfirmation(command, reason) {
  return new Promise((resolve) => {
    printBlock("debash", debashMessage(`⚠ Похоже на опасную команду (${reason}): ${command}`));
    pendingConfirmationResolve = resolve;
    rl.setPrompt("Выполнить? (y/N): ");
    rl.prompt();
  });
}

async function runTurn() {
  for (let step = 0; step < MAX_STEPS; step++) {
    const message = await sendMessage(history, apiKey, tools);
    history.push(message);

    if (!message.tool_calls || message.tool_calls.length === 0) {
      printBlock("llm", llmMessage(renderMarkdown(message.content)));
      return;
    }

    for (const toolCall of message.tool_calls) {
      const args = JSON.parse(toolCall.function.arguments);

      if (toolCall.function.name === "save_recipe") {
        await saveRecipe(args.intent, args.commands, args.note);
        printBlock("debash", `${pc.green("✔")} Рецепт сохранён: ${args.intent}`);
        history.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: "Рецепт сохранён.",
        });
        continue;
      }

      const { command } = args;
      printBlock("debash", debashMessage(`→ ${command}`));

      const danger = findDangerousMatch(command);
      if (danger) {
        const answer = await askConfirmation(command, danger);
        if (!/^(y|yes|да)$/i.test(answer.trim())) {
          printBlock("debash", debashMessage("Отменено пользователем."));
          history.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: "Команда не выполнена: пользователь отклонил подтверждение.",
          });
          continue;
        }
      }

      const result = await withSpinner(runBashCommand(command));
      printBlock("debash", `${statusIcon(result.exitCode === 0)} ${pc.dim(command)}`);

      const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
      if (output) {
        console.log(output);
      }

      history.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: `exit code: ${result.exitCode}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
      });
    }
  }

  printBlock("debash", debashError("Слишком много шагов подряд, прерываю."));
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "❯ ",
});

function showNextPrompt() {
  if (lastBlockType !== null) {
    console.log();
  }
  lastBlockType = null;
  rl.prompt();
}

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
        await runTurn();
      } catch (error) {
        printBlock("debash", debashError(`Ошибка запроса к DeepSeek: ${error.message}`));
      }
    }

    showNextPrompt();
  }

  processing = false;
}

showNextPrompt();

rl.on("line", (input) => {
  const text = input.trim();

  if (pendingConfirmationResolve) {
    const resolve = pendingConfirmationResolve;
    pendingConfirmationResolve = null;
    rl.setPrompt("❯ ");
    resolve(text);
    return;
  }

  lastBlockType = "user";
  queue.push(text);
  processQueue();
});

rl.on("close", () => {
  console.log();
  process.exit(0);
});
