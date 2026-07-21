import "dotenv/config";
import { defineConfig } from "auth-astro";
import Google from "@auth/core/providers/google";

export default defineConfig({
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      const ALLOWED_EMAILS = [
        "danielguz.ga@gmail.com",
        "hostalmonchito2023@gmail.com",
      ];
      return ALLOWED_EMAILS.includes(profile?.email ?? "");
    },
  },
});
