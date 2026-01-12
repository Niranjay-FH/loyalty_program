export const ErrorCodes = {
    // Authentication Errors (1xxx)
    MISSING_API_KEY: { code: 1001, message: 'Missing API key', status: 401 },
    INVALID_API_KEY: { code: 1002, message: 'Invalid Foodhub API key', status: 401 },
    UNAUTHORIZED: { code: 1003, message: 'Unauthorized access', status: 401 },

    // Basket Errors (2xxx)
    BASKET_NOT_FOUND: { code: 2001, message: 'Basket Not Found', status: 404 },
    BASKET_CHECK_INVALID: { code: 2002, message: 'Check Invalid', status: 400 },

    // Customer Errors (3xxx)
    CUSTOMER_NOT_FOUND: { code: 3001, message: 'Customer Not Found', status: 404 },
    INSUFFICIENT_POINTS: { code: 3002, message: 'Insufficient points', status: 400 },

    // Redemption Errors (4xxx)
    INVALID_DISCOUNT_AMOUNT: { code: 4001, message: 'Invalid discount amount', status: 400 },
    REDEMPTION_FAILED: { code: 4002, message: 'Redemption failed', status: 400 },

    // Server Errors (5xxx)
    SERVER_ERROR: { code: 5001, message: 'Internal Server Error', status: 500 },
    DATABASE_ERROR: { code: 5002, message: 'Database operation failed', status: 500 },
};

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];