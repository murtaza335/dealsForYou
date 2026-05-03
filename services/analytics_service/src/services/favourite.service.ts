import { FavouriteRepository } from "../repositories/favourite.repository.js";

export class FavouriteService {
  private favouriteRepository = new FavouriteRepository();

  async addFavourite(userId: string, dealExternalId: string, brandSlug: string) {
    if (!userId || !dealExternalId || !brandSlug) {
      throw new Error("userId, dealExternalId, and brandSlug are required");
    }

    const favourite = await this.favouriteRepository.addFavourite(
      userId,
      dealExternalId,
      brandSlug
    );

    return {
      success: true,
      data: favourite,
      message: "Deal added to favourites",
    };
  }

  async removeFavourite(userId: string, dealExternalId: string, brandSlug: string) {
    if (!userId || !dealExternalId || !brandSlug) {
      throw new Error("userId, dealExternalId, and brandSlug are required");
    }

    const removed = await this.favouriteRepository.removeFavourite(
      userId,
      dealExternalId,
      brandSlug
    );

    if (!removed) {
      throw new Error("Favourite not found");
    }

    return {
      success: true,
      message: "Deal removed from favourites",
    };
  }

  async getFavouritesByUserId(userId: string) {
    if (!userId) {
      throw new Error("userId is required");
    }

    const favourites = await this.favouriteRepository.getFavouritesByUserId(userId);

    return {
      success: true,
      data: favourites,
      message: "Favourites fetched successfully",
    };
  }

  async getFavouriteDealsWithDetails(userId: string, dealsServiceUrl: string = "http://localhost:5002") {
    if (!userId) {
      throw new Error("userId is required");
    }

    // Get all favourite records
    const favourites = await this.favouriteRepository.getFavouritesByUserId(userId);

    if (favourites.length === 0) {
      return {
        success: true,
        data: [],
        message: "No favourite deals found",
      };
    }

    // Prepare deals array for bulk fetch
    const dealsToFetch = favourites.map((fav) => ({
      dealId: fav.dealExternalId,
      brandSlug: fav.brandSlug,
    }));

    try {
      // Call deals service bulk endpoint
      const response = await fetch(
        `${dealsServiceUrl}/api/deals/bulk?deals=${encodeURIComponent(JSON.stringify(dealsToFetch))}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error("[Favourite Service] Deals service error:", response.status);
        throw new Error(`Failed to fetch deals from deals service (${response.status})`);
      }

      const dealsResponse = (await response.json()) as { data?: unknown[] };
      const deals = dealsResponse.data ?? [];

      return {
        success: true,
        data: deals,
        message: "Favourite deals fetched with details",
      };
    } catch (error) {
      console.error("[Favourite Service] Error fetching deals details:", error);
      // Return favourites without deal details if service fails
      return {
        success: true,
        data: favourites,
        message: "Favourite deals fetched (without details due to service error)",
      };
    }
  }

  async isFavourite(userId: string, dealExternalId: string, brandSlug: string) {
    if (!userId || !dealExternalId || !brandSlug) {
      throw new Error("userId, dealExternalId, and brandSlug are required");
    }

    const isFav = await this.favouriteRepository.isFavourite(
      userId,
      dealExternalId,
      brandSlug
    );

    return {
      success: true,
      data: { isFavourite: isFav },
    };
  }
}

export const favouriteService = new FavouriteService();
