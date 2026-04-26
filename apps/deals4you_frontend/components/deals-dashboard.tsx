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
      setFilteredDeals(payload.data ?? []);
      console.log(payload, 2, null)
    } catch (error) {
      console.log(error)
      setErrorMessage(error instanceof Error ? error.message : "Unexpected error.");
      setFilteredDeals([]);
    } finally {
      setLoadingFiltered(false);
    }
  }, [brand, minPrice, maxPrice, query]);



  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    const timer = setTimeout(() => {
      void fetchFilteredDeals();
    }, 0);

    return () => clearTimeout(timer);
  }, [isSignedIn, fetchFilteredDeals]);

  const onFilterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void fetchFilteredDeals();
  };



  return (
    <div className="relative z-10 px-4 pb-6 pt-25 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">

        {errorMessage ? (
          <p className="mt-6 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}


        <section className="mt-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-500">Filtered results</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-yellow-500">What matches your query</h2>
          </div>

          <SectionEmptyState loading={loadingFiltered} items={filteredDeals} emptyText="No deals match this filter." />
          <div className="mt-8 grid gap-16 sm:grid-cols-2 xl:grid-cols-3">
            {filteredDeals.map((deal) => (
              <DealCard key={deal.externalId} deal={deal} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}