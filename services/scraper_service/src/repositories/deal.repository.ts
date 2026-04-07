import { DealModel } from "../models/deal.model.js";
import { Deal } from "../interfaces/deal.interface.js";
import { BrandDocument, BrandModel } from "../models/brand.model.js";

export class DealRepository {
  private async ensureBrand(): Promise<BrandDocument> {
    const slug = "dominos";
    const existing = await BrandModel.findOne({ slug });
    if (existing) {
      return existing;
    }

    try {
      return await BrandModel.create({
        name: "Dominos",
        slug,
        imageBaseUrl: "https://www.dominos.com.pk/images/",
        isActive: true,
        publishedAt: new Date()
      });
    } catch {
      // Handles duplicate create race; fetch the existing brand again.
      const brand = await BrandModel.findOne({ slug });
      if (!brand) {
        throw new Error("Failed to ensure brand record for dominos");
      }
      return brand;
    }
  }

  async syncDeals(newDeals: Deal[]) {
    const brand = await this.ensureBrand();

    let upsertedCount = 0;
    for (const deal of newDeals) {
      const result = await DealModel.updateOne(
        { brandId: brand._id, id: deal.id },
        {
          $set: {
            name: deal.name,
            description: deal.description,
            price: deal.price,
            salePrice: deal.salePrice ?? 0,
            image: deal.image,
            category: deal.category,
            isActive: deal.isActive ?? true,
            publishedAt: deal.publishedAt ?? new Date(),
            brandId: brand._id
          }
        },
        { upsert: true }
      );

      if (result.upsertedCount > 0 || result.modifiedCount > 0) {
        upsertedCount += 1;
      }
    }

    console.log(`Upserted/updated ${upsertedCount} deals for ${brand.slug}`);
  }
}