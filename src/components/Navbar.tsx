"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Plus, FileText, Library, Clapperboard, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavbarVariant = "transparent" | "solid";

type Props = {
  variant?: NavbarVariant;
  showBackButton?: boolean;
  backHref?: string;
  backLabel?: string;
};

export function Navbar({ 
  variant = "solid",
  showBackButton = false,
  backHref = "/",
  backLabel = "Back",
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { href: "/console", label: "New Show", icon: Plus, mobileLabel: "" },
    { href: "/prompts", label: "Prompts", icon: FileText, mobileLabel: "" },
    { href: "/library", label: "Library", icon: Library, mobileLabel: "" },
    { href: "/episodes", label: "Episodes", icon: Clapperboard, mobileLabel: "" },
  ];

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-40",
        variant === "transparent" 
          ? "bg-gradient-to-b from-black/60 via-black/30 to-transparent backdrop-blur-sm"
          : "bg-black/80 backdrop-blur-xl border-b border-white/10"
      )}
    >
      <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 sm:px-6 py-4 sm:py-6">
        {/* Left Side - Logo or Back Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {showBackButton ? (
            <Link 
              href={backHref}
              className="flex items-center gap-2 text-foreground/70 hover:text-foreground transition-all duration-150 cursor-pointer hover:scale-105 active:scale-95"
            >
              <Home className="h-4 w-4" />
              <span className="text-sm font-medium">{backLabel}</span>
            </Link>
          ) : (
            <Link href="/" className="flex items-center gap-2 sm:gap-3 group cursor-pointer">
              <span className="text-base sm:text-lg font-semibold uppercase tracking-[0.28em] sm:tracking-[0.32em] text-primary drop-shadow-lg group-hover:text-primary/80 group-hover:drop-shadow-[0_0_12px_rgba(229,9,20,0.5)] transition-all duration-200">
                Production Flow
              </span>
              <span className="hidden md:inline text-xs text-white/70 drop-shadow group-hover:text-white/90 transition-colors">AI Show Bible Generator</span>
            </Link>
          )}
        </div>

        {/* Right Side - Navigation */}
        <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Button
                key={item.href}
                type="button"
                variant={active ? "default" : "ghost"}
                size="sm"
                onClick={() => router.push(item.href)}
                className={cn(
                  "gap-1.5 sm:gap-2 rounded-full cursor-pointer transition-all duration-150",
                  active 
                    ? "bg-primary/20 text-primary hover:bg-primary/30 hover:shadow-[0_0_20px_rgba(229,9,20,0.3)] border border-primary/30"
                    : "backdrop-blur-md bg-white/5 hover:bg-white/15 hover:border-white/20 hover:shadow-lg border border-white/10"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}




