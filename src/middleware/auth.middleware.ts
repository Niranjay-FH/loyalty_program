import { Request, Response, NextFunction } from 'express';
import { provider } from '../data/provider';
import { ErrorCodes } from '../utils/errors';
import { sendError } from '../utils/response';

export function verifyProvider(expectedProvider?: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'] as string | undefined;

    if (!apiKey) {
      return sendError(res, ErrorCodes.MISSING_API_KEY);
    }

    const partner = provider.find(
      p => p.apiKey === apiKey && p.status === 'active'
    );

    if (!partner) {
      return sendError(res, ErrorCodes.INVALID_API_KEY);
    }

    if (expectedProvider && partner.partnerId !== expectedProvider) {
      return sendError(res, ErrorCodes.INVALID_API_KEY);
    }

    (req as any).partner = partner;
    next();
  };
}