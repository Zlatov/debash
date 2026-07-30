import { readFile } from "node:fs/promises";
import path from "node:path";

const KNOWN_FILES = ["README.md", "CLAUDE.md", "AGENTS.md", "DEBASH.md"];
const MAX_CHARS = 8000;

export async function loadProjectContext(cwd = process.cwd()) {
  const found = [];
  const messages = [];

  for (const file of KNOWN_FILES) {
    let content;
    try {
      content = await readFile(path.join(cwd, file), "utf8");
    } catch {
      continue;
    }

    found.push(file);
    const truncated =
      content.length > MAX_CHARS
        ? `${content.slice(0, MAX_CHARS)}\n\n[... файл обрезан, полная длина ${content.length} символов]`
        : content;

    messages.push({
      role: "system",
      content: `Содержимое файла ${file} в текущем проекте:\n\n${truncated}`,
    });
  }

  return { messages, found };
}
