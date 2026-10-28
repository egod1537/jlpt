import { databasePath } from "@back/lib/db/config";
import { openDatabase } from "@back/lib/db/database";

const db = openDatabase(databasePath());
const migrations = db.prepare("SELECT version, name, applied_at FROM schema_migrations ORDER BY version").all();
console.log(JSON.stringify({ database: databasePath(), migrations }, null, 2));
db.close();
