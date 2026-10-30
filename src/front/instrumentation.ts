export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const [{ getDatabase }, { seedDataPath }, { seedDatabase }] = await Promise.all([
    import("@back/lib/db/database"),
    import("@back/lib/db/config"),
    import("@back/lib/seed/seed"),
  ]);
  seedDatabase(getDatabase(), seedDataPath());
  const { startListeningWorker } = await import("@back/lib/listening/worker");
  startListeningWorker();
}
