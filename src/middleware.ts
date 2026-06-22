import { defineMiddleware } from "astro:middleware";
import { createServerClient, parseCookieHeader } from "@supabase/ssr";

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
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/_")
  ) {
    return next();
  }

  const supabase = createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(context.request.headers.get("cookie") ?? "");
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            context.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !ALLOWED_EMAILS.includes(user.email ?? "")) {
    return context.redirect("/login");
  }

  context.locals.user = user;

  return next();
});
