"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { apiBaseUrl, uploadImage } from "@/lib/deals";

type Draft = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  title: string;
  brandName: string;
  tagline: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  country: string;
  cities: string;
  areas: string;
  cuisineTags: string;
  website: string;
  notes: string;
  instagram: string;
  facebook: string;
  scrapeRequested: boolean;
};

const initialDraft: Draft = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phone: "",
  title: "",
  brandName: "",
  tagline: "",
  description: "",
  contactEmail: "",
  contactPhone: "",
  country: "Pakistan",
  cities: "",
  areas: "",
  cuisineTags: "",
  website: "",
  notes: "",
  instagram: "",
  facebook: "",
  scrapeRequested: false,
};

const list = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);

export default function BrandAdminSignUpPage() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const router = useRouter();
  const [draft, setDraft] = useState(initialDraft);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadedLogoUrl, setUploadedLogoUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));

  const validate = () => {
    if (!logoFile) return "Brand logo is required.";
    if (draft.scrapeRequested && !draft.website.trim()) return "Website URL is required when scraper setup is requested.";
    if (!draft.firstName || !draft.lastName || !draft.email || !draft.password || !draft.phone || !draft.title) return "Complete all admin fields.";
    if (!draft.brandName || !draft.description || !draft.contactEmail || !draft.contactPhone || !draft.country || list(draft.cities).length === 0) return "Complete all required brand fields.";
    return null;
  };

  const createAccount = async () => {
    setMessage(null);
    const validation = validate();
    if (validation) {
      setMessage(validation);
      return;
    }

    const logoUrl = await uploadImage(logoFile!, "deals4you/brand-logos");
    setUploadedLogoUrl(logoUrl);

    const { error } = await signUp.password({ emailAddress: draft.email, password: draft.password });
    if (error) return;
    await signUp.update({ firstName: draft.firstName, lastName: draft.lastName });
    await signUp.verifications.sendEmailCode();
  };

  const verify = async (formData: FormData) => {
    setMessage(null);
    const code = formData.get("code") as string;
    await signUp.verifications.verifyEmailCode({ code });

    if (signUp.status !== "complete" || !uploadedLogoUrl) {
      setMessage("Verification is not complete yet.");
      return;
    }

    const response = await fetch(`${apiBaseUrl}/api/users/onboard/brand-admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clerkUserId: signUp.createdUserId,
        email: draft.email,
        firstName: draft.firstName,
        lastName: draft.lastName,
        phone: draft.phone,
        title: draft.title,
        brand: {
          name: draft.brandName,
          tagline: draft.tagline || undefined,
          description: draft.description,
          logoUrl: uploadedLogoUrl,
          website: draft.website || undefined,
          contactEmail: draft.contactEmail,
          contactPhone: draft.contactPhone,
          country: draft.country,
          cities: list(draft.cities),
          areas: list(draft.areas),
          cuisineTags: list(draft.cuisineTags),
          socials: {
            instagram: draft.instagram,
            facebook: draft.facebook,
          },
          notes: draft.notes || undefined,
          scrapeRequested: draft.scrapeRequested,
        },
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setMessage(payload?.message ?? "Brand onboarding failed.");
      return;
    }

    await signUp.finalize({
      navigate: () => router.push("/brand-admin/pending"),
    });
  };

  const needsCode =
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address") &&
    signUp.missingFields.length === 0;

  return (
    <main className="min-h-screen bg-[#151515] px-4 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl items-center justify-center">
        <section className="w-full max-w-4xl rounded-[2rem] border border-white/10 bg-[#1f1f1f]/95 p-8 shadow-2xl shadow-black/40 sm:p-10">
          <div className="flex justify-center">
            <Image src="/assets/logoo.png" alt="DealsForYou" width={170} height={110} className="object-contain" priority />
          </div>
          <h1 className="mt-2 text-center text-3xl font-bold">Sign up as brand admin</h1>
          <p className="mt-2 text-center text-sm text-slate-400">Create a brand profile. Your account will be reviewed before the dashboard unlocks.</p>

          {needsCode ? (
            <form action={verify} className="mt-7 grid gap-4">
              <input name="code" placeholder="Verification code" className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 outline-none focus:border-red-500" />
              {errors.fields.code ? <p className="text-sm text-red-300">{errors.fields.code.message}</p> : null}
              {message ? <p className="text-sm text-red-300">{message}</p> : null}
              <button className="rounded-full bg-red-600 px-5 py-3 text-sm font-bold transition hover:bg-red-500">Verify and submit brand</button>
            </form>
          ) : (
            <>
              <div className="mt-7 grid gap-4 md:grid-cols-2">
                <input placeholder="Admin first name" value={draft.firstName} onChange={(e) => update("firstName", e.target.value)} className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 outline-none focus:border-red-500" />
                <input placeholder="Admin last name" value={draft.lastName} onChange={(e) => update("lastName", e.target.value)} className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 outline-none focus:border-red-500" />
                <input placeholder="Admin email" type="email" value={draft.email} onChange={(e) => update("email", e.target.value)} className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 outline-none focus:border-red-500" />
                <input placeholder="Password" type="password" value={draft.password} onChange={(e) => update("password", e.target.value)} className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 outline-none focus:border-red-500" />
                <input placeholder="Admin phone" value={draft.phone} onChange={(e) => update("phone", e.target.value)} className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 outline-none focus:border-red-500" />
                <input placeholder="Role / title" value={draft.title} onChange={(e) => update("title", e.target.value)} className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 outline-none focus:border-red-500" />
                <input placeholder="Brand name" value={draft.brandName} onChange={(e) => update("brandName", e.target.value)} className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 outline-none focus:border-red-500" />
                <input placeholder="Tagline (optional)" value={draft.tagline} onChange={(e) => update("tagline", e.target.value)} className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 outline-none focus:border-red-500" />
                <textarea placeholder="Short brand description" value={draft.description} onChange={(e) => update("description", e.target.value)} className="min-h-28 rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 outline-none focus:border-red-500 md:col-span-2" />
                <input placeholder="Brand contact email" type="email" value={draft.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 outline-none focus:border-red-500" />
                <input placeholder="Brand contact phone" value={draft.contactPhone} onChange={(e) => update("contactPhone", e.target.value)} className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 outline-none focus:border-red-500" />
                <input placeholder="Country" value={draft.country} onChange={(e) => update("country", e.target.value)} className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 outline-none focus:border-red-500" />
                <input placeholder="Cities, comma separated" value={draft.cities} onChange={(e) => update("cities", e.target.value)} className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 outline-none focus:border-red-500" />
                <input placeholder="Areas / branches, comma separated" value={draft.areas} onChange={(e) => update("areas", e.target.value)} className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 outline-none focus:border-red-500" />
                <input placeholder="Cuisine tags, comma separated" value={draft.cuisineTags} onChange={(e) => update("cuisineTags", e.target.value)} className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 outline-none focus:border-red-500" />
                <input placeholder="Instagram URL (optional)" value={draft.instagram} onChange={(e) => update("instagram", e.target.value)} className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 outline-none focus:border-red-500" />
                <input placeholder="Facebook URL (optional)" value={draft.facebook} onChange={(e) => update("facebook", e.target.value)} className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 outline-none focus:border-red-500" />
                <label className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 text-sm text-slate-300">
                  Brand logo
                  <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} className="mt-2 block w-full text-sm" />
                </label>
                <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 text-sm font-semibold">
                  Request website scraper
                  <input type="checkbox" checked={draft.scrapeRequested} onChange={(e) => update("scrapeRequested", e.target.checked)} className="h-5 w-5 accent-red-600" />
                </label>
                <input placeholder={draft.scrapeRequested ? "Website URL (required)" : "Website URL (optional)"} value={draft.website} onChange={(e) => update("website", e.target.value)} className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 outline-none focus:border-red-500 md:col-span-2" />
                <textarea placeholder="Notes for review (optional)" value={draft.notes} onChange={(e) => update("notes", e.target.value)} className="min-h-24 rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 outline-none focus:border-red-500 md:col-span-2" />
              </div>
              {message ? <p className="mt-4 text-sm text-red-300">{message}</p> : null}
              <button type="button" onClick={() => void createAccount()} disabled={fetchStatus === "fetching"} className="mt-6 w-full rounded-full bg-red-600 px-5 py-3 text-sm font-bold transition hover:bg-red-500 disabled:opacity-60">
                {fetchStatus === "fetching" ? "Creating..." : "Create brand admin account"}
              </button>
            </>
          )}

          <p className="mt-7 text-center text-sm text-slate-400">
            Already registered? <Link href="/sign-in" className="font-semibold text-yellow-400">Sign in</Link>
          </p>
          <div id="clerk-captcha" className="mt-4" />
        </section>
      </div>
    </main>
  );
}
