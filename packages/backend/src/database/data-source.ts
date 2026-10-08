import { DataSource } from "typeorm";
import { config } from "dotenv";
import * as path from "path";

config();

export default new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  migrations: [path.join(__dirname, "migrations", "*-*.ts")],
  synchronize: false,
});
