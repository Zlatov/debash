import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export const bashTool = {
  type: "function",
  function: {
    name: "bash",
    description:
      "Выполняет команду в bash внутри текущей рабочей директории и возвращает stdout, stderr и код завершения.",
    parameters: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "Команда для выполнения",
        },
      },
      required: ["command"],
    },
  },
};

export async function runBashCommand(command) {
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      timeout: 60_000,
      maxBuffer: 10 * 1024 * 1024,
    });
    return { stdout, stderr, exitCode: 0 };
  } catch (error) {
    return {
      stdout: error.stdout ?? "",
      stderr: error.stderr ?? error.message,
      exitCode: typeof error.code === "number" ? error.code : 1,
    };
  }
}
