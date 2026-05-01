import mongoose from "mongoose";
import { BrandDocument, BrandModel } from "../models/brands.model.js";

export class BrandRepository {
  async upsertBrand(brandInfo: {
    name: string;
    slug: string;
    baseUrl: string;
    logoUrl?: string;
    tagline?: string;
    description?: string;
  }): Promise<BrandDocument> {
    const brand = await BrandModel.findOneAndUpdate(
      { slug: brandInfo.slug },
      {
        $set: {
          name: brandInfo.name,
          slug: brandInfo.slug,
          baseUrl: brandInfo.baseUrl,
          logoUrl: brandInfo.logoUrl,
          tagline: brandInfo.tagline,
          description: brandInfo.description,
          lastUpdated: new Date(),
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    if (!brand) {
      throw new Error("Brand upsert failed");
    }

    return brand;
  }

  async getBrandsByNamesOrSlugs(values: string[]): Promise<BrandDocument[]> {
    if (!values.length) return [];

    const regexValues = values.map(
      (v) => new RegExp(`^${this.escapeRegex(v)}$`, "i")
    );

    return BrandModel.find({
      $or: [
        { slug: { $in: regexValues } },
        { name: { $in: regexValues } },
        { baseUrl: { $in: regexValues } },
        {imgUrl: { $in: regexValues } },
      ],
    });
  }

  async getActiveBrands(): Promise<Array<{ name: string; slug: string }>> {
    const brands = await BrandModel.find({ isActive: true })
      .select({ _id: 0, name: 1, slug: 1, imgUrl: 1, baseUrl: 1 })
      .sort({ name: 1 })
      .lean();

    return brands.map((b) => ({
      name: b.name,
      slug: b.slug,
      imgUrl: b.imgUrl,
      baseUrl: b.baseUrl,
    }));
  }

  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}

export const brandRepository = new BrandRepository();