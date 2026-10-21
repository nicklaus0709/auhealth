import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import BrandMark from "@/components/BrandMark";
import AuvanceFooter from "@/components/AuvanceFooter";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function AppLayout() {
  const [abierto, setAbierto] = useState(false);
  const { pathname } = useLocation();

  return (
    <div className="app-surface-bg min-h-screen">
      <Sidebar className="fixed inset-y-0 left-0 z-40 hidden lg:flex" />

      <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-white/80 px-4 backdrop-blur lg:hidden">
        <BrandMark iconSize={34} showWordmark wordmarkClass="text-foreground" />
        <Sheet open={abierto} onOpenChange={setAbierto}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Abrir menú"
              className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-foreground transition-colors hover:bg-muted"
            >
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[260px] border-none p-0 [&>button]:hidden">
            <Sidebar className="flex h-full" onNavegar={() => setAbierto(false)} />
          </SheetContent>
        </Sheet>
      </header>

      <main className="flex min-h-screen flex-col lg:pl-[260px]">
        <div className="mx-auto w-full max-w-[1280px] flex-1 px-4 pb-20 pt-24 sm:px-6 lg:px-8 lg:pt-10">
          <div key={pathname} className="animate-fade-in">
            <Outlet />
          </div>
        </div>
        <AuvanceFooter />
      </main>
    </div>
  );
}