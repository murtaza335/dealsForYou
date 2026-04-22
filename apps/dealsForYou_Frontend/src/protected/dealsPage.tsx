import { UserButton, useAuth, useUser } from "@clerk/clerk-react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

interface Deal {
  id: number,
  externalId: string;
  title: string;
  description: string;
  price: number;
  image: string;
  brand: string;
}

interface ApiResponse {
  success: boolean;
  data: Deal[];
  message?: string;
}

type DealsPageProps = {
  onSignOut: () => void;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
const VITE_RECOMMENDATION_URL = import.meta.env.VITE_RECOMMENDATION_URL

const buildQuery = (params: Record<string, string | undefined>) => {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value && value.trim().length > 0) {
      searchParams.set(key, value.trim());
    }
  }

  return searchParams.toString();
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);

function DealsPage({ onSignOut }: DealsPageProps) {
  const { user } = useUser();
  const { isSignedIn } = useAuth();

  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [search, setSearch] = useState("");

  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([]);
  const [recommendedDeals, setRecommendedDeals] = useState<Deal[]>([]);
  const [topDeals, setTopDeals] = useState<Deal[]>([]);

  const [loadingFiltered, setLoadingFiltered] = useState(false);
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  const [loadingTop, setLoadingTop] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const welcomeName = useMemo(() => {
    if (!user) return "User";
    return user.firstName || user.username || user.primaryEmailAddress?.emailAddress || "User";
  }, [user]);

  const fetchFilteredDeals = async () => {
    setLoadingFiltered(true);
    setErrorMessage(null);

    try {
      const query = buildQuery({
        brand,
        category,
        maxPrice,
        search,
      });

      const response = await fetch(`${API_BASE_URL}/api/deals/filtered?${query}`);
      if (!response.ok) {
        throw new Error("Could not fetch filtered deals.");
      }

      const payload: ApiResponse = await response.json();
      setFilteredDeals(payload.data ?? []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unexpected error.");
      setFilteredDeals([]);
    } finally {
      setLoadingFiltered(false);
    }
  };

  const fetchTopDeals = async () => {
    setLoadingTop(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/deals/top?limit=6`);
      if (!response.ok) {
        throw new Error("Could not fetch top deals.");
      }

      const payload: ApiResponse = await response.json();
      setTopDeals(payload.data ?? []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unexpected error.");
      setTopDeals([]);
    } finally {
      setLoadingTop(false);
    }
  };

  const fetchRecommendedDeals = async () => {
    if (!user?.id) {
      setRecommendedDeals([]);
      return;
    }

    setLoadingRecommended(true);
    setErrorMessage(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/deals/recommended?userId=${encodeURIComponent(user.id)}&limit=6`,
      );

      if (!response.ok) {
        throw new Error("Could not fetch recommended deals.");
      }

      const payload: ApiResponse = await response.json();
      setRecommendedDeals(payload.data ?? []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unexpected error.");
      setRecommendedDeals([]);
    } finally {
      setLoadingRecommended(false);
    }
  };

  useEffect(() => {
    if (!isSignedIn) {
      onSignOut();
      return;
    }

    void fetchFilteredDeals();
    void fetchTopDeals();
    // Initial authenticated experience with broad results.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) {
      onSignOut();
      return;
    }

    void fetchRecommendedDeals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, user?.id]);

  const onFilterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void fetchFilteredDeals();
  };

  const handleDealClick = async (dealId: number) => {
    try {
      await fetch(`${VITE_RECOMMENDATION_URL}/api/track/view-detail`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user?.id, dealId, source: "dashboard" })
      });
    } catch (err) {
      console.error("Failed to track click: ", err);
    }
  };

  const DealCard = ({ deal }: { deal: Deal }) => (
    <article className="deal-card" onClick={() => handleDealClick(deal.id)} style={{ cursor: "pointer" }}>
      <img src={deal.image} alt={deal.title} className="deal-image" loading="lazy" />
      <div className="deal-body">
        <p className="deal-brand">{deal.brand}</p>
        <h3>{deal.title}</h3>
        <p className="deal-description">{deal.description}</p>
        <p className="deal-price">{formatPrice(deal.price)}</p>
      </div>
    </article>
  );

  return (
    <div className="page-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Personalized Savings Hub</p>
          <h1>Deals4You</h1>
          <p className="subtitle">Find food deals fast, then let recommendations sharpen what you see next.</p>
        </div>
        <div className="auth-area">
          <p className="welcome-text">Welcome, {welcomeName}</p>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <section className="panel filter-panel">
        <h2>Filter Deals</h2>
        <form onSubmit={onFilterSubmit} className="filter-grid">
          <label>
            Brand
            <input value={brand} onChange={(event) => setBrand(event.target.value)} placeholder="KFC, Dominos..." />
          </label>
          <label>
            Category
            <input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Pizza, Burger..." />
          </label>
          <label>
            Max price
            <input
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              placeholder="500"
              inputMode="numeric"
            />
          </label>
          <label>
            Search
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cheese burst..." />
          </label>
          <button type="submit" className="apply-btn" disabled={loadingFiltered}>
            {loadingFiltered ? "Filtering..." : "Apply filters"}
          </button>
        </form>
      </section>

      {errorMessage ? <p className="error-box">{errorMessage}</p> : null}

      <section className="panel">
        <div className="section-title-row">
          <h2>Recommended Deals</h2>
          {!isSignedIn ? <span className="chip">Sign in required</span> : null}
        </div>
        {loadingRecommended ? <p>Loading recommendations...</p> : null}
        {!loadingRecommended && recommendedDeals.length === 0 ? (
          <p className="empty-copy">No recommendations yet.</p>
        ) : null}
        <div className="deals-grid">{recommendedDeals.map((deal) => <DealCard key={deal.externalId} deal={deal} />)}</div>
      </section>

      <section className="panel">
        <h2>Top Deals</h2>
        {loadingTop ? <p>Loading top deals...</p> : null}
        {!loadingTop && topDeals.length === 0 ? <p className="empty-copy">No top deals available.</p> : null}
        <div className="deals-grid">{topDeals.map((deal) => <DealCard key={deal.externalId} deal={deal} />)}</div>
      </section>

      <section className="panel">
        <h2>Filtered Results</h2>
        {loadingFiltered ? <p>Loading filtered deals...</p> : null}
        {!loadingFiltered && filteredDeals.length === 0 ? <p className="empty-copy">No deals match this filter.</p> : null}
        <div className="deals-grid">{filteredDeals.map((deal) => <DealCard key={deal.externalId} deal={deal} />)}</div>
      </section>
    </div>
  );
}

export default DealsPage;
