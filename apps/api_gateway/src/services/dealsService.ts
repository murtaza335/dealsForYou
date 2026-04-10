export interface FilteredDealsQuery {
  brand?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

export interface RecommendedDealsQuery {
  userId?: string;
  limit?: number;
}

class DealsService {
  async getFilteredDeals(_query: FilteredDealsQuery) {
   //to be done
    return [];
  }

  async getRecommendedDeals(_query: RecommendedDealsQuery) {
    
    return [];
  }

  async getTopDeals(_limit?: number) {
    
    return [];
  }
}

export const dealsService = new DealsService();
