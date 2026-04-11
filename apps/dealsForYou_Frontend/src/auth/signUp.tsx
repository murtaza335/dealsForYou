import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useAuth, useSignUp } from "@clerk/clerk-react";

type SignUpPageProps = {
  onAuthenticated: () => void;
  onSwitchToSignIn: () => void;
};

function SignUpPage({ onAuthenticated, onSwitchToSignIn }: SignUpPageProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { signUp, setActive, isLoaded: signUpLoaded } = useSignUp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      onAuthenticated();
    }
  }, [isLoaded, isSignedIn, onAuthenticated]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!signUpLoaded || !signUp) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await signUp.create({
        emailAddress: email,
        password,
      });

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        onAuthenticated();
      } else {
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        setPendingVerification(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign up.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!signUpLoaded || !signUp) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        onAuthenticated();
      } else {
        setError("Verification is not complete yet. Please try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Email verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleOauth = async (strategy: "oauth_google" | "oauth_github") => {
    if (!signUpLoaded || !signUp) return;

    setLoading(true);
    setError(null);

    try {
      await signUp.authenticateWithRedirect({
        strategy,
        redirectUrl: window.location.href,
        redirectUrlComplete: window.location.href,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "OAuth sign-up failed.");
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-card auth-hero">
        <p className="eyebrow">Deals4You</p>
        <h1>Create your account</h1>
        <p className="subtitle">
          Sign up with email, Google, or GitHub to unlock the protected deals area.
        </p>

        <div className="auth-actions">
          <button type="button" className="auth-primary-btn" onClick={onSwitchToSignIn}>
            I already have an account
          </button>
          <button
            type="button"
            className="auth-secondary-btn"
            onClick={() => void handleOauth("oauth_google")}
            disabled={loading}
          >
            Sign up with Google
          </button>
          <button
            type="button"
            className="auth-secondary-btn"
            onClick={() => void handleOauth("oauth_github")}
            disabled={loading}
          >
            Sign up with GitHub
          </button>
        </div>

        {!pendingVerification ? (
          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Email
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@example.com" />
            </label>
            <label>
              Password
              <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Create a password" />
            </label>
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleVerifyEmail}>
            <label>
              Verification code
              <input
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value)}
                type="text"
                placeholder="Enter code from your email"
              />
            </label>
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? "Verifying..." : "Verify email"}
            </button>
          </form>
        )}

        {error ? <p className="error-box">{error}</p> : null}
      </section>
    </main>
  );
}

export default SignUpPage;