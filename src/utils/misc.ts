import { customers } from '../data/customers';
import { baskets } from '../data/baskets';
import { TIER, getTier } from './tier';

import type { Customer } from '../types/customer';
import type { Basket } from '../types/basket';

export function isBirthday(customer: Customer): number {
    if (!customer.birthday) return 1.0;

    const birthdayDate = new Date(customer.birthday);
    const today = new Date();

    const isBirthdayToday =
        birthdayDate.getMonth() === today.getMonth() &&
        birthdayDate.getDate() === today.getDate();

    return isBirthdayToday ? 1.5 : 1.0;
}

export function getCustomerDetails(basket: Basket): Customer | undefined {
    return customers.find(
        (c: Customer) => c.customerId === basket.customerId
    );
}

export function getBasketDetails(
    basketId: string
): Basket | undefined {
    console.log('Obtained Basket');

    return baskets.find(
        (b: Basket) => b.basketId === basketId
    );
}

export function calculateMulipliers(customer: Customer) {
    const totalSpent = customer.totalSpent ?? 0;
    const tierName = getTier(totalSpent);
    const tierMult = TIER[tierName]?.mult ?? 1.0;
    const birthdayMult = isBirthday(customer);
    const totalMult = birthdayMult * tierMult;

    return {
        totalSpent,
        tierName,
        tierMult,
        birthdayMult,
        totalMult,
    };
}