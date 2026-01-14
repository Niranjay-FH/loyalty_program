import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodIssue } from 'zod';
import { sendError } from '../utils/response';
import { ErrorCodes } from '../utils/errors';

// Generic validation middleware factory
export const validate = (schema: z.ZodSchema) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			// Validate the request object (params, body, query)
			await schema.parseAsync({
			params: req.params,
				body: req.body,
				query: req.query
			});

			next();
		} catch (error) {
			if (error instanceof ZodError) {
				// Format validation errors
				const formattedErrors = error.issues.map((err: ZodIssue) => ({
					field: err.path.join('.'),
					message: err.message,
					code: err.code
				}));

				return sendError(res, ErrorCodes.VALIDATION_ERROR, {
					validationErrors: formattedErrors
				});
			}

			// Handle unexpected errors
			console.error('Validation middleware error:', error);
			return sendError(res, ErrorCodes.SERVER_ERROR);
		}
	};
};

export const validateParams = (schema: z.ZodSchema) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			await schema.parseAsync(req.params);
			next();
		} catch (error) {
			if (error instanceof ZodError) {
				const formattedErrors = error.issues.map((err: ZodIssue) => ({
					field: err.path.join('.'),
					message: err.message,
					code: err.code
				}));

				return sendError(res, ErrorCodes.VALIDATION_ERROR, {
					validationErrors: formattedErrors
				});
			}

			console.error('Param validation error:', error);
			return sendError(res, ErrorCodes.SERVER_ERROR);
		}
	};
};

export const validateBody = (schema: z.ZodSchema) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			await schema.parseAsync(req.body);
			next();
		} catch (error) {
			if (error instanceof ZodError) {
				const formattedErrors = error.issues.map((err: ZodIssue) => ({
					field: err.path.join('.'),
					message: err.message,
					code: err.code
				}));

				return sendError(res, ErrorCodes.VALIDATION_ERROR, {
					validationErrors: formattedErrors
				});
			}

			console.error('Body validation error:', error);
			return sendError(res, ErrorCodes.SERVER_ERROR);
		}
	};
};

export const validateQuery = (schema: z.ZodSchema) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			await schema.parseAsync(req.query);
			next();
		} catch (error) {
			if (error instanceof ZodError) {
				const formattedErrors = error.issues.map((err: ZodIssue) => ({
					field: err.path.join('.'),
					message: err.message,
					code: err.code
				}));

				return sendError(res, ErrorCodes.VALIDATION_ERROR, {
					validationErrors: formattedErrors
				});
			}

			console.error('Query validation error:', error);
			return sendError(res, ErrorCodes.SERVER_ERROR);
		}
	};
};