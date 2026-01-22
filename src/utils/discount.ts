import { RedeemOption } from "../types/misc";
import { Customer } from "../types/customer";
import { BasketResponse } from "../types/basket";
import { Store } from "../types/restaurant";
import { TIER, getTier } from "./tier";
import { isBirthday } from "./misc";
import { ErrorCode, ErrorCodes } from "./errors";

export const getRedeemableOptions = (
	customer: Customer,
	allowedDiscounts: number[],
	basketTotal: number
): RedeemOption[] => {
	const options: RedeemOption[] = [];

	allowedDiscounts.forEach((discount) => {
		if (customer.points >= discount && discount <= basketTotal) {
			options.push({
				points: discount,
				discount: `${discount} OFF`,
			});
		}
	});

	return options;
};

export function canRedeemPoints(
	customer: Customer,
	basket: BasketResponse,
	store: Store
): { canRedeem: boolean; reason?: string; errorCode?: ErrorCode; details?: Record<string, any> } {
	// Check if store has loyalty partner enabled
	if (!store.loyaltyPartner.enabled) {
		return {
			canRedeem: false,
			errorCode: ErrorCodes.STORE_NO_LOYALTY,
			reason: 'Store does not participate in loyalty program'
		};
	}
	
	// Get partner id from store
	const partnerId = store.loyaltyPartner.partnerId;
	if (!partnerId) {
		return {
			canRedeem: false,
			errorCode: ErrorCodes.STORE_NO_PARTNER,
			reason: 'Store has no loyalty partner configured'
		};
	}
	
	// Find customer's loyalty info by partnerId
	const loyaltyInfo = customer.loyaltyInfo.find(
		(info) => info.partnerId === partnerId
	);
	if (!loyaltyInfo) {
		return {
			canRedeem: false,
			errorCode: ErrorCodes.CUSTOMER_NOT_ENROLLED,
			reason: 'Customer not enrolled in this loyalty program'
		};
	}
	
	// Check membership status
	if (loyaltyInfo.membership.status !== "active") {
		return {
			canRedeem: false,
			errorCode: ErrorCodes.MEMBERSHIP_INACTIVE,
			reason: 'Loyalty membership is not active'
		};
	}
	
	// Check membership expiry
	const now = new Date();
	const expiryDate = new Date(loyaltyInfo.membership.expiryDate);
	if (now > expiryDate) {
		return {
			canRedeem: false,
			errorCode: ErrorCodes.MEMBERSHIP_EXPIRED,
			reason: `Loyalty membership expired on ${expiryDate.toLocaleDateString('en-US')}`,
			details: { expiryDate: expiryDate.toLocaleDateString('en-US') }
		};
	}
	
	// Check minimum orders requirement
	const minOrders = store.loyaltyPartner.validationRules?.minOrders || 0;
	if (loyaltyInfo.noOrders < minOrders) {
		return {
			canRedeem: false,
			errorCode: ErrorCodes.MIN_ORDERS_NOT_MET,
			reason: `Minimum ${minOrders} orders required. You have ${loyaltyInfo.noOrders} orders`,
			details: { 
				minOrders, 
				currentOrders: loyaltyInfo.noOrders 
			}
		};
	}
	
	// Any valid redemption options
	const allowedDiscounts = store.loyaltyPartner.allowedDiscounts || [];
	const hasValidOption = allowedDiscounts.some(
		(discount) => customer.points >= discount && discount <= basket.total!
	);
	
	if (!hasValidOption) {
		if (allowedDiscounts.length === 0) {
			return {
				canRedeem: false,
				errorCode: ErrorCodes.NO_DISCOUNTS_AVAILABLE,
				reason: 'No discount options available at this store'
			};
		}
		const minDiscount = Math.min(...allowedDiscounts);
		if (customer.points < minDiscount) {
			return {
				canRedeem: false,
				errorCode: ErrorCodes.INSUFFICIENT_POINTS,
				reason: `Insufficient points. Minimum ${minDiscount} points required`,
				details: { 
					required: minDiscount,
					available: customer.points 
				}
			};
		}
		if (basket.total! < minDiscount) {
			return {
				canRedeem: false,
				errorCode: ErrorCodes.BASKET_TOTAL_TOO_LOW,
				reason: `Basket total too low for redemption. Minimum ${minDiscount} required`,
				details: { 
					minRequired: minDiscount,
					basketTotal: basket.total 
				}
			};
		}
	}
	
	return { canRedeem: true };
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