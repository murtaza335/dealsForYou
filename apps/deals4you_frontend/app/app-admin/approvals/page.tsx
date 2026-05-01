"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import { apiBaseUrl, authHeaders, type BrandProfile } from "@/lib/deals";
import { FoodBackground } from "@/components/food-background";

export default function AppAdminApprovalsPage() {
  const { getToken } = useAuth();
  const [brands, setBrands] = useState<BrandProfile[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    const response = await fetch(`${apiBaseUrl}/api/app-admin/brands/pending`, {
      headers: authHeaders(token),
    });
    const payload = await response.json();
    setBrands(payload.data ?? []);
  }, [getToken]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load().catch((error) => setMessage(error instanceof Error ? error.message : "Could not load approvals."));
  }, [load]);

  const decide = async (brandId: string, action: "approve" | "reject") => {
    const token = await getToken();
    await fetch(`${apiBaseUrl}/api/app-admin/brands/${brandId}/${action}`, {
      method: "PATCH",
      headers: { ...authHeaders(token), "Content-Type": "application/json" },
      body: action === "reject" ? JSON.stringify({ reason: "Rejected from approvals dashboard" }) : undefined,
    });
    await load();
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#151515] px-4 py-8 text-white">
      <FoodBackground blocks={5} />
      <div className="relative z-10 mx-auto max-w-6xl">
        <header className="rounded-3xl border border-white/10 bg-[#1f1f1f] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-400">App admin</p>
          <h1 className="mt-2 text-3xl font-bold">Brand approvals</h1>
        </header>
        {message ? <p className="mt-4 text-sm text-red-300">{message}</p> : null}
        <div className="mt-6 grid gap-4">
          {brands.map((brand) => (
            <article key={brand.brandId} className="rounded-3xl border border-white/10 bg-[#1f1f1f] p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-bold">{brand.name}</h2>
                  <p className="mt-1 text-sm text-slate-400">{brand.description}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    {brand.contactEmail} / {brand.contactPhone} / {(brand.cities ?? []).join(", ")}
                  </p>
                  <p className="mt-2 text-sm text-yellow-400">
                    Scraper: {brand.scrapeRequested ? `requested (${brand.website ?? "no url"})` : "not requested"}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => void decide(brand.brandId, "approve")} className="rounded-full bg-red-600 px-5 py-2 text-sm font-bold hover:bg-red-500">Approve</button>
                  <button onClick={() => void decide(brand.brandId, "reject")} className="rounded-full border border-white/10 px-5 py-2 text-sm font-bold text-slate-300 hover:bg-white/5">Reject</button>
                </div>
              </div>
            </article>
          ))}
          {brands.length === 0 ? <p className="text-sm text-slate-400">No pending brands.</p> : null}
        </div>
      </div>
    </main>
  );
}
