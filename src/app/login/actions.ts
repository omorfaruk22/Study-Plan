"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export type AdminLoginState = { error: string };

export async function adminLoginAction(_previousState: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/manage",
    });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Admin email বা password সঠিক নয়।" };
    throw error;
  }
  return { error: "লগইন সম্পন্ন করা যায়নি। আবার চেষ্টা করো।" };
}
