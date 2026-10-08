import dataSource from "./data-source";

async function revertLastMigration() {
  await dataSource.initialize();
  console.log("Database connected for migration revert");

  await dataSource.undoLastMigration();
  console.log("Last migration reverted successfully");

  await dataSource.destroy();
}

revertLastMigration().catch((err) => {
  console.error("Migration revert failed:", err);
  process.exit(1);
});
