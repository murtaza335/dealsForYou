type DealForEmbedding = {
  title: string;
  description?: string;
  price: number;
  discountPercent?: number;
  cuisineTags?: string[];
  mealType?: string[];
  minPersons?: number;
  maxPersons?: number;
  endTime?: Date | string | null;
  locations?: string[];
};

type BrandForEmbedding = {
  name: string;
};

function uniqueClean(values?: string[]): string[] {
  if (!values) return [];
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

export function buildDealText(deal: DealForEmbedding, brand: BrandForEmbedding): string {
  const cuisines = uniqueClean(deal.cuisineTags);
  const meals = uniqueClean(deal.mealType);
  const locations = uniqueClean(deal.locations);

  const groupText =
    deal.minPersons && deal.maxPersons
      ? `For ${deal.minPersons}-${deal.maxPersons} people.`
      : deal.minPersons
        ? `For at least ${deal.minPersons} people.`
        : "Suitable for any group size.";

  const validUntil =
    deal.endTime ? `Valid until ${new Date(deal.endTime).toISOString().split("T")[0]}.` : "";

  return [
    `${brand.name} deal.`,
    deal.title,
    deal.description || "",
    cuisines.length ? `Cuisine: ${cuisines.join(", ")}.` : "Cuisine: various.",
    meals.length ? `Meal type: ${meals.join(", ")}.` : "Meal type: meal.",
    groupText,
    `Price: ${deal.price} PKR.`,
    `Discount: ${deal.discountPercent ?? 0}%.`,
    locations.length ? `Available in ${locations.join(", ")}.` : "",
    validUntil,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
