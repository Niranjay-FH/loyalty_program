import { ErrorCode } from './errors';
import { Response } from 'express';
import { ApiResponse } from '../types/response';

export const sendResponse = <T>(
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

export const sendError = (
    res: Response,
    errorCode: ErrorCode,
    additionalInfo?: any
): void => {
    res.status(errorCode.status).json({
        success: false,
        data: null,
        message: errorCode.message,
        errors: {
            code: errorCode.code,
            message: errorCode.message,
            ...(additionalInfo && { details: additionalInfo })
        }
    });
};