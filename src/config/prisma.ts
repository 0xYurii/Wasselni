import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/index.js";
import { PrismaNeon } from "@prisma/adapter-neon";

//Local Storing
// const adapter = new PrismaPg({
//connectionString: process.env.DATABASE_URL,
//});

//Cloud Storing with Neon
const adapter = new PrismaNeon({
    connectionString: process.env.NEON_DB_URL!,
});

const prisma = new PrismaClient({ adapter });

export default prisma;
