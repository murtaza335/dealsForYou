import { DealModel } from "../models/deal.model.js";
import mongoose from "mongoose";
import { LogModel } from "../models/logs.js";
import { LogDocument } from "../models/logs.js";
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

  private isRetryableSyncError(error: unknown): boolean {
    if (typeof error !== "object" || error === null) {
      return false;
    }

    const mongoError = error as { code?: number; hasErrorLabel?: (label: string) => boolean };
    const isDuplicateKey = mongoError.code === 11000;
    const isTransientTransaction = Boolean(mongoError.hasErrorLabel?.("TransientTransactionError"));
    const isUnknownCommitResult = Boolean(mongoError.hasErrorLabel?.("UnknownTransactionCommitResult"));

    return isDuplicateKey || isTransientTransaction || isUnknownCommitResult;
  }

  private isTransactionUnsupportedError(error: unknown): boolean {
    if (typeof error !== "object" || error === null) {
      return false;
    }

    const mongoError = error as { message?: string };
    return (mongoError.message ?? "").includes("Transaction numbers are only allowed");
  }

  // the function we need are:
  // 1. updateOrInsertBrand(brandInfo{}) - this will check if the brand already exists in the database by its slug and if it does it will return the brand document otherwise it will create a new brand document and return it
  // 2. syncDealsForBrand(brandId, deals) - this will take the brand id and the array of deals for that brand and it will sync the deals in the database by doing the following:
  //    a. for each deal in the array it will check if the deal already exists in the database by its externalId and brandId and if it does it will update the existing deal document with the new data otherwise it will create a new deal document
  //    b. after processing all the deals in the array it will also check if there are any deals in the database for that brand that are not in the new array of deals and if there are it will mark those deals as inactive.
  // 3. getActiveDealsForBrand(brandId) - this will return all the active deals for a given brand id
  // 4. getDealById(dealId) - this will return a single deal document by its deal id
  // 5. incrementDealViews(dealId) - this will increment the views count for a given deal id by 1
  // 6. markHotDeals() - this will be a function that will be called by a background job to mark the hot deals based on the views count and the discount percent or any other criteria we want to use to determine if a deal is hot or not.

  async updateOrInsertBrand(brandInfo: { name: string; slug: string; baseUrl: string; isActive?: boolean; tagline?: string; description?: string; logoUrl?: string; website?: string; cities?: string[]; areas?: string[]; locations?: { lat: number; lng: number }[]; country?: string }): Promise<BrandDocument> {

    // to avoid race conditions where multiple messages for the same brand come in at the same time we will be using findOneAndUpdate with upsert option to atomically find or create the brand document
    const brand = await BrandModel.findOneAndUpdate(
      { slug: brandInfo.slug },
      { $setOnInsert: { ...brandInfo, publishedAt: new Date() } },
      { new: true, upsert: true }
    );

    return brand;
  }

  async syncDealsForBrand(brandId: string, deals: DealDocument[]) {

    // argument validation
    if (!mongoose.Types.ObjectId.isValid(brandId)) {
      throw new Error(`Invalid brandId: ${brandId}`);
    }

    const brandObjectId = new mongoose.Types.ObjectId(brandId);
    const now = new Date();

    // deduplicated deals
    const dedupedDeals = new Map<string, DealDocument>();

    // payload verification
    for (const deal of deals) {
      if (!deal.externalId || typeof deal.externalId !== "string") {
        throw new Error(`Invalid deal payload: externalId is required for brand ${brandId}`);
      }

      const endTime = new Date(deal.endTime);
      if (Number.isNaN(endTime.getTime())) {
        throw new Error(`Invalid deal payload: endTime is invalid for externalId ${deal.externalId}`);
      }

      //to delete the duplicates if any
      dedupedDeals.set(deal.externalId, deal);
    }

    const incomingExternalIds = [...dedupedDeals.keys()];

    // mappig each exteranlId to the updateOne operation. 
    const upsertOperations = incomingExternalIds.map((externalId) => {
      const deal = dedupedDeals.get(externalId)!;

      // isExpired and isActive logic 
      // if the deal's endTime not mentioned its not expired.
      // if the deal's endTime is in the past then its expired.
      // if the deal's startTime is in the future then its not active.
      let isExpired = false;
      let isActive = true;

      if (deal.endTime) {
        const endTime = new Date(deal.endTime);
        isExpired = endTime <= now;
      }

      if (deal.startTime) {
        const startTime = new Date(deal.startTime);
        if (startTime > now) {
          isActive = false;
        }
      }

      if (isExpired) {
        isActive = false;
      }


      return {
        updateOne: {
          filter: { brandId: brandObjectId, externalId: externalId },
          update: {
            $set: {
              brandId: brandObjectId,
              externalId: externalId,
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
              isExpired: isExpired,
              isActive: isActive,
              scrapedAt: now
            }
          },
          upsert: true
        }
      };
    });

    const deactivateFilter = incomingExternalIds.length > 0
      ? { brandId: brandObjectId, externalId: { $nin: incomingExternalIds } }
      : { brandId: brandObjectId };


      // here the session logic is implemented to ensure that the upsert operations and the deactivate operations are atomic and to avoid race conditions
    const runSync = async (useTransaction: boolean) => {
      if (!useTransaction) {
        if (upsertOperations.length > 0) {
          await DealModel.bulkWrite(upsertOperations, { ordered: false });
        }

        // deactivating the deals that are not present in the incoming payload.
        await DealModel.updateMany(
          deactivateFilter,
          { $set: { isActive: false } }
        );
        return;
      }

      // use Transaction
      const session = await DealModel.db.startSession();
      try {
        await session.withTransaction(async () => {
          if (upsertOperations.length > 0) {
            await DealModel.bulkWrite(upsertOperations, { ordered: false, session: session });
          }

          // deactivating the deals that are not present in the incoming payload.
          await DealModel.updateMany(
            deactivateFilter,
            { $set: { isActive: false } },
            { session: session }
          );
        });
      } finally {
        await session.endSession();
      }
    };

    const maxRetries = 2;
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      try {
        await runSync(true);
        return;
      } catch (error) {
        if (this.isTransactionUnsupportedError(error)) {
          await runSync(false);
          return;
        }

        const shouldRetry = this.isRetryableSyncError(error) && attempt < maxRetries;
        if (shouldRetry) {
          continue;
        }

        throw error;
      }
    }
  }

  async getActiveDealsForBrand(brandId: string): Promise<DealDocument[]> {
    return await DealModel.find({ brandId: brandId, isActive: true });
  }

  async getDealById(dealId: string): Promise<DealDocument | null> {
    return await DealModel.findOne({ dealId: dealId });
  }

  // async incrementDealViews(dealId: string): Promise<void> {
  //   await DealModel.findOneAndUpdate({ dealId: dealId }, { $inc: { viewsCount: 1 } });
  // }

  // async markHotDeals(): Promise<void> {
  //   // Example criteria: Mark deals as hot if they have more than 100 views and a discount percent greater than 20%
  //   await DealModel.updateMany(
  //     { viewsCount: { $gt: 100 }, discountPercent: { $gt: 20 } },
  //     { $set: { isHot: true } }
  //   );
  // }
}