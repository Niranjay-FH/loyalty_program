const customers = require('../data/customers');
const baskets = require('../data/baskets');
const { TIER, getTier } = require('./tier');

function isBirthday(customer) {
    if (!customer.birthday) return 1.0;
 
    const birthdayDate = new Date(customer.birthday);
    const today = new Date();

    const isBirthdayToday =
        birthdayDate.getMonth() === today.getMonth() &&
        birthdayDate.getDate() === today.getDate();
   
    return isBirthdayToday ? 1.5 : 1.0;
}

function getCustomerDetails(basket){
    const customerIndex = customers.findIndex(c => c.customerId === basket.customerId);
    if (customerIndex === -1) {
        return res.status(401).json({ error: 'Customer Not Found' });
    } else {
        return customers;
    }
}

function getBasketDetails(basketId){
    const basket = baskets.find(b => b.basketId === basketId);
    console.log("Obtained Basket")

    if (!basket) {
        return res.status(401).json({ error: 'Invalid Basket ID' });
    } else {
        return { baskets, basket };
    }
}

function calculateMulipliers(customer){
    const totalSpent = customer.totalSpent || 0;
    const tierName = getTier(totalSpent);
    const tierMult = TIER[tierName]?.mult || 1.0;
    const birthdayMult = isBirthday(customer);
    const totalMult = birthdayMult * tierMult;

    return { totalSpent, tierName, tierMult, birthdayMult, totalMult }
}

module.exports = { isBirthday, getCustomerDetails, getBasketDetails, calculateMulipliers }