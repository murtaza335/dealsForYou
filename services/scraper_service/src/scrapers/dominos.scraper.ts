import axios from "axios";
import { BaseScraper } from "./base.scraper.js";
import { mapDominosDeals } from "../adapters/deal.adapter.js";
import { Deal } from "../interfaces/deal.interface.js";
import { ScraperSourceDocument } from "../models/scraperSources.js";

const normalizeImageUrl = (
  imagePath: string | undefined,
  imageBaseUrl: string
): string => {
  if (!imagePath) return imageBaseUrl;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  const cleanBase = imageBaseUrl.endsWith("/")
    ? imageBaseUrl
    : `${imageBaseUrl}/`;
  const cleanPath = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath;
  return `${cleanBase}${cleanPath}`;
};

// Dominos scraper implementation 
export class DominosScraper extends BaseScraper {
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

      const imageBaseUrl = source.baseApiUrl || "https://www.dominos.com.pk/images/";

      const response = await axios.post(
        source.scrapApiURl,
        requestBody,
        {
          headers: requestHeaders
        }
      );

      //filter out the deals from the menu data and map it to our internal Deal structure
      const menuData = response.data?.menu?.menuData || [];

      // group 11 is the deals group of the dominos menu.
      const dealsGroups = menuData.filter((item: any) => item.group_id === 11);

      const rawDeals = dealsGroups
        .filter((item: any) => Array.isArray(item.data))
        .flatMap((item: any) =>
          item.data.map((deal: any) => ({
            combo_id: deal.combo_id,
            name: deal.combo_name,
            description: deal.combo_description,
            price: deal.combo_mrp_price,
            salePrice: deal.combo_sale_price,
            image: normalizeImageUrl(deal.image_url, imageBaseUrl),
            category:
              item.sub_group_name ||
              item.subgroup_name ||
              item.group_name ||
              "Deals"
          }))
        );

      return mapDominosDeals(rawDeals);

    } catch (error: any) {
      console.error("Dominos Scraper Error:", error.message);
      return [];
    }
  }
}

//dominos time check not required as if they deals are not active at that time they dont send that deal data the sent empty array and we have filter only those that have deals data otherwise deal will not be included in the final output