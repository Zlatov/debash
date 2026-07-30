import { readFile, writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { sanitizeProjectPath } from "./project-path.js";

const CACHE_DIR = path.join(os.homedir(), ".debash", "cache");

function cacheFilePath(cwd) {
  return path.join(CACHE_DIR, `${sanitizeProjectPath(cwd)}.md`);
}

export async function loadCache(cwd = process.cwd()) {
  try {
    return await readFile(cacheFilePath(cwd), "utf8");
  } catch {
    return null;
  }
}

function buildBlock(intent, commands, note) {
  const lines = [`## ${intent}`, "```bash", ...commands, "```"];
  if (note) {
    lines.push(`Заметка: ${note}`);
  }
  return lines.join("\n");
}

function splitSections(content) {
  const lines = content.split("\n");
  const sections = [];
  let current = [];

  for (const line of lines) {
    if (line.startsWith("## ") && current.length > 0) {
      sections.push(current.join("\n"));
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) {
    sections.push(current.join("\n"));
  }

  return sections.filter((section) => section.trim().length > 0);
}

export async function saveRecipe(intent, commands, note, cwd = process.cwd()) {
  const existing = (await loadCache(cwd)) ?? "";
  const heading = `## ${intent}`;
  const sections = splitSections(existing);
  const block = buildBlock(intent, commands, note);

  const index = sections.findIndex((section) => section.split("\n")[0] === heading);
  if (index >= 0) {
    sections[index] = block;
  } else {
    sections.push(block);
  }

  await mkdir(CACHE_DIR, { recursive: true, mode: 0o700 });
  await writeFile(cacheFilePath(cwd), `${sections.join("\n\n")}\n`, { mode: 0o600 });
}
