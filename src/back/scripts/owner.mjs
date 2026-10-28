import { emitKeypressEvents } from "node:readline";
import argon2 from "argon2";
import BetterSqlite3 from "better-sqlite3";

async function hidden(label) {
  if (!process.stdin.isTTY || !process.stdout.isTTY || !process.stdin.setRawMode) throw new Error("TTY에서 대화형으로 실행해야 합니다.");
  process.stdout.write(label); emitKeypressEvents(process.stdin); process.stdin.setRawMode(true); process.stdin.resume();
  return new Promise((resolve, reject) => {
    let value = "";
    const done = () => { process.stdin.setRawMode(false); process.stdin.pause(); process.stdin.off("keypress", keypress); process.stdout.write("\n"); };
    const keypress = (character, key) => {
      if (key.ctrl && key.name === "c") { done(); reject(new Error("취소되었습니다.")); }
      else if (key.name === "return" || key.name === "enter") { done(); resolve(value); }
      else if (key.name === "backspace") value = value.slice(0, -1);
      else if (character && !key.ctrl) value += character;
    };
    process.stdin.on("keypress", keypress);
  });
}

async function visible(label, fallback) {
  process.stdout.write(`${label} [${fallback}]: `); process.stdin.setEncoding("utf8"); process.stdin.resume();
  return new Promise((resolve) => process.stdin.once("data", (data) => { process.stdin.pause(); resolve(String(data).trim() || fallback); }));
}

async function main() {
  const command = process.argv[2]; if (command !== "init" && command !== "password") throw new Error("사용법: owner.mjs init|password");
  const db = new BetterSqlite3(process.env.JLPT_DB_PATH || "/app/var/jlpt.sqlite"); db.pragma("foreign_keys=ON");
  try {
    const username = command === "init" ? await visible("사용자 이름", "owner") : null;
    const password = await hidden("새 비밀번호: "); const confirmation = await hidden("새 비밀번호 확인: ");
    if (password !== confirmation) throw new Error("비밀번호가 일치하지 않습니다.");
    if (password.length < 12 || password.length > 256) throw new Error("비밀번호는 12자 이상 256자 이하여야 합니다.");
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 1 }); const now = new Date().toISOString();
    if (command === "init") {
      if (db.prepare("SELECT 1 FROM owner_account WHERE id='owner'").get()) throw new Error("owner 계정이 이미 초기화되었습니다.");
      db.prepare("INSERT INTO owner_account(id,username,password_hash,created_at,password_changed_at) VALUES ('owner',?,?,?,?)").run(username, passwordHash, now, now);
      console.log("owner 계정을 초기화했습니다.");
    } else {
      db.transaction(() => { const result = db.prepare("UPDATE owner_account SET password_hash=?,password_changed_at=? WHERE id='owner'").run(passwordHash, now); if (!result.changes) throw new Error("owner 계정이 없습니다."); db.prepare("UPDATE auth_sessions SET revoked_at=? WHERE owner_id='owner' AND revoked_at IS NULL").run(now); })();
      console.log("비밀번호를 변경하고 기존 세션을 모두 무효화했습니다.");
    }
  } finally { db.close(); }
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "owner 명령이 실패했습니다."); process.exitCode = 1; });
