"use server";

import { signIn, signOut } from "@/auth";

export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/?view=dashboard" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
