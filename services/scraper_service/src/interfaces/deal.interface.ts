//our schema for the deal data that we will be storing in our database
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