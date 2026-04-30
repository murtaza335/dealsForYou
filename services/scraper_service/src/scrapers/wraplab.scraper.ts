import axios from "axios";
import { BaseScraper } from "./base.scraper.js";
import { Deal } from "../interfaces/deal.interface.js";
import { mapWrapLabDeals } from "../adapters/deal.adapter.js";
import { ScraperSourceDocument } from "../models/scraperSources.js";

//wrap lab uses indolj company a company that provide food websites and they a have stadard response for the deals api response which is also followed in other brands such as kababjees

// their menu api response include details object in which each group is stored with their deal id first(outside the object) and then their details is stored in object in which there is items object which include the deal or other item detail . we first check weather that categoy is active or not by checking the deal_from and deal_to field then we check weather that category is deal related or not by checking the title of the category if it is active and deal related then we loop through its items and push them in rawdeals array and then we map that rawdeals to our internal format using mapWrapLabDeals function

/**
 *Check if category is active based on deal_from / deal_to
 */
function isCategoryActive(categoryDetail: any): boolean {
  try {
    if (!categoryDetail?.deal_from || !categoryDetail?.deal_to) return true;

    const now = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" })
    );

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDay = days[now.getDay()];
    const currentTime = now.toTimeString().slice(0, 5);

    const from = categoryDetail.deal_from?.[currentDay];
    const to = categoryDetail.deal_to?.[currentDay];

    if (!from || !to) return false;

    // normal time range
    if (from <= to) {
      return currentTime >= from && currentTime <= to;
    }

    // overnight range
    return currentTime >= from || currentTime <= to;

  } catch {
    return false;
  }
}

/**
 * FIXED CATEGORY FILTER (IMPORTANT)
 * includes ALL deal-related categories
 */
function isValidCategory(title: string): boolean {
  const lower = title?.toLowerCase() || "";

  return (
    lower.includes("deal") ||
    lower.includes("deals") ||
    lower.includes("feast") ||
    lower.includes("platter")
  );
}

export class WrapLabScraper extends BaseScraper {
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
      const seenNames = new Set<string>();

for (const category of Object.values(details) as any[]) {
  const categoryTitle = category?.title || "";
  const categoryDetail = category?.categoryDetail;

  if (!isCategoryActive(categoryDetail)) continue;
  if (!isValidCategory(categoryTitle)) continue;

  const items = Object.values(category?.items || {});

  for (const item of items as any[]) {
    const itemName = item?.item_name;

    if (seenNames.has(itemName)) continue;

    seenNames.add(itemName);

    const priceObj = item?.prices?.[0];

    rawDeals.push({
      id: item?.item_id,
      name: itemName,
      description: item?.item_description || "",
      price: priceObj?.price || 0,
      salePrice: priceObj?.discounted_price || 0,
      imgUrl: item?.photo || item?.item_photo_webp || "",
      category: categoryTitle || "WrapLab Deals"
    });
  }
}

      //  MAP TO INTERNAL FORMAT
      return mapWrapLabDeals(rawDeals, "wraplab");

    } catch (error: any) {
      console.error(
        "WrapLab Scraper Error:",
        error.response?.status,
        error.response?.data || error.message
      );
      return [];
    }
  }
}