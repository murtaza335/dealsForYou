export interface FilteredDealsQuery {
  brand?: string;
  minPrice?: string;
  maxPrice?: string;
  query?: string;
}

export interface RecommendedDealsQuery {
  userId?: string;
  limit?: number;
}

class DealsService {
  async getFilteredDeals(query: FilteredDealsQuery) {
    const dealsServiceBaseUrl =
      process.env.deals_url ?? process.env.DEALS_URL ?? "http://localhost:5002";

    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(query)) {
      if (typeof value === "string" && value.trim().length > 0) {
        searchParams.set(key, value.trim());
      }
    }

    const url = `${dealsServiceBaseUrl.replace(/\/$/, "")}/api/deals${
      searchParams.toString() ? `?${searchParams.toString()}` : ""
    }`;

    console.log("[Gateway] Forwarding filtered deals request to:", url);

    const response = await fetch(url);

    console.log("[Gateway] Deals service response status:", response.status);

    if (!response.ok) {
      throw new Error(`Failed to fetch filtered deals from deals service (${response.status}).`);
    }

    const payload = (await response.json()) as { data?: unknown[] };
    return payload.data ?? [];
  }

  async getRecommendedDeals(_query: RecommendedDealsQuery) {
    
    return [];
  }

  async getTopDeals(_limit?: number) {
    
    return [];
  }
}

export const dealsService = new DealsService();
