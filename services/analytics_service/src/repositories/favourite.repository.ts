import { FavouriteModel, IFavourite } from "../models/favourite.model.js";

export class FavouriteRepository {
  async addFavourite(
    userId: string,
    dealExternalId: string,
    brandSlug: string
  ): Promise<IFavourite> {
    const favourite = await FavouriteModel.findOneAndUpdate(
      { userId, dealExternalId, brandSlug },
      { userId, dealExternalId, brandSlug },
      { upsert: true, new: true }
    );
    return favourite;
  }

  async removeFavourite(
    userId: string,
    dealExternalId: string,
    brandSlug: string
  ): Promise<boolean> {
    const result = await FavouriteModel.deleteOne({
      userId,
      dealExternalId,
      brandSlug,
    });
    return result.deletedCount > 0;
  }

  async getFavouritesByUserId(userId: string): Promise<IFavourite[]> {
    return await FavouriteModel.find({ userId }).sort({ createdAt: -1 });
  }

  async isFavourite(
    userId: string,
    dealExternalId: string,
    brandSlug: string
  ): Promise<boolean> {
    const favourite = await FavouriteModel.findOne({
      userId,
      dealExternalId,
      brandSlug,
    });
    return !!favourite;
  }

  async removeFavouriteByDealIds(userId: string, dealIds: string[]): Promise<void> {
    await FavouriteModel.deleteMany({
      userId,
      dealExternalId: { $in: dealIds },
    });
  }
}
