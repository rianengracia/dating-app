import { requireUserPage } from "@/lib/auth-server";
import { AppNav } from "@/components/app/AppNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUserPage();
  return (
    <>
      <AppNav user={{ displayName: user.displayName, photoUrl: user.photoUrl }} />
      <main className="flex-1">{children}</main>
    </>
  );
}
