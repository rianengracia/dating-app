import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession, type SessionPayload } from "@/lib/auth";

export type AuthedUser = {
  id: string;
  email: string;
  displayName: string;
  age: number;
  bio: string;
  photoUrl: string;
  latitude: number | null;
  longitude: number | null;
};

async function loadUser(session: SessionPayload | null): Promise<AuthedUser | null> {
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      email: true,
      displayName: true,
      age: true,
      bio: true,
      photoUrl: true,
      latitude: true,
      longitude: true,
    },
  });
  return user;
}

export async function getCurrentUser(): Promise<AuthedUser | null> {
  return loadUser(await readSession());
}

/** Use in Server Components / Pages — redirects to /login if not authed. */
export async function requireUserPage(): Promise<AuthedUser> {
  const user = await loadUser(await readSession());
  if (!user) redirect("/login");
  return user;
}

/** Use in Route Handlers — returns either a user or a 401 NextResponse to bail with. */
export async function requireUserApi(): Promise<
  { user: AuthedUser; response?: undefined } | { user?: undefined; response: NextResponse }
> {
  const user = await loadUser(await readSession());
  if (!user) {
    return {
      response: NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 }),
    };
  }
  return { user };
}
