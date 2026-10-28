import { seedDataPath } from "@back/lib/db/config";
import { openDatabase } from "@back/lib/db/database";
import { seedDatabase } from "@back/lib/seed/seed";

const db = openDatabase();
try {
  console.log(JSON.stringify(seedDatabase(db, seedDataPath()), null, 2));
} finally {
  db.close();
}
