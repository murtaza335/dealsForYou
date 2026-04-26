export interface RecommendedDealsQuery {
  userId?: string;
  limit?: number;
}

class DealsService {
  private getDealsServiceBaseUrl() {
    return process.env.deals_url ?? process.env.DEALS_URL ?? "http://localhost:5002";
  }

  private buildQueryString(query: Record<string, unknown>) {
    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(query)) {
      if (typeof value === "string" && value.trim().length > 0) {
        searchParams.append(key, value.trim());
        continue;
      }

      if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === "string" && item.trim().length > 0) {
            searchParams.append(key, item.trim());
          }
        }
      }
    }

    return searchParams.toString();
  }

  private async fetchFromDealsService(pathname: string, query?: Record<string, unknown>) {
    const dealsServiceBaseUrl =
      this.getDealsServiceBaseUrl();

    const queryString = query ? this.buildQueryString(query) : "";
    const url = `${dealsServiceBaseUrl.replace(/\/$/, "")}${pathname}${
      queryString ? `?${queryString}` : ""
    }`;

    console.log("[Gateway] Forwarding deals request to:", url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch from deals service (${response.status}).`);
    }

    return response.json() as Promise<{ data?: unknown[] | unknown }>;
  }

  async getFilteredDeals(query: Record<string, unknown>) {
    const payload = await this.fetchFromDealsService("/api/deals", query);
    return payload.data ?? [];
  }

  async getDealFilterOptions() {
    const payload = await this.fetchFromDealsService("/api/deals/filters/options");
    return payload.data ?? {};
  }

  async getDealFilterBrands() {
    const payload = await this.fetchFromDealsService("/api/deals/filters/brands");
    return payload.data ?? [];
  }

  async getDealFilterCuisineTags() {
    const payload = await this.fetchFromDealsService("/api/deals/filters/cuisine-tags");
    return payload.data ?? [];
  }

  async getDealFilterMealTypes() {
    const payload = await this.fetchFromDealsService("/api/deals/filters/meal-types");
    return payload.data ?? [];
  }

  async getDealFilterPriceRange() {
    const payload = await this.fetchFromDealsService("/api/deals/filters/price-range");
    return payload.data ?? { min: 0, max: 0 };
  }

  async getDealById(dealId: string) {
    const payload = await this.fetchFromDealsService(`/api/deals/${dealId}`);
    return payload.data ?? null;
  }

  async getRecommendedDeals(_query: RecommendedDealsQuery) {
    
    return [];
  }

  async getTopDeals(_limit?: number) {
    
    return [];
  }
}

export const dealsService = new DealsService();
