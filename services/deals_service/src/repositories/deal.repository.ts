import { DealModel } from "../models/deal.model.js";
import { DealDocument } from "../models/deal.model.js";
import { BrandDocument, BrandModel } from "../models/brands.model.js";

// const brandSchema = new Schema<BrandDocument>(
//   {
//     brandId: {
//       type: String,
//       required: true,
//       unique: true,
//       default: () => new mongoose.Types.ObjectId().toString() // Generate UUID string
//     },
//     name: { type: String, required: true, unique: true },
//     slug: { type: String, required: true, unique: true },
//     baseUrl: { type: String, required: true },
//     isActive: { type: Boolean, default: true },
//     publishedAt: { type: Date, default: Date.now },
//     tagline: { type: String },
//     description: { type: String },
//     logoUrl: { type: String },
//     website: { type: String },
//     city: { type: String },
//     area: { type: String },
//     location: { type: { lat: Number, lng: Number } },
//     country: { type: String },
//     createdAt: { type: Date, default: Date.now },
//     updatedAt: { type: Date, default: Date.now }
//   },
//   { timestamps: true }
// );

export class DealRepository {

  // the function we need are:
  // 1. createOrGetBrand(brandInfo) - this will check if the brand already exists in the database by its slug and if it does it will return the brand document otherwise it will create a new brand document and return it
  // 2. syncDealsForBrand(brandId, deals) - this will take the brand id and the array of deals for that brand and it will sync the deals in the database by doing the following:
  //    a. for each deal in the array it will check if the deal already exists in the database by its externalId and brandId and if it does it will update the existing deal document with the new data otherwise it will create a new deal document
  //    b. after processing all the deals in the array it will also check if there are any deals in the database for that brand that are not in the new array of deals and if there are it will mark those deals as inactive.
  // 3. getActiveDealsForBrand(brandId) - this will return all the active deals for a given brand id
  // 4. getDealById(dealId) - this will return a single deal document by its deal id
  // 5. incrementDealViews(dealId) - this will increment the views count for a given deal id by 1
  // 6. markHotDeals() - this will be a function that will be called by a background job to mark the hot deals based on the views count and the discount percent or any other criteria we want to use to determine if a deal is hot or not.
  
  async createOrGetBrand(brandInfo: { name: string; slug: string; baseUrl: string ; isActive?: boolean; tagline?: string ; description?: string ; logoUrl?: string ; website?: string ; cities?: string[] ; areas?: string[] ; locations?: { lat: number; lng: number }[] ; country?: string }): Promise<BrandDocument> {
    let brand = await BrandModel.findOne({ slug: brandInfo.slug });
    if (!brand) {
      brand = new BrandModel(brandInfo);
      await brand.save();
    }
    return brand;
  }

  async syncDealsForBrand(brandId: string, deals: DealDocument[]) {
    const existingDeals : DealDocument[] = await DealModel.find({ brandId: brandId });
    const existingDealsMap = new Map(existingDeals.map(deal => [`${deal.externalId}-${deal.brandId.toString()}`, deal]));

    const incomingDealsMap = new Map(deals.map(deal => [`${deal.externalId}-${brandId}`, deal]));
    
    // Process incoming deals
    for (const deal of deals) {
      const key = `${deal.externalId}-${brandId}`;
      if (existingDealsMap.has(key)) {
        // Update existing deal
        const existingDeal= existingDealsMap.get(key);
        if (existingDeal) {
          existingDeal.title = deal.title;
          existingDeal.description = deal.description;
          existingDeal.price = deal.price;
          existingDeal.originalPrice = deal.originalPrice;
          existingDeal.currency = deal.currency;
          existingDeal.discountPercent = deal.discountPercent;
          existingDeal.minPersons = deal.minPersons;
          existingDeal.maxPersons = deal.maxPersons;
          existingDeal.cuisineTags = deal.cuisineTags;
          existingDeal.mealType = deal.mealType;
          existingDeal.conditions = deal.conditions;
          existingDeal.startTime = deal.startTime;
          existingDeal.endTime = deal.endTime;
          existingDeal.isExpired = new Date(deal.endTime) < new Date();
          existingDeal.isActive = new Date(deal.endTime) > new Date();
          await existingDeal.save();
        }
      } else {
        // Create new deal
        const newDeal = new DealModel({
          brandId: brandId,
          externalId: deal.externalId,
          title: deal.title,
          description: deal.description,
          price: deal.price,
          originalPrice: deal.originalPrice,
          currency: deal.currency,
          discountPercent: deal.discountPercent,
          minPersons: deal.minPersons,
          maxPersons: deal.maxPersons,
          cuisineTags: deal.cuisineTags,
          mealType: deal.mealType,
          conditions: deal.conditions,
          startTime: deal.startTime,
          endTime: deal.endTime,
          isExpired: new Date(deal.endTime) < new Date(),
          isActive: new Date(deal.endTime) > new Date()
        });
        await newDeal.save();
      }
    }

    // Mark deals that are not in the incoming list as inactive
    for (const existingDeal of existingDeals) {
      const key = `${existingDeal.externalId}-${brandId}`;
      if (!incomingDealsMap.has(key)) {
        existingDeal.isActive = false;
        await existingDeal.save();
      }
    }
  }

  async getActiveDealsForBrand(brandId: string): Promise<DealDocument[]> {
    return await DealModel.find({ brandId: brandId, isActive: true });
  }

  async getDealById(dealId: string): Promise<DealDocument | null> {
    return await DealModel.findOne({ dealId: dealId });
  }
  
  async incrementDealViews(dealId: string): Promise<void> {
    await DealModel.findOneAndUpdate({ dealId: dealId }, { $inc: { viewsCount: 1 } });
  }

  async markHotDeals(): Promise<void> {
    // Example criteria: Mark deals as hot if they have more than 100 views and a discount percent greater than 20%
    await DealModel.updateMany(
      { viewsCount: { $gt: 100 }, discountPercent: { $gt: 20 } },
      { $set: { isHot: true } }
    );
  }
}