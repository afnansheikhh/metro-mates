"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Zap, Heart, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const navItems = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/travel", icon: Zap, label: "Travel" },
  { href: "/swipe", icon: Heart, label: "Swipe" },
  { href: "/matches", icon: MessageCircle, label: "Matches" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bottom-nav z-50">
      <div className="bg-metro-dark border-t border-metro-border px-2 py-3">
        <div className="flex items-center justify-around">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-1 relative px-3 py-1"
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-metro-yellow"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon
                  size={22}
                  className={cn(
                    "transition-colors",
                    isActive ? "text-metro-yellow" : "text-metro-muted"
                  )}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
                <span
                  className={cn(
                    "text-[10px] font-medium transition-colors",
                    isActive ? "text-metro-yellow" : "text-metro-muted"
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
