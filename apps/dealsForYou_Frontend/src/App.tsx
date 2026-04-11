import { useState } from "react";
import SignUpPage from "./auth/signUp";
import SignInPage from "./auth/signIn";
import DealsPage from "./protected/dealsPage";
import "./App.css";

function App() {
	const [page, setPage] = useState<"signin" | "signup" | "deals">("signin");

	return (
		page === "deals" ? (
			<DealsPage onSignOut={() => setPage("signin")} />
		) : page === "signup" ? (
			<SignUpPage
				onAuthenticated={() => setPage("deals")}
				onSwitchToSignIn={() => setPage("signin")}
			/>
		) : (
			<SignInPage
				onAuthenticated={() => setPage("deals")}
				onSwitchToSignUp={() => setPage("signup")}
			/>
		)
	);
}

export default App;
