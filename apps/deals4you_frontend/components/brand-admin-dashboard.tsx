"use client";

import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import { apiBaseUrl, authHeaders, formatPrice, type BrandProfile, type Deal, uploadImage } from "@/lib/deals";

type DealDraft = {
  title: string;
  description: string;
  price: string;
  originalPrice: string;
  discountPercent: string;
  minPersons: string;
  maxPersons: string;
  cuisineTags: string;
  mealType: string;
  conditions: string;
  endTime: string;
};

const emptyDeal: DealDraft = {
  title: "",
  description: "",
  price: "",
  originalPrice: "",
  discountPercent: "",
  minPersons: "",
  maxPersons: "",
  cuisineTags: "",
  mealType: "",
  conditions: "",
  endTime: "",
};

const list = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);

export function BrandAdminDashboard() {
  const { getToken } = useAuth();
  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [draft, setDraft] = useState(emptyDeal);
  const [dealImage, setDealImage] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const token = await getToken();
    const [brandResponse, dealsResponse] = await Promise.all([
      fetch(`${apiBaseUrl}/api/brand-admin/brand`, { headers: authHeaders(token) }),
      fetch(`${apiBaseUrl}/api/brand-admin/deals`, { headers: authHeaders(token) }),
    ]);

    const brandPayload = await brandResponse.json();
    const dealsPayload = await dealsResponse.json();
    setBrand(brandPayload.data ?? null);
    setDeals(dealsPayload.data ?? []);
    setLoading(false);
  }, [getToken]);

  useEffect(() => {
    void load().catch((error) => {
      setMessage(error instanceof Error ? error.message : "Could not load dashboard.");
      setLoading(false);
    });
  }, [load]);

  const update = (key: keyof DealDraft, value: string) => setDraft((current) => ({ ...current, [key]: value }));

  const addDeal = async () => {
    setMessage(null);
    if (!brand?.manualDealManagementEnabled) return;
    if (!dealImage) {
      setMessage("Deal image is required.");
      return;
    }

    const token = await getToken();
    const imgUrl = await uploadImage(dealImage, "deals4you/manual-deals");
    const response = await fetch(`${apiBaseUrl}/api/brand-admin/deals`, {
      method: "POST",
      headers: { ...authHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify({
        title: draft.title,
        description: draft.description,
        price: Number(draft.price),
        originalPrice: draft.originalPrice ? Number(draft.originalPrice) : undefined,
        discountPercent: draft.discountPercent ? Number(draft.discountPercent) : undefined,
        minPersons: draft.minPersons ? Number(draft.minPersons) : undefined,
        maxPersons: draft.maxPersons ? Number(draft.maxPersons) : undefined,
        cuisineTags: list(draft.cuisineTags),
        mealType: list(draft.mealType),
        conditions: draft.conditions || undefined,
        endTime: draft.endTime || undefined,
        imgUrl,
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setMessage(payload?.message ?? "Could not add deal.");
      return;
    }

    setDraft(emptyDeal);
    setDealImage(null);
    await load();
  };

  const deleteDeal = async (dealId: string) => {
    const token = await getToken();
    await fetch(`${apiBaseUrl}/api/brand-admin/deals/${encodeURIComponent(dealId)}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
    await load();
  };

  if (loading) return <main className="min-h-screen bg-[#151515] p-8 text-white">Loading...</main>;

  return (
    <main className="min-h-screen bg-[#151515] px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-[#1f1f1f] p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            {brand?.logoUrl || brand?.imgUrl ? <Image src={brand.logoUrl || brand.imgUrl || ""} alt={brand.name} width={74} height={74} className="rounded-2xl object-contain" /> : null}
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-400">Brand admin</p>
              <h1 className="text-3xl font-bold">{brand?.name ?? "Your brand"}</h1>
              <p className="mt-1 text-sm text-slate-400">{brand?.scrapeRequested ? "Scraper setup requested" : "Manual deal management"}</p>
            </div>
          </div>
          <div className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300">
            {brand?.approvalStatus} / {brand?.scraperStatus}
          </div>
        </header>

        {message ? <p className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{message}</p> : null}

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-3xl border border-white/10 bg-[#1f1f1f] p-6">
            <h2 className="text-xl font-bold">Add deal</h2>
            {!brand?.manualDealManagementEnabled ? (
              <p className="mt-4 text-sm text-slate-400">Manual add/delete is locked because scraper setup was requested for this brand.</p>
            ) : (
              <div className="mt-5 grid gap-3">
                <input placeholder="Deal title" value={draft.title} onChange={(e) => update("title", e.target.value)} className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 outline-none focus:border-red-500" />
                <textarea placeholder="Description" value={draft.description} onChange={(e) => update("description", e.target.value)} className="min-h-24 rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 outline-none focus:border-red-500" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input placeholder="Price" value={draft.price} onChange={(e) => update("price", e.target.value)} className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 outline-none focus:border-red-500" />
                  <input placeholder="Original price" value={draft.originalPrice} onChange={(e) => update("originalPrice", e.target.value)} className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 outline-none focus:border-red-500" />
                  <input placeholder="Discount %" value={draft.discountPercent} onChange={(e) => update("discountPercent", e.target.value)} className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 outline-none focus:border-red-500" />
                  <input placeholder="Valid until" type="datetime-local" value={draft.endTime} onChange={(e) => update("endTime", e.target.value)} className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 outline-none focus:border-red-500" />
                  <input placeholder="Min persons" value={draft.minPersons} onChange={(e) => update("minPersons", e.target.value)} className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 outline-none focus:border-red-500" />
                  <input placeholder="Max persons" value={draft.maxPersons} onChange={(e) => update("maxPersons", e.target.value)} className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 outline-none focus:border-red-500" />
                </div>
                <input placeholder="Cuisine tags" value={draft.cuisineTags} onChange={(e) => update("cuisineTags", e.target.value)} className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 outline-none focus:border-red-500" />
                <input placeholder="Meal types" value={draft.mealType} onChange={(e) => update("mealType", e.target.value)} className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 outline-none focus:border-red-500" />
                <input placeholder="Conditions" value={draft.conditions} onChange={(e) => update("conditions", e.target.value)} className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 outline-none focus:border-red-500" />
                <input type="file" accept="image/*" onChange={(e) => setDealImage(e.target.files?.[0] ?? null)} className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 text-sm" />
                <button onClick={() => void addDeal()} className="rounded-full bg-red-600 px-5 py-3 text-sm font-bold transition hover:bg-red-500">Add deal</button>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#1f1f1f] p-6">
            <h2 className="text-xl font-bold">Current deals</h2>
            <div className="mt-5 grid gap-4">
              {deals.map((deal) => (
                <article key={deal.externalId} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#151515] p-4 sm:flex-row sm:items-center">
                  <img src={deal.imgUrl} alt={deal.title} className="h-24 w-24 rounded-xl object-contain" />
                  <div className="flex-1">
                    <h3 className="font-bold">{deal.title}</h3>
                    <p className="line-clamp-2 text-sm text-slate-400">{deal.description}</p>
                    <p className="mt-2 font-bold text-yellow-400">{formatPrice(deal.price)}</p>
                  </div>
                  {brand?.manualDealManagementEnabled ? (
                    <button onClick={() => void deleteDeal((deal as any).dealId)} className="rounded-full border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/10">Delete</button>
                  ) : null}
                </article>
              ))}
              {deals.length === 0 ? <p className="text-sm text-slate-400">No deals yet.</p> : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
