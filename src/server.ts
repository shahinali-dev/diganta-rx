import app from "./app";
import config from "./config";
import prisma from "./lib/prisma";

async function main() {
  try {
    await prisma.$connect();
    console.log("Connected to PostgreSQL via Prisma");

    const server = app.listen(config.PORT, () => {
      console.log(`Express app is listening on port ${config.PORT}`);
    });

    const shutdown = async () => {
      await prisma.$disconnect();
      server.close(() => process.exit(0));
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

main();
