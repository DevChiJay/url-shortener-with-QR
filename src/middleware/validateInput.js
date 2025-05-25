const { z } = require('zod');

// Schema for URL shortening requests
const urlSchema = z.object({
  originalUrl: z
    .string()
    .url({ message: 'Invalid URL format' })
    .min(1, { message: 'URL is required' })
    .max(2048, { message: 'URL is too long (max 2048 characters)' }),
  description: z
    .string()
    .max(500, { message: 'Description cannot exceed 500 characters' })
    .optional(),
  customSlug: z
    .string()
    .max(255, { message: 'Custom slug is too long' })
    .optional(),
  expirationDays: z
    .number()
    .int()
    .positive()
    .optional()
    .default(7) // Default to 7 days if not provided
});

// Schema for user registration
const registerSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters long' })
    .max(100, { message: 'Name cannot exceed 100 characters' }),
  email: z
    .string()
    .email({ message: 'Invalid email format' })
    .min(1, { message: 'Email is required' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long' })
    .max(100, { message: 'Password cannot exceed 100 characters' }),
  rememberMe: z
    .boolean()
    .optional()
    .default(false)
});

// Schema for user login
const loginSchema = z.object({
  email: z
    .string()
    .email({ message: 'Invalid email format' })
    .min(1, { message: 'Email is required' }),
  password: z
    .string()
    .min(1, { message: 'Password is required' }),
  rememberMe: z
    .boolean()
    .optional()
    .default(false)
});

// Generic validation middleware
const validateWith = (schema) => (req, res, next) => {
  try {
    // Validate request body against schema
    const result = schema.safeParse(req.body);
    
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

// Middleware to validate URL input
const validateUrlInput = validateWith(urlSchema);

// Middleware to validate user registration input
const validateRegisterInput = validateWith(registerSchema);

// Middleware to validate user login input
const validateLoginInput = validateWith(loginSchema);

module.exports = {
  validateUrlInput,
  validateRegisterInput,
  validateLoginInput
};
