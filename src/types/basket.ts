export interface Basket {
  basketId: string;
  customerId: number;
  total?: number;
  originalTotal?: number;
  updatedTotal?: number;
  pointsDiscount?: number;
  estimatedPoints?: number;
}