import { readFile, writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { sanitizeProjectPath } from "./project-path.js";

const HISTORY_DIR = path.join(os.homedir(), ".debash", "history");
const MAX_ENTRIES = 50;

function historyFilePath(cwd) {
  return path.join(HISTORY_DIR, `${sanitizeProjectPath(cwd)}.log`);
}

export async function loadHistory(cwd = process.cwd()) {
  try {
    const content = await readFile(historyFilePath(cwd), "utf8");
    return content.split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

export async function appendHistory(entry, cwd = process.cwd()) {
  const existing = await loadHistory(cwd);
  if (existing[existing.length - 1] === entry) {
    return;
  }

  const updated = [...existing, entry].slice(-MAX_ENTRIES);
  await mkdir(HISTORY_DIR, { recursive: true, mode: 0o700 });
  await writeFile(historyFilePath(cwd), `${updated.join("\n")}\n`, { mode: 0o600 });
}
