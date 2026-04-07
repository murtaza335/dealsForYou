export interface Deal {
  id: number;
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  image: string;
  category: string;
  brandSlug: string;
  isActive?: boolean;
  publishedAt?: Date;
}