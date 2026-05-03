"use client";

import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { DashboardHeader } from "./dashboard-header";
import { FoodBackground } from "@/components/food-background";

type SharedLayoutProps = {
  children: ReactNode;
};

export function SharedLayout({ children }: SharedLayoutProps) {
  const pathname = usePathname();

  return (
    <>
    <DashboardHeader />
    <main
      className="relative w-full overflow-x-hidden overflow-y-auto"
      style={{
        background: "#000000",
        height: "100vh",
        perspective: "10px",
      }}
    >
      

      {/* ── Parallax background pattern ── */}
      <FoodBackground
        blocks={10}
        style={{
          transform: "translateZ(-25px) scale(3.5)",
          transformOrigin: "top",
        }}
      />

      {/* ── Animated page content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative z-10"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </main>
    </>
  );
}
