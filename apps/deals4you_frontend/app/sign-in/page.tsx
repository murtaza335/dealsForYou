"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth, useSignIn, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { apiBaseUrl, fetchDomainUser, getRoleHomePath, readJsonResponse } from "@/lib/deals";
import { DealsLogo } from "@/components/deals-logo";
import { FoodBackground } from "@/components/food-background";

type OAuthStrategy = "oauth_google";

export default function Page() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { isLoaded: isUserLoaded, user } = useUser();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !isUserLoaded) return;

    const redirect = async () => {
      const token = await getToken();
      let domainUser = await fetchDomainUser(token).catch(() => null);

      if (!domainUser && user) {
        const firstName = user.firstName?.trim() || "User";
        const lastName = user.lastName?.trim() || firstName;
        const email = user.primaryEmailAddress?.emailAddress?.trim();

        if (!email) {
          router.replace("/");
          return;
        }

        const response = await fetch(`${apiBaseUrl}/api/users/onboard/consumer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clerkUserId: user.id,
            email,
            firstName,
            lastName,
            foodPreferences: [],
          }),
        }).catch(() => null);

        if (response?.ok) {
          domainUser = await fetchDomainUser(token).catch(() => null);
        } else if (response) {
          const payload = await readJsonResponse<{ message?: string; error?: string }>(response);
          console.warn("Consumer profile auto-onboarding failed:", payload?.message ?? payload?.error ?? response.statusText);
        }
      }

      router.replace(domainUser ? getRoleHomePath(domainUser) : "/");
    };

    void redirect();
  }, [getToken, isLoaded, isSignedIn, isUserLoaded, router, user]);

  const handleSubmit = async (formData: FormData) => {
    const emailAddress = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await signIn.password({ emailAddress, password });
    if (error) {
      setMessage(error.longMessage ?? error.message);
      return;
    }

    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ session }) => {
          if (session?.currentTask) return;
          router.push("/");
        },
      });
    }
  };

  const signInWithOauth = async (strategy: OAuthStrategy) => {
    setMessage(null);
    const { error } = await signIn.sso({
      strategy,
      redirectUrl: "/sign-in",
      redirectCallbackUrl: "/sso-callback",
    });
    if (error) setMessage(error.longMessage ?? error.message);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#151515] px-4 py-8 text-white">
      <FoodBackground blocks={4} />
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center">
        <section className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-[#1f1f1f]/95 p-8 shadow-2xl shadow-black/40 sm:p-10">
          <div className="flex justify-center">
            <DealsLogo priority />
          </div>

          <div className="mt-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white">Sign in</h1>
            <p className="mt-2 text-sm text-slate-400">Continue to the right dashboard for your account.</p>
          </div>

          <button
            type="button"
            onClick={() => void signInWithOauth("oauth_google").catch((error) => setMessage(error instanceof Error ? error.message : "Google sign in failed."))}
            disabled={fetchStatus === "fetching"}
            className="mt-7 w-full rounded-full border border-white/10 bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-200 disabled:opacity-60"
          >
            Continue with Google
          </button>
          {message ? <p className="mt-4 text-sm text-red-300">{message}</p> : null}

          <form action={handleSubmit} className="mt-6 grid gap-4">
            <label htmlFor="email" className="grid gap-2 text-sm font-semibold text-slate-200">
              <span><span className="text-red-400">*</span> Email</span>
              <input id="email" name="email" type="email" required className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 text-white outline-none focus:border-red-500" />
            </label>
            {errors.fields.identifier ? <p className="text-sm text-red-300">{errors.fields.identifier.message}</p> : null}

            <label htmlFor="password" className="grid gap-2 text-sm font-semibold text-slate-200">
              <span><span className="text-red-400">*</span> Password</span>
              <input id="password" name="password" type="password" required className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 text-white outline-none focus:border-red-500" />
            </label>
            {errors.fields.password ? <p className="text-sm text-red-300">{errors.fields.password.message}</p> : null}

            <button type="submit" disabled={fetchStatus === "fetching"} className="rounded-full bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-500 disabled:opacity-60">
              {fetchStatus === "fetching" ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-7 flex flex-col gap-2 text-center text-sm text-slate-400 sm:flex-row sm:justify-center sm:gap-5">
            <Link href="/sign-up" className="font-semibold text-yellow-400 hover:text-yellow-300">Sign up as user</Link>
            <Link href="/sign-up/brand-admin" className="font-semibold text-yellow-400 hover:text-yellow-300">Sign up as brand admin</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
