import path from "node:path";

export function databasePath() {
  return process.env.JLPT_DB_PATH || path.resolve(process.cwd(), "..", "..", "var", "jlpt.sqlite");
}

export function seedDataPath() {
  return process.env.JLPT_SEED_DATA || path.resolve(process.cwd(), "..", "..", "jlpt-vocabulary-dataset", "data");
}

export function backupDirectory() {
  return process.env.JLPT_BACKUP_DIR || path.resolve(process.cwd(), "..", "..", "var", "backups");
}
