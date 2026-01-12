import type { BasketEntity, BasketResponse } from '../types/basket';
import type { Customer } from '../types/customer';

import { customers } from '../data/customers';
import { baskets } from '../data/baskets';

import fs from "fs";
import path from "path";

export const writeData = (filename: string, data: any): void => {
  fs.writeFileSync(
    path.join(__dirname, "..", "data", `${filename}.ts`),
    `export const ${filename} = ${JSON.stringify(data, null, 2)};`
  );
};

export function getCustomerDetails(basket: BasketResponse): Customer | undefined {
    return customers.find(
        (c: Customer) => c.customerId === basket.customerId
    );
}

export function getBasketDetails(
    basketId: string
): BasketEntity | undefined {
    console.log('Obtained Basket');

    return baskets.find(
        (b: BasketEntity) => b.basketId === basketId
    );
}