import { requireUser } from "@/lib/auth-helpers";
import { AppShell } from "./_components/AppShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return (
    <AppShell userName={user.name} userCrp={user.crp}>
      {children}
    </AppShell>
  );
}
