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

const scatteredIcons = [
  { src: "/assets/pizza.png", alt: "pizza", top: "9%", left: "8%", size: 80, rotate: -16 },
  { src: "/assets/burger.png", alt: "burger", top: "14%", left: "68%", size: 88, rotate: 12 },
  {
    src: "/assets/french-fries.png",
    alt: "fries",
    top: "9%",
    left: "94%",
    size: 74,
    rotate: -7,
  },
  { src: "/assets/pizza.png", alt: "pizza", top: "36%", left: "46%", size: 84, rotate: 9 },
  { src: "/assets/burger.png", alt: "burger", top: "9%", left: "35%", size: 92, rotate: -12 },
  {
    src: "/assets/french-fries.png",
    alt: "fries",
    top: "62%",
    left: "25%",
    size: 78,
    rotate: 13,
  },
  { src: "/assets/pizza.png", alt: "pizza", top: "55%", left: "67%", size: 86, rotate: -9 },
  { src: "/assets/burger.png", alt: "burger", top: "65%", left: "90%", size: 90, rotate: 10 },
  {
    src: "/assets/french-fries.png",
    alt: "fries",
    top: "38%",
    left: "10%",
    size: 72,
    rotate: 6,
  },
];

const PatternBlock = ({ idSuffix }: { idSuffix: string }) => (
  <div className="relative h-screen w-full shrink-0">
    {scatteredIcons.map((icon, index) => (
      <div
        key={`${icon.alt}-${index}-${idSuffix}`}
        className="pointer-events-none absolute"
        style={{
          top: icon.top,
          left: icon.left,
          transform: `translate(-50%, -50%) rotate(${icon.rotate}deg)`,
          opacity: 0.45,
        }}
      >
        <Image
          src={icon.src}
          alt={icon.alt}
          width={icon.size}
          height={icon.size}
          style={{
            filter:
              "brightness(0) invert(1) grayscale(1) contrast(1.5)",
          }}
        />
      </div>
    ))}
  </div>
);

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
    <main
      className="relative w-full overflow-x-hidden overflow-y-auto"
      style={{
        background: "linear-gradient(180deg, #151515 0%, #232323 100%)",
        height: "100vh",
        perspective: "10px",
      }}
    >
      <header className="absolute inset-x-0 top-0 z-20 h-25">
        <nav className="mx-auto flex h-full w-full max-w-3xl items-center justify-center gap-8 px-4">
          <button className="relative px-2 py-2 text-sm font-bold text-white transition hover:text-red-400">
            Home
          </button>
          <button className="relative px-2 py-2 text-sm font-bold text-white transition after:absolute after:-bottom-1 after:left-0 after:h-[3px] after:w-full after:bg-red-600 hover:text-red-400">
            Deals
          </button>
          <button className="relative px-2 py-2 text-sm font-bold text-white transition hover:text-red-400">
            About
          </button>

          <button aria-label="Search" className="ml-2 text-white transition hover:text-red-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
        </nav>

        <div className="absolute left-5 top-1/2 flex -translate-y-1/2 items-center sm:left-7">
          <Image
            src="/assets/logoo.png"
            alt="DealsForYou logo"
            width={220}
            height={220}
            priority
            className="h-[220px] w-[220px] object-contain"
            style={{
              filter:
                "brightness(0) saturate(100%) invert(13%) sepia(94%) saturate(6361%) hue-rotate(357deg) brightness(112%) contrast(117%)",
            }}
          />
        </div>

        <div className="absolute right-5 top-1/2 flex -translate-y-1/2 items-center sm:right-7">
          <UserButton />
        </div>
      </header>

      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          transform: "translateZ(-25px) scale(3.5)",
          transformOrigin: "top",
        }}
      >
        <div className="flex flex-col w-full">
          {Array.from({ length: 10 }).map((_, i) => (
            <PatternBlock key={i} idSuffix={i.toString()} />
          ))}
        </div>
      </div>

      <div className="relative z-10 px-4 pb-6 pt-25 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">

          {errorMessage ? (
            <p className="mt-6 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}

          <section className="mt-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-500">Recommended</p>
                <h2 className="mt-2 font-display text-2xl font-bold text-yellow-500">Deals matched to your activity</h2>
              </div>
              {!isSignedIn ? (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                  Sign in required
                </span>
              ) : null}
            </div>

            <SectionEmptyState loading={loadingRecommended} items={recommendedDeals} emptyText="No recommendations yet." />
            <div className="mt-8 grid gap-16 sm:grid-cols-2 xl:grid-cols-3">
              {recommendedDeals.map((deal) => (
                <DealCard key={deal.externalId} deal={deal} onClick={() => void handleDealClick(deal.id)} />
              ))}
            </div>
          </section>

          <section className="mt-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-500">Top deals</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-yellow-500">Popular picks right now</h2>
            </div>

            <SectionEmptyState loading={loadingTop} items={topDeals} emptyText="No top deals available." />
            <div className="mt-8 grid gap-16 sm:grid-cols-2 xl:grid-cols-3">
              {topDeals.map((deal) => (
                <DealCard key={deal.externalId} deal={deal} onClick={() => void handleDealClick(deal.id)} />
              ))}
            </div>
          </section>

          <section className="mt-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-500">Filtered results</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-yellow-500">What matches your query</h2>
            </div>

            <SectionEmptyState loading={loadingFiltered} items={filteredDeals} emptyText="No deals match this filter." />
            <div className="mt-8 grid gap-16 sm:grid-cols-2 xl:grid-cols-3">
              {filteredDeals.map((deal) => (
                <DealCard key={deal.externalId} deal={deal} onClick={() => void handleDealClick(deal.id)} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}