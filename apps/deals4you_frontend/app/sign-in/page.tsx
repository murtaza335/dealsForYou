'use client'

import { useEffect } from 'react'
import { useAuth, useSignIn } from '@clerk/nextjs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type OAuthStrategy = 'oauth_google'

export default function Page() {
  const { signIn, errors, fetchStatus } = useSignIn()
  const { isLoaded, isSignedIn } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/deals')
    }
  }, [isLoaded, isSignedIn, router])

  
  const handleSubmit = async (formData: FormData) => {
    const emailAddress = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await signIn.password({
      emailAddress,
      password,
    })
    if (error) {
      console.error(JSON.stringify(error, null, 2))
      return
    }

    if (signIn.status === 'complete') {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          // Handle session tasks
          // See https://clerk.com/docs/guides/development/custom-flows/authentication/session-tasks
          if (session?.currentTask) {
            console.log(session?.currentTask)
            return
          }

          // If no session tasks, navigate the signed-in user to deals page
          const url = decorateUrl('/deals')
          if (url.startsWith('http')) {
            window.location.href = url
          } else {
            router.push(url)
          }
        },
      })
    } else if (signIn.status === 'needs_second_factor') {
      // See https://clerk.com/docs/guides/development/custom-flows/authentication/multi-factor-authentication
    } else if (signIn.status === 'needs_client_trust') {
      // For other second factor strategies,
      // see https://clerk.com/docs/guides/development/custom-flows/authentication/client-trust
      const emailCodeFactor = signIn.supportedSecondFactors.find(
        (factor) => factor.strategy === 'email_code',
      )

      if (emailCodeFactor) {
        await signIn.mfa.sendEmailCode()
      }
    } else {
      // Check why the sign-in is not complete
      console.error('Sign-in attempt not complete:', signIn)
    }
  }

  const handleVerify = async (formData: FormData) => {
    const code = formData.get('code') as string

    await signIn.mfa.verifyEmailCode({ code })

    if (signIn.status === 'complete') {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          // Handle session tasks
          // See https://clerk.com/docs/guides/development/custom-flows/authentication/session-tasks
          if (session?.currentTask) {
            console.log(session?.currentTask)
            return
          }

          // If no session tasks, navigate the signed-in user to deals page
          const url = decorateUrl('/deals')
          if (url.startsWith('http')) {
            window.location.href = url
          } else {
            router.push(url)
          }
        },
      })
    } else {
      // Check why the sign-in is not complete
      console.error('Sign-in attempt not complete:', signIn)
    }
  }


  const signInWithOauth = async (strategy: OAuthStrategy) => {
    const { error } = await signIn.sso({
      strategy,
      redirectUrl: '/deals',
      redirectCallbackUrl: '/sso-callback',
    })
    if (error) {
      console.error(JSON.stringify(error, null, 2))
      return
    }

    if (signIn.status === 'needs_second_factor') {
      // See https://clerk.com/docs/guides/development/custom-flows/authentication/multi-factor-authentication
    } else if (signIn.status === 'needs_client_trust') {
      // See https://clerk.com/docs/guides/development/custom-flows/authentication/client-trust
    } else {
      // Check why the sign-in is not complete
      console.log('Sign-in attempt not complete:', signIn, 2, null)
    }
  }


  if (signIn.status === 'needs_client_trust') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-sky-100 via-cyan-50 to-emerald-100 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
          <section className="w-full max-w-md rounded-3xl border border-white/70 bg-white/80 p-7 shadow-xl backdrop-blur sm:p-8">
            <p className="mb-3 inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-800">
              DealsForYou
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Verify your account</h1>
            <p className="mt-2 text-sm text-slate-600">Enter the code sent to your email to complete sign in.</p>

            <form action={handleVerify} className="mt-6 grid gap-4">
              <label htmlFor="code" className="grid gap-2 text-sm font-medium text-slate-700">
                Verification code
                <input
                  id="code"
                  name="code"
                  type="text"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                  placeholder="Enter code"
                />
              </label>

              {errors.fields.code ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                  {errors.fields.code.message}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={fetchStatus === 'fetching'}
                className="rounded-full bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {fetchStatus === 'fetching' ? 'Verifying...' : 'Verify'}
              </button>
            </form>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => signIn.mfa.sendEmailCode()}
                type="button"
                className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                New code
              </button>
              <button
                onClick={() => signIn.reset()}
                type="button"
                className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                Start over
              </button>
            </div>

            <p className="mt-6 text-sm text-slate-600">
              Need an account?{' '}
              <Link href="/sign-up" className="font-semibold text-cyan-700 underline underline-offset-4">
                Sign up
              </Link>
            </p>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-100 via-cyan-50 to-emerald-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
        <section className="w-full max-w-md rounded-3xl border border-white/70 bg-white/80 p-7 shadow-xl backdrop-blur sm:p-8">
          <p className="mb-3 inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-800">
            DealsForYou
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Sign in</h1>
          <p className="mt-2 text-sm text-slate-600">Welcome back. Continue to your personalized deals.</p>

          <div className="mt-4 grid gap-3">
            <button
              type="button"
              onClick={() => void signInWithOauth('oauth_google')}
              disabled={fetchStatus === 'fetching'}
              className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Continue with Google
            </button>
          </div>

          <form action={handleSubmit} className="mt-6 grid gap-4">
            <label htmlFor="email" className="grid gap-2 text-sm font-medium text-slate-700">
              Email
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              />
            </label>

            {errors.fields.identifier ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                {errors.fields.identifier.message}
              </p>
            ) : null}

            <label htmlFor="password" className="grid gap-2 text-sm font-medium text-slate-700">
              Password
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Your password"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              />
            </label>

            {errors.fields.password ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                {errors.fields.password.message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={fetchStatus === 'fetching'}
              className="rounded-full bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {fetchStatus === 'fetching' ? 'Signing in...' : 'Continue'}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-600">
            New here?{' '}
            <Link href="/sign-up" className="font-semibold text-cyan-700 underline underline-offset-4">
              Create an account
            </Link>
          </p>
        </section>
      </div>
    </main>
  )
}