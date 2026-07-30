import pc from "picocolors";

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const SPINNER_INTERVAL_MS = 80;
const PASTEL_RED = "\x1b[38;2;240;128;128m";
const RESET_FG = "\x1b[39m";

export function statusIcon(success) {
  return success ? pc.green("✔") : pc.red("✖");
}

function pastelRed(text) {
  return pc.isColorSupported ? `${PASTEL_RED}${text}${RESET_FG}` : text;
}

export function llmMessage(text) {
  return `● ${text}`;
}

export function debashMessage(text) {
  return pc.gray(`✻ ${text}`);
}

export function debashError(text) {
  return pastelRed(`✻ ${text}`);
}

export async function withSpinner(promise) {
  let frame = 0;
  const interval = setInterval(() => {
    process.stdout.write(`\r${pc.dim(SPINNER_FRAMES[frame])} `);
    frame = (frame + 1) % SPINNER_FRAMES.length;
  }, SPINNER_INTERVAL_MS);

  try {
    return await promise;
  } finally {
    clearInterval(interval);
    process.stdout.write("\r\x1b[2K");
  }
}
