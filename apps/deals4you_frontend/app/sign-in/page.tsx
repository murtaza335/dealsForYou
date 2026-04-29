"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useAuth, useSignIn, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { apiBaseUrl, fetchDomainUser, getRoleHomePath } from "@/lib/deals";

type OAuthStrategy = "oauth_google";

export default function Page() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const redirect = async () => {
      const token = await getToken();
      let domainUser = await fetchDomainUser(token).catch(() => null);

      if (!domainUser && user) {
        await fetch(`${apiBaseUrl}/api/users/onboard/consumer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clerkUserId: user.id,
            email: user.primaryEmailAddress?.emailAddress ?? "",
            firstName: user.firstName ?? "User",
            lastName: user.lastName ?? "",
            foodPreferences: [],
          }),
        }).catch(() => null);
        domainUser = await fetchDomainUser(token).catch(() => null);
      }

      router.replace(getRoleHomePath(domainUser));
    };

    void redirect();
  }, [getToken, isLoaded, isSignedIn, router, user]);

  const handleSubmit = async (formData: FormData) => {
    const emailAddress = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await signIn.password({ emailAddress, password });
    if (error) return;

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
    await signIn.sso({
      strategy,
      redirectUrl: "/",
      redirectCallbackUrl: "/sso-callback",
    });
  };

  return (
    <main className="min-h-screen bg-[#151515] px-4 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center">
        <section className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-[#1f1f1f]/95 p-8 shadow-2xl shadow-black/40 sm:p-10">
          <div className="flex justify-center">
            <Image src="/assets/logoo.png" alt="DealsForYou" width={170} height={110} className="object-contain" priority />
          </div>

          <div className="mt-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white">Sign in</h1>
            <p className="mt-2 text-sm text-slate-400">Continue to the right dashboard for your account.</p>
          </div>

          <button
            type="button"
            onClick={() => void signInWithOauth("oauth_google")}
            disabled={fetchStatus === "fetching"}
            className="mt-7 w-full rounded-full border border-white/10 bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-200 disabled:opacity-60"
          >
            Continue with Google
          </button>

          <form action={handleSubmit} className="mt-6 grid gap-4">
            <label htmlFor="email" className="grid gap-2 text-sm font-semibold text-slate-200">
              Email
              <input id="email" name="email" type="email" className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 text-white outline-none focus:border-red-500" />
            </label>
            {errors.fields.identifier ? <p className="text-sm text-red-300">{errors.fields.identifier.message}</p> : null}

            <label htmlFor="password" className="grid gap-2 text-sm font-semibold text-slate-200">
              Password
              <input id="password" name="password" type="password" className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 text-white outline-none focus:border-red-500" />
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
