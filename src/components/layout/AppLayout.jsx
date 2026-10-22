import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import BuscadorGlobal from "@/components/layout/BuscadorGlobal";
import BrandMark from "@/components/BrandMark";
import AuvanceFooter from "@/components/AuvanceFooter";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import useInactividad from "@/hooks/useInactividad";

export default function AppLayout() {
  const [abierto, setAbierto] = useState(false);
  const { pathname } = useLocation();
  useInactividad();

  return (
    <div className="app-surface-bg min-h-screen print:bg-white">
      <Sidebar className="fixed inset-y-0 left-0 z-40 hidden lg:flex print:hidden" />

      <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-white/95 px-4 lg:hidden print:hidden">
        <BrandMark iconSize={34} showWordmark wordmarkClass="text-foreground" />
        <div className="flex items-center gap-2">
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
        </div>
      </header>

      <main className="flex min-h-screen flex-col lg:pl-[260px] print:pl-0">
        <div className="mx-auto w-full max-w-[1280px] flex-1 px-4 pb-20 pt-20 sm:px-6 lg:px-8 lg:pt-6 print:p-0">
          <div className="mb-5 print:hidden">
            <BuscadorGlobal />
          </div>
          <div key={pathname} className="animate-fade-in">
            <Outlet />
          </div>
        </div>
        <div className="print:hidden">
          <AuvanceFooter />
        </div>
      </main>
    </div>
  );
}
