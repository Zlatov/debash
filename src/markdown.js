import pc from "picocolors";

function renderInline(text) {
  return text
    .replace(/`([^`]+)`/g, (_, code) => pc.cyan(code))
    .replace(/\*\*(.+?)\*\*/g, (_, bold) => pc.bold(bold))
    .replace(/__(.+?)__/g, (_, bold) => pc.bold(bold))
    .replace(/~~(.+?)~~/g, (_, strike) => pc.strikethrough(strike))
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, (_, before, italic) => `${before}${pc.italic(italic)}`)
    .replace(/(^|[^_])_([^_\n]+)_(?!_)/g, (_, before, italic) => `${before}${pc.italic(italic)}`);
}

function renderLine(line) {
  const heading = line.match(/^#{1,6}\s+(.*)$/);
  if (heading) {
    return pc.bold(renderInline(heading[1]));
  }
  return renderInline(line);
}

export function renderMarkdown(text) {
  const lines = text.split("\n");
  let inCodeBlock = false;
  const out = [];

  for (const line of lines) {
    const fence = line.trim().match(/^```(.*)$/);
    if (fence) {
      // Fences with a language tag (```python) are almost always openers,
      // even when nested inside an outer fence — force the block open so
      // a bare closing ``` further down doesn't desync the toggle state.
      inCodeBlock = fence[1].trim() ? true : !inCodeBlock;
      continue;
    }
    out.push(inCodeBlock ? pc.dim(line) : renderLine(line));
  }

  return out.join("\n");
}
