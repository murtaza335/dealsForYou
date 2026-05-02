"use client";

import Link from "next/link";
import { UserButton, useAuth } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { DealsLogo } from "@/components/deals-logo";

const tabs: { href: string; label: string; key: "home" | "deals" | "about" }[] = [
  { href: "/", label: "Home", key: "home" },
  { href: "/deals", label: "Deals", key: "deals" },
  { href: "/about", label: "About", key: "about" },
];

export function DashboardHeader() {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();

  const activeTab =
    pathname === "/" ? "home" : pathname.startsWith("/deals") ? "deals" : "about";

  return (
    <header
      className="fixed inset-x-0 top-0 z-20 h-25"
      style={{
        backgroundColor: "#000000",
        WebkitMaskImage:
          "linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)",
        maskImage:
          "linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)",
      }}
    >
      <nav className="mx-auto flex h-full w-full max-w-3xl items-center justify-center gap-8 px-4">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            className="relative px-2 py-2 text-sm font-bold text-white transition hover:text-red-400"
          >
            {tab.label}
            {activeTab === tab.key && (
              <motion.div
                layoutId="active-tab-indicator"
                className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-red-600"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </Link>
        ))}

        <button aria-label="Search" className="ml-2 text-white transition hover:text-red-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </button>
      </nav>

      <div className="absolute left-5 top-1/2 flex -translate-y-1/2 items-center sm:left-7">
        <DealsLogo width={180} height={120} priority className="h-24 w-40 sm:h-28 sm:w-48" />
      </div>

      <div className="absolute right-5 top-1/2 flex -translate-y-1/2 items-center sm:right-7">
        {isSignedIn ? (
          <UserButton />
        ) : (
          <Link href="/sign-up">
            <button className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-bold text-white transition-colors hover:bg-red-700">
              Sign Up
            </button>
          </Link>
        )}
      </div>
    </header>
  );
}