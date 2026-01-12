import { getTier } from '../utils/tier';
import { writeData } from '../utils/data';
import { getRedeemableOptions, canRedeemPoints,calculateMulipliers } from '../utils/discount';

import { customers } from '../data/customers';
import { baskets } from '../data/baskets';
import { counters } from '../data/counters';
import { points_ledger } from '../data/points_ledger';

import { Customer } from '../types/customer';
import { Basket } from '../types/basket';

export class LoyaltyService {

    static getLoyaltyInfo(customer: Customer, basket: Basket) {
        const {
            totalSpent,
            tierName,
            tierMult,
            birthdayMult,
            totalMult
        } = calculateMulipliers(customer);

        const estimatedPoints = Math.floor(basket.total! * 0.01 * totalMult);
        const canRedeem = canRedeemPoints(customer, basket);
        const redeemOptions = getRedeemableOptions(customer, [200, 400, 600], basket.total!);

        return {
            lookupChain: {
                basketId: basket.basketId,
                customerId: basket.customerId,
                phone: customer.phone
            },
            basket: {
                total: basket.total!,
                estimatedPoints
            },
            loyalty: {
                phone: customer.phone,
                name: customer.name,
                remainingPoints: customer.points,
                tier: tierName,
                tierMultiplier: tierMult,
                birthdayMultiplier: birthdayMult,
                totalMultiplier: totalMult,
                canRedeem,
                redeemOptions
            }
        };
    }

    static redeemPoints(customer: Customer, basket: Basket, toRedeem: number) {
        const maxRedeemable = Math.min(toRedeem, basket.total!);

        // Update customer
        customer.points -= maxRedeemable;
        customer.tier = getTier(customer.totalSpent);
        const customerIndex = customers.findIndex(c => c.customerId === customer.customerId);
        customers[customerIndex] = customer;
        writeData('customers', customers);

        // Update basket
        const basketIndex = baskets.findIndex(b => b.basketId === basket.basketId);
        baskets[basketIndex] = {
            ...baskets[basketIndex],
            originalTotal: basket.total!,
            updatedTotal: basket.total! - maxRedeemable,
            pointsDiscount: maxRedeemable
        };
        writeData('baskets', baskets);

        // Add ledger entry
        points_ledger.push({
            ledgerId: `ledger_${counters.nextLedgerId++}`,
            phone: customer.phone,
            type: 'redeem',
            points: -maxRedeemable,
            orderId: basket.basketId!,
            orderAmount: maxRedeemable,
            tier: getTier(customer.totalSpent),
            reason: `Redeem ${maxRedeemable}pts (capped)`,
            timestamp: new Date().toISOString()
        });
        writeData('counters', counters);
        writeData('points_ledger', points_ledger);

        return {
            lookupChain: {
                basketId: basket.basketId,
                customerId: basket.customerId,
                phone: customer.phone
            },
            basket: {
                originalTotal: basket.total!,
                updatedTotal: basket.total! - maxRedeemable,
                pointsDiscount: maxRedeemable
            },
            loyalty: {
                remainingPoints: customer.points,
                pointsUsed: maxRedeemable
            }
        };
    }

    static completeOrder(customer: Customer, basket: Basket) {
        const {
            tierName,
            tierMult,
            birthdayMult,
            totalMult
        } = calculateMulipliers(customer);

        const orderTotal = basket.updatedTotal || basket.total!;
        const basePoints = Math.floor(orderTotal * 0.01);
        const pointsEarned = Math.floor(basePoints * totalMult);

        // Update customer
        customer.points += pointsEarned;
        customer.totalSpent += orderTotal;
        customer.orderCount = (customer.orderCount || 0) + 1;
        customer.tier = tierName;
        const customerIndex = customers.findIndex(c => c.customerId === customer.customerId);
        customers[customerIndex] = {
            ...customers[customerIndex],
            ...customer
        };
        writeData('customers', customers);

        // Add ledger entry
        points_ledger.push({
            ledgerId: `ledger_${counters.nextLedgerId++}`,
            phone: customer.phone,
            type: 'earn',
            points: pointsEarned,
            orderId: basket.basketId!,
            orderAmount: orderTotal,
            tier: tierName,
            multiplier: totalMult.toFixed(1),
            reason: `Earn on ${orderTotal}`,
            timestamp: new Date().toISOString()
        });
        writeData('counters', counters);
        writeData('points_ledger', points_ledger);

        return {
            lookupChain: {
                basketId: basket.basketId,
                customerId: basket.customerId,
                phone: customer.phone
            },
            basket: {
                total: orderTotal,
                ...(basket.updatedTotal && { updatedTotal: basket.updatedTotal }),
                ...(basket.pointsDiscount && { pointsDiscount: basket.pointsDiscount })
            },
            loyalty: {
                phone: customer.phone,
                name: customer.name,
                remainingPoints: customer.points,
                tier: tierName,
                tierMultiplier: `${tierMult}`,
                birthdayMultiplier: birthdayMult === 1.5 ? '1.5' : '1.0',
                totalMultiplier: `${totalMult.toFixed(1)}`,
                pointsEarned
            }
        };
    }
}