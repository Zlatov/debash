import pc from "picocolors";

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const SPINNER_INTERVAL_MS = 80;

export function terminalWidth() {
  return process.stdout.columns || 80;
}

export function borderLine() {
  return pc.dim("─".repeat(terminalWidth()));
}

export function statusIcon(success) {
  return success ? pc.green("✔") : pc.red("✖");
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
