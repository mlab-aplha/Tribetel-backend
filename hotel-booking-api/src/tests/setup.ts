import { sequelize } from "../config/database";
import dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

beforeAll(async () => {
  try {
    await sequelize.authenticate();
    console.log("Test database connected");

    await sequelize.sync({ force: true });
    console.log("Test database synchronized");
  } catch (error) {
    console.error("Test setup error:", error);
    process.exit(1);
  }
});

afterEach(async () => {
  const models = Object.keys(sequelize.models);

  for (const modelName of models) {
    await sequelize.models[modelName].destroy({
      where: {},
      force: true,
      truncate: true,
    });
  }
});

afterAll(async () => {
  try {
    await sequelize.close();
    console.log("Test database connection closed");
  } catch (error) {
    console.error("Test teardown error:", error);
  }
});
