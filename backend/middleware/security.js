import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import { env } from '../config/env.js';

export function applySecurity(app) {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        // Product and category images can be hosted by external HTTPS providers.
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  }));
  app.use(cors({ origin: env.corsOrigin === '*' ? '*' : env.corsOrigin.split(','), credentials: true }));
  app.use(sanitizeRequestData);
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }));
}

function sanitizeRequestData(req, res, next) {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  next();
}
