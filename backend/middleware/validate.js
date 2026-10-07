import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';

export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    req.body = parsed.body ?? req.body;
    req.params = parsed.params ?? req.params;
    req.validatedQuery = parsed.query ?? req.query;
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
      return next(new AppError(details.join('; '), 400));
    }

    next(error);
  }
};
