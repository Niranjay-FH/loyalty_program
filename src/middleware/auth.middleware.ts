import { Request, Response, NextFunction } from 'express';
import { partners } from '../data/partners';
import { ErrorCodes } from '../utils/errors';
import { sendError } from '../utils/response';

export function verifyFoodhub(req: Request, res: Response, next: NextFunction) {
    const apiKey = req.headers.authorization?.replace('Bearer ', '');
    
    if (!apiKey) {
        return sendError(res, ErrorCodes.MISSING_API_KEY);
    }
 
    const partner = partners.find(p => p.apiKey === apiKey && p.status === 'active');
 
    if (!partner || partner.partnerId !== 'foodhub') {
        return sendError(res, ErrorCodes.INVALID_API_KEY);
    }
 
    (req as any).partner = partner;
    console.log("Auth Done");
    next();
}