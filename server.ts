import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";

import { TIER, getTier } from "./src/utils/tier"
import { writeData } from "./src/utils/data"
import { getRedeemableOptions } from "./src/utils/discount"
import { getBasketDetails, getCustomerDetails, calculateMulipliers } from "./src/utils/misc"

import { Customer } from './src/types/customer';
import { Basket } from './src/types/basket';
import { Partner } from './src/types/partner';
import { ApiResponse } from './src/types/response';

dotenv.config()

import { customers } from "./src/data/customers";
import { baskets } from "./src/data/baskets";
import { counters } from "./src/data/counters";
import { partners } from "./src/data/partners";
import { points_ledger } from "./src/data/points_ledger";

let checkFlag: boolean = false;

const app = express();
app.use(express.json())
console.log("App Initialised")

const sendResponse = <T>(
    res: Response, 
    success: boolean, 
    data: T | any, 
    message: string, 
    statusCode: number = 200
): void => {
    res.status(statusCode).json({
        success,
        data: success ? data : null,
        message,
        errors: success ? null : data
    } as ApiResponse<T>);
};

function verifyFoodhub(req: Request, res: Response, next: NextFunction) {
    const apiKey = req.headers.authorization?.replace('Bearer ', '');
    if (!apiKey) {
        return res.status(401).json({ error: 'Missing API key' });
    }
 
    const partner = partners.find(p => p.apiKey === apiKey && p.status === 'active');
 
    if (!partner || partner.partnerId !== 'foodhub') {
        return res.status(401).json({ error: 'Invalid Foodhub API key' });
    }
 
    (req as any).partner = partner;
    console.log("Auth Done");
    next();
}

app.post('/api/loyalty/basket/:basketId/check', verifyFoodhub, (req: Request, res: Response) => {
    const basketId = req.params.basketId as string;
    const { action = "check" } = req.body;

    try {
        const basket: Basket | undefined = getBasketDetails(basketId);
        if (!basket) {
            return res.status(401).json({ error: 'Basket Not Found' });
        }

        const customer: Customer | undefined = getCustomerDetails(basket);
        if (!customer) {
            return res.status(401).json({ error: 'Customer Not Found' });
        }

        const {
            totalSpent,
            tierName,
            tierMult,
            birthdayMult,
            totalMult
        } = calculateMulipliers(customer);

        const companyMaxDiscounts: number[] = [200, 400, 600];  // TODO: update to dynamic

        if (action === 'check') {
            for (let i = 0; i < companyMaxDiscounts.length; i++) {
                let discount = companyMaxDiscounts[i];

                if (customer.points >= discount && discount <= basket.total!) {
                    checkFlag = true;
                    break;
                }
            }
        }

        const responseData = {
            lookupChain: {
                basketId,
                customerId: basket.customerId,
                phone: customer.phone
            },
            basket: {
                total: basket.total!,
                estimatedPoints: Math.floor(basket.total! * 0.01 * totalMult)
            },
            loyalty: {
                phone: customer.phone,
                name: customer.name,
                remainingPoints: customer.points,
                tier: tierName,
                tierMultiplier: tierMult,
                birthdayMultiplier: birthdayMult,
                totalMultiplier: totalMult,
                canRedeem: checkFlag,
                redeemOptions: getRedeemableOptions(customer, companyMaxDiscounts, basket.total!)
            }
        };

        sendResponse(res, true, responseData, 'Customer Can Redeem Points');

    } catch(error) {
        console.error(error);
        return res.status(401).json({ error: 'Check Invalid' });
    }
});

app.post('/api/loyalty/basket/:basketId/redeem', verifyFoodhub, (req: Request, res: Response) => {
    const basketId = req.params.basketId as string;
    const { toRedeem } = req.body;

    try {
        const basket = getBasketDetails(basketId);
        if (!basket) {
            return res.status(404).json({ error: 'Basket Not Found' });
        }

        const customer = getCustomerDetails(basket);
        if (!customer) {
            return res.status(401).json({ error: 'Customer Not Found' });
        }

        const companyMaxDiscounts = [200, 400, 600];

        // Validate company discount
        if (!companyMaxDiscounts.includes(toRedeem)) {
            return res.json({
                success: false,
                error: `Invalid discount amount. Allowed: ${companyMaxDiscounts.join(', ')}`
            });
        }

        // Validate customer points
        if (customer.points < toRedeem) {
            return res.json({
                success: false,
                error: `Insufficient points: ${customer.points}/${toRedeem}`
            });
        }

        // Evaluate max redeemable points
        const maxRedeemable = Math.min(toRedeem, basket.total!);

        // Update customer points
        customer.points -= maxRedeemable;
        customer.tier = getTier(customer.totalSpent);
        const customerIndex = customers.findIndex(c => c.customerId === customer.customerId);
        customers[customerIndex] = customer;
        writeData('customers', customers);

        // Update basket
        const basketIndex = baskets.findIndex(b => b.basketId === basketId);
        baskets[basketIndex] = {
            ...baskets[basketIndex],
            originalTotal: basket.total!,
            updatedTotal: basket.total! - maxRedeemable,
            pointsDiscount: maxRedeemable
        };
        writeData('baskets', baskets);

        // Ledger entry - redeem
        points_ledger.push({
            ledgerId: `ledger_${counters.nextLedgerId++}`,
            phone: customer.phone,
            type: 'redeem',
            points: -maxRedeemable,
            orderId: basketId,
            orderAmount: maxRedeemable,
            tier: getTier(customer.totalSpent),
            reason: `Redeem ${maxRedeemable}pts (capped)`,
            timestamp: new Date().toISOString()
        });
        writeData('counters', counters);
        writeData('points_ledger', points_ledger);

        const responseData = {
            lookupChain: {
                basketId,
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

        sendResponse(res, true, responseData, 'Points Redeemed Successfully');

    } catch(error) {
        console.error(error);
        return res.status(401).json({ error: 'Server Error' });
    }
});

app.post('/api/loyalty/basket/:basketId/complete', verifyFoodhub, (req: Request, res: Response) => {
    const basketId = req.params.basketId as string;

    try {
        const basket = getBasketDetails(basketId);
        if (!basket) {
            return res.status(404).json({ error: 'Basket Not Found' });
        }

        const customer = getCustomerDetails(basket);
        if (!customer) {
            return res.status(401).json({ error: 'Customer Not Found' });
        }

        const {
            totalSpent,
            tierName,
            tierMult,
            birthdayMult,
            totalMult
        } = calculateMulipliers(customer);

        // Calculate points earned (use updatedTotal if redeemed)
        const orderTotal = basket.updatedTotal || basket.total!;
        const basePoints = Math.floor(orderTotal * 0.01);
        const pointsEarned = Math.floor(basePoints * totalMult);

        // Update Customer Fields
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

        // Ledger entry - earn
        points_ledger.push({
            ledgerId: `ledger_${counters.nextLedgerId++}`,
            phone: customer.phone,
            type: 'earn',
            points: pointsEarned,
            orderId: basketId,
            orderAmount: orderTotal,
            tier: tierName,
            multiplier: totalMult.toFixed(1),
            reason: `Earn on ${orderTotal}`,
            timestamp: new Date().toISOString()
        });
        writeData('counters', counters);
        writeData('points_ledger', points_ledger);

        const responseData = {
            lookupChain: {
                basketId,
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

        sendResponse(res, true, responseData, 'Order Completed');
    } catch(error) {
        console.error(error);
        return res.status(401).json({ error: 'Server Error' });
    }
});

const PORT = 3000; // process.env.PORT || 
app.listen(PORT, () => {
    console.log("Server Started in PORT:", PORT);
})