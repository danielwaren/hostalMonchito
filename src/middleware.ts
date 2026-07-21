import { defineMiddleware } from "astro:middleware";
import { getSession } from "auth-astro/server";

const ALLOWED_EMAILS = [
  "danielguz.ga@gmail.com",
  "hostalmonchito2023@gmail.com",
];

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/Contacto",
  "/hospedaje-puerto-cisnes",
  "/carta",
];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  if (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/blog") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_")
  ) {
    return next();
  }

  const session = await getSession(context.request);
  const email = session?.user?.email ?? "";

  if (!session?.user || !ALLOWED_EMAILS.includes(email)) {
    return context.redirect("/login");
  }

  context.locals.user = session.user;

  return next();
});
