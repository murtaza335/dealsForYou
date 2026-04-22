"use client";

import { UserButton, useAuth, useUser } from "@clerk/nextjs";
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
  const [category, setCategory] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [search, setSearch] = useState("");

  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([]);
  const [recommendedDeals, setRecommendedDeals] = useState<Deal[]>([]);
  const [topDeals, setTopDeals] = useState<Deal[]>([]);

  const [loadingFiltered, setLoadingFiltered] = useState(false);
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  const [loadingTop, setLoadingTop] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const welcomeName = useMemo(() => {
    if (!user) return "User";
    return user.firstName || user.username || user.primaryEmailAddress?.emailAddress || "User";
  }, [user]);

  const fetchFilteredDeals = useCallback(async () => {
    setLoadingFiltered(true);
    setErrorMessage(null);

    try {
      const query = buildQuery({
        brand,
        category,
        maxPrice,
        search,
      });

      const response = await fetch(`${apiBaseUrl}/api/deals/filtered?${query}`);
      if (!response.ok) {
        throw new Error("Could not fetch filtered deals.");
      }

      const payload: ApiResponse = await response.json();
      setFilteredDeals(payload.data ?? []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unexpected error.");
      setFilteredDeals([]);
    } finally {
      setLoadingFiltered(false);
    }
  }, [brand, category, maxPrice, search]);

  const fetchTopDeals = useCallback(async () => {
    setLoadingTop(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/deals/top?limit=6`);
      if (!response.ok) {
        throw new Error("Could not fetch top deals.");
      }

      const payload: ApiResponse = await response.json();
      setTopDeals(payload.data ?? []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unexpected error.");
      setTopDeals([]);
    } finally {
      setLoadingTop(false);
    }
  }, []);

  const fetchRecommendedDeals = useCallback(async () => {
    if (!userId) {
      setRecommendedDeals([]);
      return;
    }

    setLoadingRecommended(true);
    setErrorMessage(null);

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/deals/recommended?userId=${encodeURIComponent(userId)}&limit=6`,
      );

      if (!response.ok) {
        throw new Error("Could not fetch recommended deals.");
      }

      const payload: ApiResponse = await response.json();
      setRecommendedDeals(payload.data ?? []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unexpected error.");
      setRecommendedDeals([]);
    } finally {
      setLoadingRecommended(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    const timer = setTimeout(() => {
      void fetchFilteredDeals();
      void fetchTopDeals();
    }, 0);

    return () => clearTimeout(timer);
  }, [isSignedIn, fetchFilteredDeals, fetchTopDeals]);

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    const timer = setTimeout(() => {
      void fetchRecommendedDeals();
    }, 0);

    return () => clearTimeout(timer);
  }, [isSignedIn, fetchRecommendedDeals]);

  const onFilterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void fetchFilteredDeals();
  };

  const handleDealClick = async (dealId: number) => {
    if (!recommendationBaseUrl) {
      return;
    }

    try {
      await fetch(`${recommendationBaseUrl}/api/track/track_click`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dealId,
        }),
      });
    } catch (error) {
      console.error("Failed to track click:", error);
    }
  };

  return (
    <main className="relative min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <header className="rounded-[2rem] border border-white/60 bg-white/75 p-6 shadow-glow backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="inline-flex rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-800">
                Personalized Savings Hub
              </p>
              <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
                Deals4You
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Find food deals fast, then let recommendations sharpen what you see next.
              </p>
            </div>
            <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-slate-950 px-4 py-3 text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-brand-200">Welcome</p>
                <p className="text-sm font-semibold">{welcomeName}</p>
              </div>
              <UserButton />
            </div>
          </div>
        </header>

        <section className="mt-6 rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-glow backdrop-blur-xl sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">Filters</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-slate-950">Refine what you want</h2>
            </div>
            <span className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
              Live query
            </span>
          </div>

          <form onSubmit={onFilterSubmit} className="mt-6 grid gap-4 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Brand
              <input
                value={brand}
                onChange={(event) => setBrand(event.target.value)}
                placeholder="KFC, Dominos..."
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Category
              <input
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Pizza, Burger..."
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Max price
              <input
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                placeholder="500"
                inputMode="numeric"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Search
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cheese burst..."
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
              />
            </label>
            <button
              type="submit"
              className="rounded-2xl bg-brand-500 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-wait disabled:opacity-70"
              disabled={loadingFiltered}
            >
              {loadingFiltered ? "Filtering..." : "Apply filters"}
            </button>
          </form>
        </section>

        {errorMessage ? (
          <p className="mt-6 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        <section className="mt-6 rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-glow backdrop-blur-xl sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">Recommended</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-slate-950">Deals matched to your activity</h2>
            </div>
            {!isSignedIn ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                Sign in required
              </span>
            ) : null}
          </div>

          <SectionEmptyState loading={loadingRecommended} items={recommendedDeals} emptyText="No recommendations yet." />
          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {recommendedDeals.map((deal) => (
              <DealCard key={deal.externalId} deal={deal} onClick={() => void handleDealClick(deal.id)} />
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-glow backdrop-blur-xl sm:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">Top deals</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-slate-950">Popular picks right now</h2>
          </div>

          <SectionEmptyState loading={loadingTop} items={topDeals} emptyText="No top deals available." />
          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {topDeals.map((deal) => (
              <DealCard key={deal.externalId} deal={deal} onClick={() => void handleDealClick(deal.id)} />
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-glow backdrop-blur-xl sm:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">Filtered results</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-slate-950">What matches your query</h2>
          </div>

          <SectionEmptyState loading={loadingFiltered} items={filteredDeals} emptyText="No deals match this filter." />
          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredDeals.map((deal) => (
              <DealCard key={deal.externalId} deal={deal} onClick={() => void handleDealClick(deal.id)} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}