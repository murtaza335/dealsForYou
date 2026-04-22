interface DealForEmbedding {
  title: string;
  description?: string;
  price: number;
  discountPercent?: number;
  cuisineTags?: string[];
  mealType?: string[];
  minPersons?: number;
  maxPersons?: number;
  endTime: Date;
}

interface BrandForEmbedding {
  name: string;
}

/**
 * Convert deal + brand into canonical text for embedding.
 * Why: Same input → same text → same vector. Deterministic.
 */
export function buildDealText(
  deal: DealForEmbedding,
  brand: BrandForEmbedding
): string {
  // Normalize arrays (fallback to 'various' if empty)
  const cuisines = deal.cuisineTags?.length 
    ? deal.cuisineTags.join(', ') 
    : 'various';
  
  const meals = deal.mealType?.length 
    ? deal.mealType.join(', ') 
    : 'meal';
  
  // Group size fallback
  const groupSize = 
    deal.minPersons && deal.maxPersons 
      ? `${deal.minPersons}-${deal.maxPersons} people`
      : 'any group';
  
  // Build sentence
  return [
    `${brand.name} deal:`,
    deal.title,
    deal.description || '',
    `Cuisine: ${cuisines}`,
    `Type: ${meals}`,
    `Group: ${groupSize}`,
    `Price: ${deal.price} PKR`,
    `Discount: ${deal.discountPercent || 0}%`,
    `Valid until ${deal.endTime.toISOString().split('T')[0]}`,
  ]
    .filter(x => x.trim()) // Remove empty strings
    .join(' ')
    .replace(/\s+/g, ' '); // Normalize spaces
}