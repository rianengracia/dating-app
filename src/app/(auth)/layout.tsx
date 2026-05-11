import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user) redirect("/discover");

  return (
    <>
      <Header />
      <main className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 tm-grid-bg opacity-20 pointer-events-none" />
        <div className="absolute -right-40 -top-40 w-[480px] h-[480px] bg-accent/10 blur-3xl pointer-events-none" />
        <div className="relative mx-auto max-w-[760px] px-6 md:px-12 py-16 md:py-24">
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
