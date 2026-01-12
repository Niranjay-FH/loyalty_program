import { RedeemOption } from "../types/misc";
import { Customer } from "../types/customer";

export const getRedeemableOptions = (
  customer: Customer,
  maxDiscounts: number[],
  basketTotal: number
): RedeemOption[] => {
  const options: RedeemOption[] = [];

  maxDiscounts.forEach((discount) => {
    if (customer.points >= discount && discount <= basketTotal) {
      options.push({
        points: discount,
        discount: `${discount} OFF`,
      });
    }
  });

  return options;
};