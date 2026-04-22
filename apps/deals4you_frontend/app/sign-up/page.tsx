'use client'

import { useAuth, useSignUp } from '@clerk/nextjs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Page() {
  const { signUp, errors, fetchStatus } = useSignUp()
  const { isSignedIn } = useAuth()
  const router = useRouter()

  const signUpWithGoogle = async () => {
    const { error } = await signUp.sso({
      strategy: 'oauth_google',
      redirectUrl: '/deals',
      redirectCallbackUrl: '/sso-callback',
    })

    if (error) {
      console.error(JSON.stringify(error, null, 2))
    }
  }

  const handleSubmit = async (formData: FormData) => {
    const emailAddress = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await signUp.password({
      emailAddress,
      password,
    })
    if (error) {
      console.error(JSON.stringify(error, null, 2))
      return
    }

    if (!error) await signUp.verifications.sendEmailCode()
  }

  const handleVerify = async (formData: FormData) => {
    const code = formData.get('code') as string

    await signUp.verifications.verifyEmailCode({
      code,
    })
    if (signUp.status === 'complete') {
      await signUp.finalize({
        // Redirect the user to deals page after signing up
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
      console.error('Sign-up attempt not complete:', signUp)
    }
  }

  if (signUp.status === 'complete' || isSignedIn) {
    return null
  }

  if (
    signUp.status === 'missing_requirements' &&
    signUp.unverifiedFields.includes('email_address') &&
    signUp.missingFields.length === 0
  ) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-100 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
          <section className="w-full max-w-md rounded-3xl border border-white/70 bg-white/80 p-7 shadow-xl backdrop-blur sm:p-8">
            <p className="mb-3 inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-800">
              DealsForYou
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Verify your account</h1>
            <p className="mt-2 text-sm text-slate-600">Enter the code sent to your email to finish creating your account.</p>

            <form action={handleVerify} className="mt-6 grid gap-4">
              <label htmlFor="code" className="grid gap-2 text-sm font-medium text-slate-700">
                Verification code
                <input
                  id="code"
                  name="code"
                  type="text"
                  placeholder="Enter code"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
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
                className="rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {fetchStatus === 'fetching' ? 'Verifying...' : 'Verify'}
              </button>
            </form>

            <button
              onClick={() => signUp.verifications.sendEmailCode()}
              type="button"
              className="mt-4 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              I need a new code
            </button>

            <p className="mt-6 text-sm text-slate-600">
              Already have an account?{' '}
              <Link href="/sign-in" className="font-semibold text-orange-700 underline underline-offset-4">
                Sign in
              </Link>
            </p>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
        <section className="w-full max-w-md rounded-3xl border border-white/70 bg-white/80 p-7 shadow-xl backdrop-blur sm:p-8">
          <p className="mb-3 inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-800">
            DealsForYou
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Sign up</h1>
          <p className="mt-2 text-sm text-slate-600">Create your account to unlock protected and personalized deals.</p>

          <div className="mt-4 grid gap-3">
            <button
              type="button"
              onClick={() => void signUpWithGoogle()}
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
                type="email"
                name="email"
                placeholder="you@example.com"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
              />
            </label>

            {errors.fields.emailAddress ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                {errors.fields.emailAddress.message}
              </p>
            ) : null}

            <label htmlFor="password" className="grid gap-2 text-sm font-medium text-slate-700">
              Password
              <input
                id="password"
                type="password"
                name="password"
                placeholder="Create a password"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
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
              className="rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {fetchStatus === 'fetching' ? 'Creating account...' : 'Continue'}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-600">
            Already have an account?{' '}
            <Link href="/sign-in" className="font-semibold text-orange-700 underline underline-offset-4">
              Sign in
            </Link>
          </p>

          {/* Required for sign-up flows. Clerk's bot sign-up protection is enabled by default */}
          <div id="clerk-captcha" className="mt-4" />
        </section>
      </div>
    </main>
  )
}