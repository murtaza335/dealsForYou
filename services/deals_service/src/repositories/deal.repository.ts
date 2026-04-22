import { DealModel } from "../models/deal.model.js";
import mongoose from "mongoose";
import { LogModel } from "../models/logs.js";
import { LogDocument } from "../models/logs.js";
import { DealDocument } from "../models/deal.model.js";
import { BrandDocument, BrandModel } from "../models/brands.model.js";
import { v4 as uuidv4 } from "uuid";

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

  async updateOrInsertBrand(
    brandInfo: { name: string; slug: string; baseUrl: string }
  ): Promise<BrandDocument> {

    const brand = await BrandModel.findOneAndUpdate(
      { slug: brandInfo.slug },
      {
        $set: {
          ...brandInfo
        },
        $setOnInsert: {
          publishedAt: new Date()
        }
      },
      {
        returnDocument: "after",
        upsert: true,
        runValidators: true
      }
    );

    if (!brand) {
      throw new Error("Brand upsert failed");
    }
    console.log("Upserted brand:", brand.slug, brand._id);

    return brand;
  }

async syncDealsForBrand(brandId: string, deals: DealDocument[]) {
  console.log(
    `[DealSync] Started | brandId=${brandId} | incomingDeals=${deals?.length ?? 0}`
  );

  if (!mongoose.Types.ObjectId.isValid(brandId)) {
    throw new Error(`Invalid brandId: ${brandId}`);
  }

  const brandObjectId = new mongoose.Types.ObjectId(brandId);
  const now = new Date();

  console.log(
    `[DealSync] Target | db=${DealModel.db.name} | collection=${DealModel.collection.name}`
  );

  const validDeals = new Map<string, DealDocument>();
  let skippedCount = 0;

  for (const [index, raw] of deals.entries()) {
    if (!raw) {
      console.log(`[DealSync] Skip null payload | idx=${index + 1}`);
      skippedCount += 1;
      continue;
    }

    const externalId = String((raw as any).externalId ?? "").trim();

    if (!externalId) {
      console.log(`[DealSync] Skip: missing externalId | idx=${index + 1}`);
      skippedCount += 1;
      continue;
    }

    if (!raw.title || raw.price == null) {
      console.log(`[DealSync] Skip invalid deal | externalId=${externalId}`);
      skippedCount += 1;
      continue;
    }

    const endTime = raw.endTime ? new Date(raw.endTime) : null;
    if (endTime && isNaN(endTime.getTime())) {
      console.log(`[DealSync] Skip invalid endTime | externalId=${externalId}`);
      skippedCount += 1;
      continue;
    }

    validDeals.set(externalId, raw);
  }

  const incomingExternalIds = [...validDeals.keys()];
  console.log(
    `[DealSync] Prepared | valid=${incomingExternalIds.length} | skipped=${skippedCount}`
  );

  const bulkOps = incomingExternalIds.map((externalId) => {
    const raw = validDeals.get(externalId)!;
    const endTime = raw.endTime ? new Date(raw.endTime) : null;
    const startTime = raw.startTime ? new Date(raw.startTime) : null;

    let isExpired = endTime ? endTime <= now : false;
    let isActive = startTime ? startTime <= now : true;
    if (isExpired) isActive = false;

    return {
      updateOne: {
        filter: { brandId: brandObjectId, externalId },
        update: {
          $setOnInsert: {
            dealId: uuidv4(),
          },
          $set: {
            brandId: brandObjectId,
            externalId,
            title: raw.title,
            description: raw.description ?? "",
            price: raw.price,
            originalPrice: raw.originalPrice ?? undefined,
            currency: raw.currency ?? "PKR",
            discountPercent: raw.discountPercent ?? undefined,
            minPersons: raw.minPersons ?? undefined,
            maxPersons: raw.maxPersons ?? undefined,
            cuisineTags: Array.isArray(raw.cuisineTags) ? raw.cuisineTags : [],
            mealType: Array.isArray(raw.mealType) ? raw.mealType : [],
            conditions: raw.conditions ?? undefined,
            startTime: startTime ?? undefined,
            endTime: endTime ?? undefined,
            isExpired,
            isActive,
            scrapedAt: now,
          },
        },
        upsert: true,
      },
    };
  });

  if (bulkOps.length > 0) {
    try {
      const bulkResult = await DealModel.bulkWrite(bulkOps, { ordered: false });
      console.log(
        `[DealSync] Bulk result | matched=${bulkResult.matchedCount} | modified=${bulkResult.modifiedCount} | upserted=${bulkResult.upsertedCount}`
      );
    } catch (error) {
      const mongoError = error as {
        message?: string;
        code?: number;
        writeErrors?: Array<{ code?: number; errmsg?: string }>;
      };

      console.error(
        `[DealSync] Bulk upsert failed | code=${mongoError.code ?? "n/a"} | message=${mongoError.message ?? "unknown"}`
      );

      const writeErrors = mongoError.writeErrors ?? [];
      const onlyDuplicateErrors =
        writeErrors.length > 0 && writeErrors.every((entry) => entry.code === 11000);

      if (!onlyDuplicateErrors) {
        throw error;
      }

      console.warn(
        `[DealSync] Bulk had duplicate-key races | retrying as update-only ops=${writeErrors.length}`
      );

      await DealModel.bulkWrite(
        bulkOps.map((op) => ({
          updateOne: {
            filter: op.updateOne.filter,
            update: op.updateOne.update,
            upsert: false,
          },
        })),
        { ordered: false }
      );
    }
  }

  console.log(
    `[DealSync] Deactivate missing | validIncomingExternalIds=${incomingExternalIds.length}`
  );

  const deactivateResult = await DealModel.updateMany(
    {
      brandId: brandObjectId,
      externalId: { $nin: incomingExternalIds },
    },
    {
      $set: { isActive: false },
    }
  );

  const persistedCount = await DealModel.countDocuments({ brandId: brandObjectId });

  console.log(
    `[DealSync] Deactivate result | matched=${deactivateResult.matchedCount} | modified=${deactivateResult.modifiedCount}`
  );
  console.log(
    `[DealSync] Summary | attempted=${deals.length} | valid=${incomingExternalIds.length} | skipped=${skippedCount} | persistedCount=${persistedCount}`
  );

  console.log(`[DealSync] DONE | brandId=${brandId}`);
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