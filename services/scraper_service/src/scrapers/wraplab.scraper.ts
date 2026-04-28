import axios from "axios";
import { BaseScraper } from "./base.scraper.js";
import { Deal } from "../interfaces/deal.interface.js";
import { mapWrapLabDeals } from "../adapters/deal.adapter.js";
import { ScraperSourceDocument } from "../models/scraperSources.js";


 //Check if category is active based on deal_from / deal_to

function isCategoryActive(categoryDetail: any): boolean {
  try {
    if (!categoryDetail?.deal_from || !categoryDetail?.deal_to) return true;

    const now = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" })
    );

    const currentDay = now.toLocaleString("en-US", { weekday: "long" });
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

// Category filter: must include "feast"

function isFeastCategory(title: string): boolean {
  return title?.toLowerCase().includes("feast");
}

// Item filter: must include "deal"
function isDealItem(itemName: string): boolean {
  return itemName?.toLowerCase().includes("deal");
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

  // categories loop
      for (const category of Object.values(details) as any[]) {
        const categoryTitle = category?.title || "";
        const categoryDetail = category?.categoryDetail;

        // ⏱ skip inactive categories
        if (!isCategoryActive(categoryDetail)) continue;

        const isFeast = isFeastCategory(categoryTitle);

        const itemsObj = category?.items || {};
        const items = Object.values(itemsObj);

        for (const item of items as any[]) {
          const itemName = item?.item_name || "";
          const isDeal = isDealItem(itemName);

          //  filter logic:
          // include if:
          // - category is FEAST OR
          // - item contains DEAL
          if (!isFeast && !isDeal) continue;

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

      // using adapter
      return mapWrapLabDeals(rawDeals, "wraplab");

    } catch (error: any) {
      console.error("WrapLab Scraper Error:", error.message);
      return [];
    }
  }
}