const { body, param, validationResult } = require('express-validator');

/**
 * Middleware to check validation results and return errors
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

/**
 * Booking validation rules
 */
const validateBooking = [
  body('vehicleId')
    .isMongoId()
    .withMessage('Invalid vehicle ID'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date')
    .custom((value) => {
      const date = new Date(value);
      if (date < new Date()) {
        throw new Error('Start date must be in the future');
      }
      return true;
    }),
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      const startDate = new Date(req.body.startDate);
      const endDate = new Date(value);
      if (endDate <= startDate) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('numberOfGuests')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Number of guests must be between 1 and 20'),
  validate
];

/**
 * Vehicle creation/update validation rules
 */
const validateVehicle = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('type')
    .isIn(['rv', 'camper', 'motorhome', 'trailer', 'van'])
    .withMessage('Invalid vehicle type'),
  body('pricePerDay')
    .isFloat({ min: 1, max: 10000 })
    .withMessage('Price per day must be between $1 and $10,000'),
  body('capacity')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Capacity must be between 1 and 20'),
  body('location.address')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),
  body('location.city')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  body('location.state')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('State must be between 2 and 50 characters'),
  body('location.zipCode')
    .optional()
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage('Invalid zip code format'),
  body('images')
    .optional()
    .isArray({ min: 1, max: 10 })
    .withMessage('Must provide 1-10 images'),
  body('images.*')
    .optional()
    .isURL()
    .withMessage('Each image must be a valid URL'),
  validate
];

/**
 * Review validation rules
 */
const validateReview = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Comment must be between 10 and 1000 characters'),
  validate
];

/**
 * Payment intent validation
 */
const validatePaymentIntent = [
  body('vehicleId')
    .isMongoId()
    .withMessage('Invalid vehicle ID'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  body('numberOfGuests')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Number of guests must be between 1 and 20'),
  validate
];

/**
 * MongoDB ObjectId validation for params
 */
const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName}`),
  validate
];

/**
 * Host request validation
 */
const validateHostRequest = [
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters'),
  body('phone')
    .optional()
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('Invalid phone number format'),
  validate
];

/**
 * Cancellation validation
 */
const validateCancellation = [
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must be less than 500 characters'),
  validate
];

module.exports = {
  validate,
  validateBooking,
  validateVehicle,
  validateReview,
  validatePaymentIntent,
  validateObjectId,
  validateHostRequest,
  validateCancellation
};
