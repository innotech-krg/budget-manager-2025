// =====================================================
// Budget Manager 2025 - Rate Limiter Middleware
// Deutsche Geschäfts-API Rate Limiting
// =====================================================

import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for budget operations
 */
export const rateLimitBudget = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Zu viele Budget-Anfragen',
    message: 'Zu viele Anfragen von dieser IP-Adresse. Bitte versuchen Sie es später erneut.',
    code: 'BUDGET_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * General API rate limiter
 */
export const rateLimitGeneral = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    error: 'Zu viele Anfragen',
    message: 'Zu viele Anfragen von dieser IP-Adresse. Bitte versuchen Sie es später erneut.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export default {
  rateLimitBudget,
  rateLimitGeneral
};