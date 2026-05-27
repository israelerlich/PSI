import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.INITIAL_USER_EMAIL;
  const password = process.env.INITIAL_USER_PASSWORD;
  const name = process.env.INITIAL_USER_NAME ?? "Dona da clínica";
  const crp = process.env.INITIAL_USER_CRP ?? "CRP 00/000000";

  if (!email || !password) {
    throw new Error(
      "Set INITIAL_USER_EMAIL and INITIAL_USER_PASSWORD in .env before seeding",
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`User ${email} already exists — skipping.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, name, crp },
  });
  console.log(`Created initial user ${user.email} (id=${user.id})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
