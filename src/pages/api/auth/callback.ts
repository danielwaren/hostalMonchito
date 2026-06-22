import type { APIRoute } from "astro";
import { createServerClient, parseCookieHeader } from "@supabase/ssr";

const ALLOWED_EMAILS = [
  "danielguz.ga@gmail.com",
  "hostalmonchito2023@gmail.com",
];

export const GET: APIRoute = async ({ request, cookies, redirect, url }) => {
  const code = url.searchParams.get("code");

  if (!code) {
    return redirect("/login?error=auth");
  }

  const supabase = createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(request.headers.get("cookie") ?? "");
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return redirect("/login?error=auth");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !ALLOWED_EMAILS.includes(user.email ?? "")) {
    await supabase.auth.signOut();
    return redirect("/login?error=unauthorized");
  }

  return redirect("/Dashboard");
};
