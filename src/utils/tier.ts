const TIER = {
    copper: {
        mult: 0.2,
        target: 100
    },

    bronze: {
        mult: 1,
        target: 250
    },

    silver: {
        mult: 1.5,
        target: 2500
    },

    gold: {
        mult: 2,
        target: 25000
    },
};

function getTier(totalSpent) {
    if (totalSpent >= 25000) return 'gold';
    if (totalSpent >= 2500)  return 'silver'; 
    if (totalSpent >= 250)   return 'bronze';
    if (totalSpent >= 100)   return 'copper';
    return 'copper';
}

module.exports = { TIER, getTier };