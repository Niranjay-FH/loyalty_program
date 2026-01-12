import { calculateMulipliers } from '../utils/discount';
import { writeData } from '../utils/data';

import { customers } from '../data/customers';
import { baskets } from '../data/baskets';
import { counters } from '../data/counters';
import { points_ledger } from '../data/points_ledger';

import { Customer } from '../types/customer';
import { BasketEntity } from '../types/basket';

export function completeOrderService(customer: Customer, basket: BasketEntity) {
	const {
		tierName,
		tierMult,
		birthdayMult,
		totalMult
	} = calculateMulipliers(customer);

	const orderTotal = basket.updatedTotal ?? basket.total;

	if (orderTotal === undefined) {
		throw new Error(
			`Order total is missing for basket ${basket.basketId}`
		);
	}

	const basePoints = Math.floor(orderTotal * 0.01);
	const pointsEarned = Math.floor(basePoints * totalMult);

	// Update customer
	customer.points += pointsEarned;
	customer.totalSpent += orderTotal;
	customer.orderCount = (customer.orderCount || 0) + 1;
	customer.tier = tierName;

	const customerIndex = customers.findIndex(
		c => c.customerId === customer.customerId
	);

	customers[customerIndex] = {
		...customers[customerIndex],
		...customer
	};

	writeData('customers', customers);

	// Update basket (preserve all required fields)
	const basketIndex = baskets.findIndex(
		b => b.basketId === basket.basketId
	);

	if (basketIndex === -1) {
		throw new Error(
			`Basket not found for basketId ${basket.basketId}`
		);
	}

	const existingBasket = baskets[basketIndex];

	baskets[basketIndex] = {
		...existingBasket,
		updatedTotal:
			basket.updatedTotal !== undefined
				? basket.updatedTotal
				: existingBasket.updatedTotal,
		pointsDiscount:
			basket.pointsDiscount !== undefined
				? basket.pointsDiscount
				: existingBasket.pointsDiscount
	};

	writeData('baskets', baskets);

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
			...(basket.updatedTotal !== undefined && {
				updatedTotal: basket.updatedTotal
			}),
			...(basket.pointsDiscount !== undefined && {
				pointsDiscount: basket.pointsDiscount
			})
		},
		loyalty: {
			phone: customer.phone,
			name: customer.name,
			remainingPoints: customer.points,
			tier: tierName,
			tierMultiplier: `${tierMult}`,
			birthdayMultiplier: birthdayMult === 1.5 ? '1.5' : '1.0',
			totalMultiplier: totalMult.toFixed(1),
			pointsEarned
		}
	};
}