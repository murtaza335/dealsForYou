import axios from "axios";
import { BaseScraper } from "./base.scraper.js";
import { Deal } from "../interfaces/deal.interface.js";
import { mapKababjeesDeals } from "../adapters/deal.adapter.js";
import { ScraperSourceDocument } from "../models/scraperSources.js";

/**
 * Check if category is active
 */
function isCategoryActive(categoryDetail: any): boolean {
  try {
    if (!categoryDetail?.deal_from || !categoryDetail?.deal_to) return true;

    const now = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" })
    );

    const days = [
      "Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"
    ];

    const currentDay = days[now.getDay()];
    const currentTime = now.toTimeString().slice(0, 5);

    const from = categoryDetail.deal_from?.[currentDay];
    const to = categoryDetail.deal_to?.[currentDay];

    if (!from || !to) return false;

    if (from <= to) {
      return currentTime >= from && currentTime <= to;
    }

    return currentTime >= from || currentTime <= to;

  } catch {
    return false;
  }
}

/**
 * Category filter
 */
function isValidCategory(title: string): boolean {
  const lower = title?.toLowerCase() || "";

  return (
    lower.includes("deal") ||
    lower.includes("deals") ||
    lower.includes("meal") ||
    lower.includes("meals") ||
    lower.includes("platter") ||
    lower.includes("feast")
  );
}

/**
 * Item-level fallback filter
 */
function isValidDealItem(name: string): boolean {
  const lower = name?.toLowerCase() || "";

  return (
    lower.includes("deal") ||
    lower.includes("combo") ||
    lower.includes("meal") ||
    lower.includes("box")
  ) && !lower.includes("addon");
}

/**
 * Normalize a deal title for dedup comparison.
 * Strips trailing/leading dots & whitespace, collapses internal spaces.
 * "Arabic Nuggets Deal " and "Arabic Nuggets Deal." both become
 * "arabic nuggets deal" so only the first occurrence is kept.
 */
function normalizeTitle(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\s.]+$/, "")  // strip trailing spaces/dots
    .replace(/^[\s.]+/, "")  // strip leading spaces/dots
    .replace(/\s+/g, " ")    // collapse internal whitespace
    .trim();
}

export class KababjeesScraper extends BaseScraper {
  async fetchDeals(source: ScraperSourceDocument): Promise<Deal[]> {
    try {
      const requestBody =
        source.body && typeof source.body === "object" && !Array.isArray(source.body)
          ? source.body
          : {};

      const requestHeaders =
        source.headers && typeof source.headers === "object" && !Array.isArray(source.headers)
          ? source.headers
          : {};

      const response = await axios.post(
        source.scrapApiURl,
        requestBody,
        { headers: requestHeaders }
      );

      const details = response.data?.details || {};

      const rawDeals: any[] = [];
      const seenNormalizedTitles = new Set<string>();

      for (const category of Object.values(details) as any[]) {
        const categoryTitle = category?.title || "";
        const categoryDetail = category?.categoryDetail;

        if (!isCategoryActive(categoryDetail)) continue;

        const categoryMatches = isValidCategory(categoryTitle);

        const items = Object.values(category?.items || {});

        for (const item of items as any[]) {
          const itemName = item?.item_name || "";

          const itemMatches = isValidDealItem(itemName);

          // include if either matches
          if (!categoryMatches && !itemMatches) continue;

          // Deduplicate by normalized title so "Deal " and "Deal." are treated as the same
          const normalized = normalizeTitle(itemName);
          if (seenNormalizedTitles.has(normalized)) continue;
          seenNormalizedTitles.add(normalized);

          const priceObj = item?.prices?.[0];

          rawDeals.push({
            id: item?.item_id,
            name: itemName,
            description: item?.item_description || "",
            price: priceObj?.inclusive_tax_price || 0,
            salePrice: priceObj?.discounted_price || 0,
            imgUrl: item?.photo || item?.item_photo_webp || "",
            category: categoryTitle || "Kababjees Deals"
          });
        }
      }

      //  Using KABABJEES ADAPTER
      return mapKababjeesDeals(rawDeals, "kababjees");

    } catch (error: any) {
      console.error(
        "Kababjees Scraper Error:",
        error.response?.status,
        error.response?.data || error.message
      );
      return [];
    }
  }
}