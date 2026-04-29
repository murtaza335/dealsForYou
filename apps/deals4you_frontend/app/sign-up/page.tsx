"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { apiBaseUrl } from "@/lib/deals";

type ConsumerDraft = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  city: string;
  area: string;
  foodPreferences: string;
};

const initialDraft: ConsumerDraft = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phone: "",
  city: "",
  area: "",
  foodPreferences: "",
};

export default function Page() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const router = useRouter();
  const [draft, setDraft] = useState(initialDraft);
  const [message, setMessage] = useState<string | null>(null);

  const update = (key: keyof ConsumerDraft, value: string) => setDraft((current) => ({ ...current, [key]: value }));

  const createAccount = async () => {
    setMessage(null);
    const { error } = await signUp.password({
      emailAddress: draft.email,
      password: draft.password,
    });
    if (error) return;
    await signUp.update({ firstName: draft.firstName, lastName: draft.lastName });
    await signUp.verifications.sendEmailCode();
  };

  const verify = async (formData: FormData) => {
    const code = formData.get("code") as string;
    await signUp.verifications.verifyEmailCode({ code });

    if (signUp.status !== "complete") {
      setMessage("Verification is not complete yet.");
      return;
    }

    await fetch(`${apiBaseUrl}/api/users/onboard/consumer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clerkUserId: signUp.createdUserId,
        email: draft.email,
        firstName: draft.firstName,
        lastName: draft.lastName,
        phone: draft.phone || undefined,
        city: draft.city || undefined,
        area: draft.area || undefined,
        foodPreferences: draft.foodPreferences.split(",").map((item) => item.trim()).filter(Boolean),
      }),
    });

    await signUp.finalize({
      navigate: () => router.push("/"),
    });
  };

  const signUpWithGoogle = async () => {
    await signUp.sso({
      strategy: "oauth_google",
      redirectUrl: "/",
      redirectCallbackUrl: "/sso-callback",
    });
  };

  const needsCode =
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address") &&
    signUp.missingFields.length === 0;

  return (
    <main className="min-h-screen bg-[#151515] px-4 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center">
        <section className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-[#1f1f1f]/95 p-8 shadow-2xl shadow-black/40 sm:p-10">
          <div className="flex justify-center">
            <Image src="/assets/logoo.png" alt="DealsForYou" width={170} height={110} className="object-contain" priority />
          </div>
          <h1 className="mt-2 text-center text-3xl font-bold">Sign up as user</h1>
          <p className="mt-2 text-center text-sm text-slate-400">Create a consumer profile for recommendations and deals.</p>

          {needsCode ? (
            <form action={verify} className="mt-7 grid gap-4">
              <label className="grid gap-2 text-sm font-semibold text-slate-200">
                Verification code
                <input name="code" className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 outline-none focus:border-red-500" />
              </label>
              {errors.fields.code ? <p className="text-sm text-red-300">{errors.fields.code.message}</p> : null}
              <button className="rounded-full bg-red-600 px-5 py-3 text-sm font-bold transition hover:bg-red-500">Verify and continue</button>
            </form>
          ) : (
            <>
              <button type="button" onClick={() => void signUpWithGoogle()} className="mt-7 w-full rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-200">
                Continue with Google
              </button>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <input placeholder="First name" value={draft.firstName} onChange={(e) => update("firstName", e.target.value)} className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 outline-none focus:border-red-500" />
                <input placeholder="Last name" value={draft.lastName} onChange={(e) => update("lastName", e.target.value)} className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 outline-none focus:border-red-500" />
                <input placeholder="Email" type="email" value={draft.email} onChange={(e) => update("email", e.target.value)} className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 outline-none focus:border-red-500 sm:col-span-2" />
                <input placeholder="Password" type="password" value={draft.password} onChange={(e) => update("password", e.target.value)} className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 outline-none focus:border-red-500 sm:col-span-2" />
                <input placeholder="Phone (optional)" value={draft.phone} onChange={(e) => update("phone", e.target.value)} className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 outline-none focus:border-red-500" />
                <input placeholder="City (optional)" value={draft.city} onChange={(e) => update("city", e.target.value)} className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 outline-none focus:border-red-500" />
                <input placeholder="Area (optional)" value={draft.area} onChange={(e) => update("area", e.target.value)} className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 outline-none focus:border-red-500" />
                <input placeholder="Food preferences, comma separated" value={draft.foodPreferences} onChange={(e) => update("foodPreferences", e.target.value)} className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 outline-none focus:border-red-500" />
              </div>
              {message ? <p className="mt-4 text-sm text-red-300">{message}</p> : null}
              <button type="button" onClick={() => void createAccount()} disabled={fetchStatus === "fetching"} className="mt-6 w-full rounded-full bg-red-600 px-5 py-3 text-sm font-bold transition hover:bg-red-500 disabled:opacity-60">
                {fetchStatus === "fetching" ? "Creating..." : "Create user account"}
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
