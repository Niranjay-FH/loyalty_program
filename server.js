require('dotenv').config()

const { readJSON, writeJSON } = require("./utils/data")
const { TIER, getTier } = require("./utils/tier")
const express = require("express");

const app = express();
app.use(express.json())
console.log("App Initialised")

// redeemOptions: customer.points >= 400 ? [
//                     { points: 400, discount: '₹400 OFF' }
//                 ] : customer.points >= 200 ? [
//                     { points: 200, discount: '₹200 OFF' }
//                 ] : []

function getRedeemableOptions(customer, maxDiscount) {
    const customerPoints = customer.points;
    const options = [];
    
    maxDiscount.forEach(discount => {
        if (customerPoints >= discount) {
            options.push({ 
                points: discount, 
                discount: `${discount} OFF` 
            });
        }
    });
    
    return options;
}

function isBirthday(customer) {
    if (!customer.birthday) return 1.0;
  
    const birthdayDate = new Date(customer.birthday);
    const today = new Date();

    const isBirthdayToday = 
        birthdayDate.getMonth() === today.getMonth() &&
        birthdayDate.getDate() === today.getDate();
    
    return isBirthdayToday ? 1.5 : 1.0;
}

function verifyFoodhub(req, res, next) {
    const apiKey = req.headers.authorization?.replace('Bearer ', '');
    if (!apiKey) {
        return res.status(401).json({ error: 'Missing API key' });
    }
  
    const partners = readJSON('partners');
    const partner = partners.find(p => p.apiKey === apiKey && p.status === 'active');
  
    if (!partner || partner.partnerId !== 'foodhub') {
        return res.status(401).json({ error: 'Invalid Foodhub API key' });
    }
  
    req.partner = partner;
    console.log("Auth Done");
    next();
}

app.post('/api/loyalty/basket/:basketId', verifyFoodhub, (req, res) => {
    const { basketId } = req.params;

    const {
        action = "check",
        toRedeem = 0
    } = req.body;

    try {
        // Get Basket ID
        const baskets = readJSON('baskets');
        const basket = baskets.find(b => b.basketId === basketId);
        console.log("Obtained Basket")

        if (!basket) {
            return res.status(401).json({ error: 'Invalid Basket ID' });
        }

        // Get Customer Ph Number frm Basket ID
        const customers = readJSON('customers');
        const customerIndex = customers.findIndex(c => c.customerId === basket.customerId);
        if (customerIndex === -1) {
            return res.status(401).json({ error: 'Customer Not Found' });
        }

        const customer = customers[customerIndex];

        // Calculate Points
        const totalSpent = customer.totalSpent || 0;
        const tierName = getTier(totalSpent);
        const tierMult = TIER[tierName]?.mult || 1.0;
        const birthdayMult = isBirthday(customer);
        const totalMult = birthdayMult * tierMult;

        let result = { status: "checked" };

        if (action === 'redeem' && toRedeem > 0) {
            const maxRedeemable = Math.min(toRedeem, basket.total);
            if (customer.points < maxRedeemable){
                return res.json({
                    success: false,
                    error: "Insufficient Points"
                });
            }

            // Deduct from customer
            customer.points -= maxRedeemable;
            customers[customerIndex] = customer;
            writeJSON('customers', customers);

            // Update Basket
            const basketIndex = baskets.findIndex(b => b.basketId === basketId);

            baskets[basketIndex] = {
                ...basket,
                originalTotal: basket.total,
                updatedTotal: basket.total - maxRedeemable
            };
            writeJSON('baskets', baskets);
            result = { status: "redeemed", pointsUsed: maxRedeemable };
        }

        else if (action === 'complete') {
            const basePoints = Math.floor(basket.total * 0.01);
            const pointsEarned = Math.floor(basePoints * tierMult * birthdayMult);

            // Update CUstomer Fields
            customer.points += pointsEarned;
            customer.totalSpent += basket.total;
            customer.orderCount = (customer.orderCount || 0) + 1;

            customers[customerIndex] = customer;
            writeJSON('customers', customers);

            result = { status: "completed", pointsEarned };
        }

        res.json({
            success: true,
            lookupChain: { basketId, customerId: basket.customerId, phone: customer.phone },
            basket: {
                total: basket.total,
                ...(basket.updatedTotal && { updatedTotal: basket.updatedTotal }),
                ...(basket.pointsDiscount && { pointsDiscount: basket.pointsDiscount }),
                estimatedPoints: Math.floor(basket.total * 0.01 * totalMult)
            },
            loyalty: {
                phone: customer.phone,
                name: customer.name,
                remainingPoints: customer.points,
                tier: getTier(customer.totalSpent),

                tierMultiplier: `${tierMult}`,
                birthdayMultiplier: birthdayMult === 1.5 ? '1.5' : '1.0',
                totalMultiplier: `${totalMult.toFixed(1)}`,

                canRedeem: customer.points >= 200,

                redeemOptions: getRedeemableOptions(customer, [200, 400, 600])
            },
            result
        });

    } catch(error) {
        console.error(error);
        return res.status(401).json({ error: 'Server Error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server Started in PORT:", PORT);
})