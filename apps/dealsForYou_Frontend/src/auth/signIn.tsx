import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
	useAuth,
	useSignIn,
} from "@clerk/clerk-react";

type SignInPageProps = {
	onAuthenticated: () => void;
	onSwitchToSignUp: () => void;
};

function SignInPage({ onAuthenticated, onSwitchToSignUp }: SignInPageProps) {
	const { isLoaded, isSignedIn } = useAuth();
	const { signIn, setActive, isLoaded: signInLoaded } = useSignIn();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (isLoaded && isSignedIn) {
			onAuthenticated();
		}
	}, [isLoaded, isSignedIn, onAuthenticated]);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!signInLoaded || !signIn) {
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const result = await signIn.create({
				identifier: email,
				password,
			});

			if (result.status === "complete" && result.createdSessionId) {
				await setActive({ session: result.createdSessionId });
				onAuthenticated();
			} else {
				setError("Complete the sign-in flow in Clerk.");
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unable to sign in.");
		} finally {
			setLoading(false);
		}
	};

	const handleOauth = async (strategy: "oauth_google" | "oauth_github") => {
		if (!signInLoaded || !signIn) return;

		setLoading(true);
		setError(null);

		try {
			await signIn.authenticateWithRedirect({
				strategy,
				redirectUrl: window.location.href,
				redirectUrlComplete: window.location.href,
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "OAuth sign-in failed.");
			setLoading(false);
		}
	};

	return (
		<main className="auth-shell">
			<section className="auth-card auth-hero">
				<p className="eyebrow">Deals4You</p>
				<h1>Sign in to continue</h1>
				<p className="subtitle">
					You need an account before you can browse deals, get recommendations, or use filters.
				</p>

				<div className="auth-actions">
					<button type="button" className="auth-primary-btn" onClick={onSwitchToSignUp}>
						Create account
					</button>
					<button
						type="button"
						className="auth-secondary-btn"
						onClick={() => void handleOauth("oauth_google")}
						disabled={loading}
					>
						Continue with Google
					</button>
					<button
						type="button"
						className="auth-secondary-btn"
						onClick={() => void handleOauth("oauth_github")}
						disabled={loading}
					>
						Continue with GitHub
					</button>
				</div>

				<form className="auth-form" onSubmit={handleSubmit}>
					<label>
						Email
						<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@example.com" />
					</label>
					<label>
						Password
						<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Your password" />
					</label>
					<button type="submit" className="auth-submit-btn" disabled={loading}>
						{loading ? "Signing in..." : "Sign in"}
					</button>
				</form>

				{error ? <p className="error-box">{error}</p> : null}
			</section>
		</main>
	);
}

export default SignInPage;
