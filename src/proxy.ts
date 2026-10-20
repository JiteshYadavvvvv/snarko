import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isGameCategory } from "@/constants/game-categories";
import { SAMPLE_GAMES } from "@/lib/sample-games";

export const config = {
  matcher: ["/games/:path*"],
};

export function proxy(request: NextRequest) {
  const segments = request.nextUrl.pathname.split("/").filter(Boolean);

  if (segments[0] !== "games") {
    return NextResponse.next();
  }

  if (segments[1] === "category") {
    const category = segments[2];
    const isValid = category !== undefined && isGameCategory(category);
    if (!isValid) {
      return NextResponse.rewrite(new URL("/__snarko_404__", request.url));
    }
    return NextResponse.next();
  }

  const slug = segments[1];
  const isValid =
    slug !== undefined && SAMPLE_GAMES.some((game) => game.slug === slug);
  if (!isValid) {
    return NextResponse.rewrite(new URL("/__snarko_404__", request.url));
  }

  return NextResponse.next();
}
