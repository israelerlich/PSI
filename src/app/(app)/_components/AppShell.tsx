"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MobileNav } from "./mobile-nav";
import { BottomTabs } from "@/components/features/BottomTabs";

export function AppShell({
  userName,
  userCrp,
  children,
}: {
  userName: string;
  userCrp: string;
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      <Sidebar userName={userName} userCrp={userCrp} />
      <MobileNav
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        userName={userName}
        userCrp={userCrp}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 pb-16 lg:pb-0">{children}</main>
      </div>
      <BottomTabs />
    </div>
  );
}
