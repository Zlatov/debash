import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";

const ENV_VAR = "DEBASH_DEEPSEEK_API_KEY";
const CONFIG_DIR = path.join(os.homedir(), ".debash");
const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");

function readConfigFile() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  } catch {
    return null;
  }
}

function saveApiKey(apiKey) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify({ deepseekApiKey: apiKey }, null, 2), {
    mode: 0o600,
  });
}

function askApiKey() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log("Ключ DeepSeek не найден.");
    console.log("Получить его можно здесь: https://platform.deepseek.com/api_keys");
    console.log();

    rl.question("Вставьте API-ключ: ", (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export async function getApiKey() {
  if (process.env[ENV_VAR]) {
    return process.env[ENV_VAR];
  }

  const config = readConfigFile();
  if (config?.deepseekApiKey) {
    return config.deepseekApiKey;
  }

  const apiKey = await askApiKey();
  if (!apiKey) {
    return null;
  }

  saveApiKey(apiKey);
  console.log(`\nКлюч сохранён в ${CONFIG_PATH}\n`);
  return apiKey;
}
