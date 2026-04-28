"use client";

import Image from "next/image";
import { UserButton, SignUpButton, useAuth, useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { DealCard } from "@/components/deal-card";
import {
  apiBaseUrl,
  buildQuery,
  recommendationBaseUrl,
  type ApiResponse,
  type Deal,
} from "@/lib/deals";
import { motion, AnimatePresence } from "framer-motion";

function SectionEmptyState({
  loading,
  items,
  emptyText,
}: Readonly<{
  loading: boolean;
  items: Deal[];
  emptyText: string;
}>) {
  if (loading) {
    return <p className="mt-4 text-sm text-slate-500">Loading...</p>;
  }

  if (items.length === 0) {
    return <p className="mt-4 text-sm text-slate-500">{emptyText}</p>;
  }

  return null;
}

export function DealsDashboard() {
  const { user } = useUser();
  const { isSignedIn } = useAuth();
  const userId = user?.id;

  const [brand, setBrand] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [query, setQuery] = useState("");

  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([]);
  const [loadingFiltered, setLoadingFiltered] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isExpanded, setIsExpanded] = useState(false);

  const fetchFilteredDeals = useCallback(async () => {
    setLoadingFiltered(true);
    setErrorMessage(null);

    try {
      const queryParam = buildQuery({
        minPrice,
        maxPrice,
        query,
        brand,
      });

      const response = await fetch(`${apiBaseUrl}/api/deals/filtered?${queryParam}`);
      if (!response.ok) {
        throw new Error("Could not fetch filtered deals.");
      }

      const payload: ApiResponse = await response.json();
      console.log("Fetched deals:", payload.data);
      setFilteredDeals(payload.data ?? []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unexpected error.");
      setFilteredDeals([]);
    } finally {
      setLoadingFiltered(false);
    }
  }, [brand, minPrice, maxPrice, query]);

  const fetchBrands = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/deals/filters/brands`);
      if (!response.ok) {
        throw new Error("Could not fetch brands.");
      }

      const payload: ApiResponse = await response.json();
      console.log("Fetched brands:", payload.data);
    } catch (error) {
      console.error("Error fetching brands:", error);
    }
  }, []);

  useEffect(() => {
    if (!isSignedIn) return;

    const timer = setTimeout(() => {
      void fetchFilteredDeals();
    }, 0);

    return () => clearTimeout(timer);
  }, [isSignedIn, fetchFilteredDeals]);

  useEffect(() => {
    void fetchBrands();
  }, [fetchBrands]);

  const onFilterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void fetchFilteredDeals();
  };



 




  return (
    <div className="relative z-10 px-6 pb-6 pt-25 sm:px-8 md:px-12 lg:px-16 xl:px-20">
      <div className="mx-auto w-full max-w-7xl">

        {errorMessage ? (
          <p className="mt-6 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        <section className="mt-8">
          <div className="relative">

            {/* container for both */}
            <motion.div
              layout
              className="flex items-center mb-4"
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {/* all deal heading */}
              {!isExpanded && (
                <div className="flex items-center gap-3 flex-1">
                  <div className="h-1 w-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full"></div>
                  <p className="text-sm font-bold uppercase tracking-[0.15em] text-yellow-400 bg-yellow-400/10 px-3 py-1 rounded-full whitespace-nowrap">
                    All deals
                  </p>
                  <div className="h-1 flex-1 bg-gradient-to-r from-yellow-600 via-yellow-600/30 to-transparent rounded-full"></div>
                </div>
              )}

              {/* the search bar*/}
              <motion.div
                layout
                transition={{
                  duration: 0.6,
                  ease: [0.25, 0.46, 0.45, 0.94],
                  layout: {
                    duration: 0.6,
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }
                }}
                className={`flex items-center gap-3 px-6 py-3 rounded-full border text-white text-base font-semibold cursor-pointer h-12 ml-4
                  ${isExpanded
                    ? "flex-1 bg-slate-900 border-yellow-400/50"
                    : "w-auto bg-gradient-to-r from-slate-800 to-slate-900 border-slate-700 hover:border-yellow-400/50 hover:shadow-lg hover:shadow-yellow-400/20"
                  }`}
                onClick={() => {
                  if (!isExpanded) setIsExpanded(true);
                }}
              >
                <AnimatePresence mode="wait" initial={false}>

                  {!isExpanded ? (
                    <motion.div
                      key="mood"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center gap-3 whitespace-nowrap"
                    >
                      <svg className="h-6 w-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>What&apos;s your mood?</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="search"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="flex items-center w-full gap-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg className="h-6 w-6 flex-shrink-0 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        autoFocus
                        placeholder="Search deals by mood, brand, food..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="flex-1 bg-transparent outline-none text-white placeholder-gray-400 h-full resize-none"
                      />

                      {/* closing */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsExpanded(false)}
                        className="p-1 rounded-full hover:bg-white/10 transition-colors duration-200 flex-shrink-0"
                      >
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </motion.button>
                    </motion.div>
                  )}

                </AnimatePresence>
              </motion.div>
            </motion.div>

          </div>

          <SectionEmptyState loading={loadingFiltered} items={filteredDeals} emptyText="No deals match this filter." />
          <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
            {filteredDeals.map((deal) => (
              <DealCard key={deal.externalId} deal={deal} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}