import pc from "picocolors";

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const SPINNER_INTERVAL_MS = 80;
const PASTEL_RED = "\x1b[38;2;240;128;128m";
const SOFT_GRAY = "\x1b[38;2;170;170;170m";
const RESET_FG = "\x1b[39m";

export function statusIcon(success) {
  return success ? pc.green("✔") : pc.red("✖");
}

function pastelRed(text) {
  return pc.isColorSupported ? `${PASTEL_RED}${text}${RESET_FG}` : text;
}

function softGray(text) {
  return pc.isColorSupported ? `${SOFT_GRAY}${text}${RESET_FG}` : text;
}

export function llmMessage(text) {
  return `● ${text}`;
}

export function debashMessage(text) {
  return softGray(`✻ ${text}`);
}

export function debashError(text) {
  return pastelRed(`✻ ${text}`);
}

export async function withSpinner(promise, label = "") {
  let frame = 0;
  const suffix = label ? ` ${pc.dim(label)}` : "";
  const interval = setInterval(() => {
    process.stdout.write(`\r${pc.dim(SPINNER_FRAMES[frame])}${suffix}`);
    frame = (frame + 1) % SPINNER_FRAMES.length;
  }, SPINNER_INTERVAL_MS);

  try {
    return await promise;
  } finally {
    clearInterval(interval);
    process.stdout.write("\r\x1b[2K");
  }
}
