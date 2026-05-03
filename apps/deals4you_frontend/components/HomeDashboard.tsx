"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import { DealModal } from "@/components/deal-modal";
import {
  apiBaseUrl,
  withBearerToken,
  type ApiResponse,
  type Deal,
} from "@/lib/deals";
import { HomeSlider } from "@/components/home_slider";
import { RecommendDealsSlider } from "@/components/recommend-deals-slider";
import { HotDealsSlider } from "@/components/hot-deals-slider";

export function HomeDashboard() {
  const { user } = useUser();
  const { isSignedIn, getToken } = useAuth();
  const userId = user?.id;

  const [recommendedDeals, setRecommendedDeals] = useState<Deal[]>([]);
  const [topDeals, setTopDeals] = useState<Deal[]>([]);

  const [loadingRecommended, setLoadingRecommended] = useState(false);
  const [loadingTop, setLoadingTop] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);


  const fetchRecommendedDeals = useCallback(async () => {
    if (!userId) {
      setRecommendedDeals([]);
      return;
    }

    setLoadingRecommended(true);
    setErrorMessage(null);

    try {
      const token = await getToken();
      const response = await fetch(
        `${apiBaseUrl}/api/deals/recommended?userId=${encodeURIComponent(userId)}&limit=6`,
        {
          headers: withBearerToken(token),
        }
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
  }, [userId, getToken]);

  const fetchTopDeals = useCallback(async () => {
    setLoadingTop(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/analytics/trending/deals`);
      if (!response.ok) {
        throw new Error("Could not fetch top deals.");
      }

      const payload: ApiResponse = await response.json();
      console.log("Top deals:", payload.data);
      setTopDeals(payload.data ?? []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unexpected error.");
      setTopDeals([]);
    } finally {
      setLoadingTop(false);
    }
  }, []);

  useEffect(() => {

    const timer = setTimeout(() => {
      void fetchRecommendedDeals();
      void fetchTopDeals();
    }, 0);

    return () => clearTimeout(timer);
  }, [ fetchRecommendedDeals, fetchTopDeals]);

  const images = ['https://res.cloudinary.com/durv0rf9u/image/upload/v1777748574/banner1_ptoawz.png','https://res.cloudinary.com/durv0rf9u/image/upload/v1777748573/banner2_grh4tn.png','https://res.cloudinary.com/durv0rf9u/image/upload/v1777749246/banner3_wjdqp2.png']



  return (
    <>
    <div>
    <HomeSlider images={images} />
    </div>
    <div className="relative z-10 w-full px-4 pb-6 pt-25 sm:px-6 lg:px-8">
      <div className="w-full max-w-none">

        

        <HotDealsSlider
          loading={loadingTop}
          deals={topDeals}
          onDealOpen={setSelectedDeal}
        />

        <RecommendDealsSlider
          isSignedIn={isSignedIn ?? false}
          loading={loadingRecommended}
          deals={recommendedDeals}
          onDealOpen={setSelectedDeal}
        />
        </div>
        <DealModal deal={selectedDeal} onClose={() => setSelectedDeal(null)} />
    </div>
    </>
  );
}