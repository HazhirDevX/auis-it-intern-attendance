import "server-only";

import { cache } from "react";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { normalizeAuisEmail } from "@/lib/validation";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "ADMIN";
  image: string | null;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();
  const sessionEmail = session?.user?.email;
  if (!sessionEmail) return null;

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      image: users.image,
      active: users.active,
    })
    .from(users)
    .where(eq(users.email, normalizeAuisEmail(sessionEmail)))
    .limit(1);

  if (!user?.active) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    image: user.image,
  };
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}
