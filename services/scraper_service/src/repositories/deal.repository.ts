import { DealModel } from "../models/deal.model.js";
import { Deal } from "../interfaces/deal.interface.js";
import { BrandDocument, BrandModel } from "../models/brand.model.js";

export class DealRepository {

  //  Create brand if not exists
  async createOrGetBrand(data: {
    name: string;
    slug: string;
    baseUrl: string;
  }): Promise<BrandDocument> {

    let brand = await BrandModel.findOne({ slug: data.slug });

    if (!brand) {
      brand = await BrandModel.create({
        name: data.name,
        slug: data.slug,
        baseUrl: data.baseUrl,
        isActive: true,
        publishedAt: new Date()
      });
    }

    return brand;
  }

  //  Get brand by id(slug) using the brand name
  async getBrandBySlug(slug: string): Promise<BrandDocument | null> {
    return BrandModel.findOne({ slug });
  }

  //  MAIN SYNC LOGIC 
  async syncDealsForBrand(brandId: string, newDeals: Deal[]) {

    // 1. Get existing deals from DB using brandid
    const existingDeals = await DealModel.find({ brandId });

    const existingMap = new Map(
      existingDeals.map(deal => [deal.externalId, deal])
    );

    const newDealsMap = new Map(
      newDeals.map(deal => [deal.externalId, deal])
    );

    let inserted = 0;
    let updated = 0;

    // 2. INSERT / UPDATE
    for (const deal of newDeals) {
      const existing = existingMap.get(deal.externalId);

      if (!existing) {
        //  INSERT
        await DealModel.create({
          ...deal,
          brandId
        });
        inserted++;
      } else {
        //  UPDATE (only if changed)
        await DealModel.updateOne(
          { _id: existing._id },
          {
            $set: {
              name: deal.title,
              description: deal.description,
              price: deal.price,
              salePrice: deal.salePrice,
              image: deal.image,
              category: deal.category,
              isActive: true
            }
          }
        );
        updated++;
      }
    }

    // 3. DELETE (not in new scraper output) outdated deals will be deleted from the database
    const newExternalIds = newDeals.map(d => d.externalId);

    const deleteResult = await DealModel.deleteMany({
      brandId,
      externalId: { $nin: newExternalIds }
    });

    console.log(`Inserted: ${inserted}, Updated: ${updated}, Deleted: ${deleteResult.deletedCount}`);
  }
}