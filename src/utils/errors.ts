export const ErrorCodes = {
    // Authentication Errors (1xxx)
    MISSING_API_KEY: { code: 1001, message: 'Missing API key', status: 401 },
    INVALID_API_KEY: { code: 1002, message: 'Invalid Foodhub API key', status: 401 },
    UNAUTHORIZED: { code: 1003, message: 'Unauthorized access', status: 401 },
    
    // Validation Errors (15xx)
    VALIDATION_ERROR: { code: 1501, message: 'Request validation failed', status: 400 },
    
    // Basket Errors (2xxx)
    BASKET_NOT_FOUND: { code: 2001, message: 'Basket Not Found', status: 404 },
    BASKET_CHECK_INVALID: { code: 2002, message: 'Basket check failed', status: 400 },
    
    // Store Errors (25xx)
    STORE_NOT_FOUND: { code: 2501, message: 'Store not found', status: 404 },
    STORE_NO_LOYALTY: { code: 2502, message: 'Store does not participate in loyalty program', status: 400 },
    
    // Customer Errors (3xxx)
    CUSTOMER_NOT_FOUND: { code: 3001, message: 'Customer Not Found', status: 404 },
    INSUFFICIENT_POINTS: { code: 3002, message: 'Insufficient points', status: 400 },
    CUSTOMER_NOT_ENROLLED: { code: 3003, message: 'Customer not enrolled in loyalty program', status: 400 },
    MEMBERSHIP_EXPIRED: { code: 3004, message: 'Loyalty membership has expired', status: 400 },
    MEMBERSHIP_INACTIVE: { code: 3005, message: 'Loyalty membership is not active', status: 400 },
    MIN_ORDERS_NOT_MET: { code: 3006, message: 'Minimum orders requirement not met', status: 400 },
    
    // Redemption Errors (4xxx)
    INVALID_DISCOUNT_AMOUNT: { code: 4001, message: 'Invalid discount amount', status: 400 },
    REDEMPTION_FAILED: { code: 4002, message: 'Redemption failed', status: 400 },
    CANNOT_REDEEM: { code: 4003, message: 'Cannot redeem points', status: 400 },
    
    // Server Errors (5xxx)
    SERVER_ERROR: { code: 5001, message: 'Internal Server Error', status: 500 },
    DATABASE_ERROR: { code: 5002, message: 'Database operation failed', status: 500 },
};

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];