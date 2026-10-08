import dataSource from "./data-source";

async function runMigrations() {
  await dataSource.initialize();
  console.log("Database connected for migrations");

  const pending = await dataSource.showMigrations();
  console.log(`Pending migrations: ${pending}`);

  await dataSource.runMigrations();
  console.log("Migrations completed successfully");

  await dataSource.destroy();
}

runMigrations().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
