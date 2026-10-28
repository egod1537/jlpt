import { emitKeypressEvents } from "node:readline";
import { getDatabase } from "@back/lib/db/database";
import { changeOwnerPassword, initializeOwner } from "@back/lib/auth/service";

async function hiddenPrompt(label: string) {
  if (!process.stdin.isTTY || !process.stdout.isTTY || !process.stdin.setRawMode) throw new Error("owner 명령은 TTY에서 대화형으로 실행해야 합니다.");
  process.stdout.write(label);
  emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return new Promise<string>((resolve, reject) => {
    let value = "";
    const cleanup = () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.off("keypress", onKeypress);
      process.stdout.write("\n");
    };
    const onKeypress = (character: string, key: { name?: string; ctrl?: boolean }) => {
      if (key.ctrl && key.name === "c") {
        cleanup();
        reject(new Error("취소되었습니다."));
      } else if (key.name === "return" || key.name === "enter") {
        cleanup();
        resolve(value);
      } else if (key.name === "backspace") {
        value = value.slice(0, -1);
      } else if (character && !key.ctrl) {
        value += character;
      }
    };
    process.stdin.on("keypress", onKeypress);
  });
}

async function visiblePrompt(label: string, fallback: string) {
  process.stdout.write(`${label} [${fallback}]: `);
  return new Promise<string>((resolve) => {
    process.stdin.setEncoding("utf8");
    process.stdin.once("data", (data) => resolve(String(data).trim() || fallback));
  });
}

async function main() {
  const command = process.argv[2];
  if (!new Set(["init", "password"]).has(command)) throw new Error("사용법: npm run owner:init 또는 npm run owner:password");
  const db = getDatabase();
  if (command === "init") {
    const username = await visiblePrompt("사용자 이름", "owner");
    const password = await hiddenPrompt("새 비밀번호: ");
    const confirmation = await hiddenPrompt("새 비밀번호 확인: ");
    if (password !== confirmation) throw new Error("비밀번호가 일치하지 않습니다.");
    await initializeOwner(db, username, password);
    console.log("owner 계정을 초기화했습니다.");
  } else {
    const password = await hiddenPrompt("새 비밀번호: ");
    const confirmation = await hiddenPrompt("새 비밀번호 확인: ");
    if (password !== confirmation) throw new Error("비밀번호가 일치하지 않습니다.");
    await changeOwnerPassword(db, password, true);
    console.log("비밀번호를 변경하고 기존 세션을 모두 무효화했습니다.");
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "owner 명령이 실패했습니다.");
  process.exitCode = 1;
});
