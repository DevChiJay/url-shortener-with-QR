const { z } = require('zod');

// Schema for URL shortening requests
const urlSchema = z.object({
  url: z
    .string()
    .url({ message: 'Invalid URL format' })
    .min(1, { message: 'URL is required' })
    .max(2048, { message: 'URL is too long (max 2048 characters)' }),
  expirationDays: z
    .number()
    .int()
    .positive()
    .optional()
    .default(7) // Default to 7 days if not provided
});

// Middleware to validate URL input
const validateUrlInput = (req, res, next) => {
  try {
    // Validate request body against schema
    const result = urlSchema.safeParse(req.body);
    
    if (!result.success) {
      // Format error messages
      const formattedErrors = result.error.errors.map(error => ({
        path: error.path.join('.'),
        message: error.message
      }));
      
      return res.status(400).json({
        success: false,
        errors: formattedErrors
      });
    }
    
    // If validation passes, continue
    req.validatedData = result.data;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Validation error occurred',
      error: error.message
    });
  }
};

module.exports = {
  validateUrlInput
};
