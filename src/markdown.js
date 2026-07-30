import pc from "picocolors";

const CODE_COLOR = "\x1b[38;2;140;104;205m";
const RESET_FG = "\x1b[39m";

function codeColor(text) {
  return pc.isColorSupported ? `${CODE_COLOR}${text}${RESET_FG}` : text;
}

function renderInline(text) {
  return text
    .replace(/`([^`]+)`/g, (_, code) => codeColor(code))
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
    out.push(inCodeBlock ? codeColor(line) : renderLine(line));
  }

  return out.join("\n");
}
