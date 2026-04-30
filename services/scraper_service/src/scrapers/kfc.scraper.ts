import axios from "axios";
import { BaseScraper } from "./base.scraper.js";
import { Deal } from "../interfaces/deal.interface.js";
import { mapKfcDeals } from "../adapters/deal.adapter.js";
import { ScraperSourceDocument } from "../models/scraperSources.js";

// in kfc all groups api response the is array of group (that has the info of all groups), and also group data (that has the info of all items in that group we filter the deals that are in group 3 and 4 as they are the main deal groups, and also we check for group 6 (limited time offers) if they are active based on their serving hours, and for other groups we check if the item is combo like as most of the deals are combo like

//  Time check as it also have midnight deal`s that are only available during night time so time check is required
function isWithinServingHours(servingHours: string | null): boolean {
  if (!servingHours) return true;

  try {
    const schedule = JSON.parse(servingHours);

    const now = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" })
    );

    const currentDay = now.toLocaleString("en-US", { weekday: "long" }).toUpperCase();
    const currentTime = now.toTimeString().slice(0, 5);

    const today = schedule.find((d: any) => d.day === currentDay);
    if (!today) return false;

    return today.timePeriods.some((p: any) => {
      if (p.open <= p.close) {
        return currentTime >= p.open && currentTime <= p.close;
      } else {
        return currentTime >= p.open || currentTime <= p.close;
      }
    });

  } catch {
    return false;
  }
}

// 🧠 Detect combo-like
function isComboLike(item: any): boolean {
  return (
    item.combo_id ||
    (item.combo_name && item.combo_name.toLowerCase().includes("combo")) ||
    (item.item_name && item.item_name.toLowerCase().includes("combo"))
  );
}

export class KfcScraper extends BaseScraper {
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

      const imageBaseUrl = source.baseApiUrl || "https://www.kfcpakistan.com";

      const response = await axios.post(
        source.scrapApiURl,
        requestBody,
        {
          headers: requestHeaders
        }
      );

      const groups = response.data?.groupsData || [];
      const rawDeals: any[] = [];

      for (const group of groups) {
        const items = group.data || [];

        for (const item of items) {
          let shouldInclude = false;

          if (group.group_id === 3 || group.group_id === 4) {
            shouldInclude = true;
          } else if (group.group_id === 6) {
            shouldInclude = isWithinServingHours(item.serving_hours);
          } else {
            shouldInclude = isComboLike(item);
          }

          if (!shouldInclude) continue;

          rawDeals.push({
            id: item.combo_id || item.menu_item_id,
            name: item.combo_name || item.item_name,
            description:
              item.combo_description ||
              item.item_size?.[0]?.description ||
              "",
            price:
              item.combo_mrp_price ||
              item.item_size?.[0]?.mrp ||
              0,
            salePrice: 0,
            imgUrl:
              `${imageBaseUrl}/images/${item.image_url}` ||
              item.item_size?.[0]?.image_url ||
              "",
            category: group.group_name || "KFC Deals"
          });
        }
      }

      return mapKfcDeals(rawDeals, "kfc");

    } catch (error: any) {
      console.error("KFC Scraper Error:", error.message);
      return [];
    }
  }
}