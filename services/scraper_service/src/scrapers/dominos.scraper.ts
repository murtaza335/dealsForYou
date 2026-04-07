import axios from "axios";
import { BaseScraper } from "./base.scraper.js";
import { mapDominosDeals } from "../adapters/deal.adapter.js";
import { Deal } from "../interfaces/deal.interface.js";

const DOMINOS_IMAGE_BASE_URL = "https://www.dominos.com.pk/images/";

const normalizeImageUrl = (imagePath: string | undefined): string => {
  if (!imagePath) return DOMINOS_IMAGE_BASE_URL;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  const cleanBase = DOMINOS_IMAGE_BASE_URL.endsWith("/")
    ? DOMINOS_IMAGE_BASE_URL
    : `${DOMINOS_IMAGE_BASE_URL}/`;
  const cleanPath = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath;
  return `${cleanBase}${cleanPath}`;
};

export class DominosScraper extends BaseScraper {
  async fetchDeals(): Promise<Deal[]> {
    try {
      const response = await axios.post(
        "https://www.dominos.com.pk/api/menu/menudata",
        {
          body: "U2FsdGVkX197Ze4kW9rY5vRnb9y1f4MoTTAbHPlCyEq8BHb3cSUMrQbBtWzw1MA8Wm5P/Zpq68xujm1y31WlFE2pa9031vxMS13Dh7bS59w="
        },
        {
          headers: {
            "content-type": "application/json",
            origin: "https://www.dominos.com.pk",
            referer: "https://www.dominos.com.pk/"
          }
        }
      );

      const menuData = response.data?.menu?.menuData || [];

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
            image: normalizeImageUrl(deal.image_url),
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