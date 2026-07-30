import pc from "picocolors";

function renderInline(text) {
  return text
    .replace(/`([^`]+)`/g, (_, code) => pc.cyan(code))
    .replace(/\*\*(.+?)\*\*/g, (_, bold) => pc.bold(bold))
    .replace(/__(.+?)__/g, (_, bold) => pc.bold(bold))
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, (_, before, italic) => `${before}${pc.italic(italic)}`)
    .replace(/(^|[^_])_([^_\n]+)_(?!_)/g, (_, before, italic) => `${before}${pc.italic(italic)}`);
}

export function renderMarkdown(text) {
  const lines = text.split("\n");
  let inCodeBlock = false;
  const out = [];

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    out.push(inCodeBlock ? pc.dim(line) : renderInline(line));
  }

  return out.join("\n");
}
