"use client";

import { DealCard } from "@/components/deal-card";
import { type Deal } from "@/lib/deals";

interface RecommendDealsSliderProps {
  isSignedIn: boolean;
  loading: boolean;
  deals: Deal[];
  onDealOpen: (deal: Deal) => void;
}

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
    return <p className="mt-2 text-sm text-slate-400">Loading...</p>;
  }

  if (items.length === 0) {
    return <p className="mt-2 text-sm text-slate-400">{emptyText}</p>;
  }

  return null;
}

export function RecommendDealsSlider({
  isSignedIn,
  loading,
  deals,
  onDealOpen,
}: RecommendDealsSliderProps) {
  return (
    <section className="py-4">
      <div className="flex items-center justify-between px-10">
  <div>
    {/* <div className="mb-2 flex items-center gap-2">
      <span className="h-px w-4 bg-amber-400" />
      <p
        style={{ fontFamily: "'Courier New', monospace", letterSpacing: "0.2em" }}
        className="text-[11px] font-bold uppercase text-amber-400"
      >
        Recommended
      </p>
    </div> */}

    <h2
      style={{
        fontFamily: "'Georgia', serif",
        lineHeight: 1.15,
        letterSpacing: "-0.01em",
      }}
      className="text-3xl font-bold text-white"
    >
      We think you'll{" "}
      <span
        style={{
          fontFamily: "'Georgia', serif",
          fontStyle: "italic",
          background: "linear-gradient(90deg, #f59e0b, #fb923c)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        love these.
      </span>{" "}
    </h2>
  </div>

  {!isSignedIn && (
    <span
      style={{ fontFamily: "'Courier New', monospace", letterSpacing: "0.1em" }}
      className="rounded-full border border-amber-400/40 bg-amber-900/20 px-3 py-1.5 text-[10px] font-bold uppercase text-amber-300"
    >
      Sign in to unlock
    </span>
  )}
</div>

      <SectionEmptyState loading={loading} items={deals} emptyText="No recommendations yet." />

      <div className="mt-4 grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
        {deals.map((deal) => (
          <DealCard
            key={deal.externalId}
            deal={deal}
            onOpen={() => onDealOpen(deal)}
          />
        ))}
      </div>
    </section>
  );
}
