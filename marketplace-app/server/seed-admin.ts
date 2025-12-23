import { db } from "./db";
import { users, wallets } from "@shared/schema";
import { hashPassword } from "./utils/bcrypt";
import { eq } from "drizzle-orm";

async function seedOrUpdateAdmin(
  username: string,
  email: string,
  password: string,
  role: "admin" | "dispute_admin" | "support" | "finance_manager" = "admin",
) {
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (existingUser.length > 0) {
    console.log(
      `Admin user ${username} already exists. Updating password and role...`,
    );
    const hashedPassword = await hashPassword(password);
    await db
      .update(users)
      .set({
        role: role,
        password: hashedPassword,
      })
      .where(eq(users.username, username));

    const existingWallet = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, existingUser[0].id))
      .limit(1);
    if (existingWallet.length === 0) {
      await db.insert(wallets).values({
        userId: existingUser[0].id,
        currency: "USDT",
      });
      console.log(`Wallet created for ${username}!`);
    }

    console.log(`Role (${role}) and password updated for ${username}!`);
    return;
  }

  const hashedPassword = await hashPassword(password);

  const [adminUser] = await db
    .insert(users)
    .values({
      username,
      email,
      password: hashedPassword,
      role: role,
      emailVerified: true,
      isActive: true,
    })
    .returning();

  await db.insert(wallets).values({
    userId: adminUser.id,
    currency: "USDT",
  });

  console.log(`${role} user ${username} created successfully!`);
}

async function seedAdmin() {
  console.log("Seeding admin users...");

  const kaiPassword = process.env.ADMIN_KAI_PASSWORD || "487530Turbo";
  const turboPassword = process.env.ADMIN_TURBO_PASSWORD || "1CU14CU";

  await seedOrUpdateAdmin("Kai", "kai@admin.local", kaiPassword, "admin");
  await seedOrUpdateAdmin("Turbo", "turbo@admin.local", turboPassword, "dispute_admin");
  
  // Customer Support user - no KYC required
  const csPassword = process.env.CS_PASSWORD || "#28522520Turbo";
  await seedOrUpdateAdmin("Cs", "cs@support.local", csPassword, "support");
  
  // Finance Manager user - no KYC required
  const elonPassword = process.env.FINANCE_MANAGER_PASSWORD || "2024P07545";
  await seedOrUpdateAdmin("Elon", "elon@finance.local", elonPassword, "finance_manager");

  console.log("All admin users seeded!");
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("Error seeding admin:", err);
  process.exit(1);
});
