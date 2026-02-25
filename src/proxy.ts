import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Handle i18n
  const intlResponse = intlMiddleware(request);
  if (intlResponse) {
    supabaseResponse = intlResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake can make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();

  // Define protected and public paths
  // Note: we need to account for the locale prefix
  const isWelcomePage = url.pathname.includes("/welcome");
  const isManagementPage = url.pathname.includes("/management");
  const isDoctorsPage = url.pathname.includes("/doctors");
  const isLoginPage =
    url.pathname === "/" ||
    routing.locales.some((loc) => url.pathname === `/${loc}`);

  if (user && isLoginPage) {
    // Redirect to welcome page if already logged in and trying to access login page
    const locale = url.pathname === "/" ? "en" : url.pathname.split("/")[1]; // Default to en if no locale
    url.pathname = `/${locale}/welcome`;
    return NextResponse.redirect(url);
  }

  if (!user && (isWelcomePage || isManagementPage || isDoctorsPage)) {
    // Redirect to login if trying to access protected pages while logged out
    const locale = url.pathname.split("/")[1] || "en";
    url.pathname = `/${locale}`;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export default async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
