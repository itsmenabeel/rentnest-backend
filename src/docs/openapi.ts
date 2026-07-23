/**
 * Complete OpenAPI 3.0 specification for the RentNest API.
 * Served via swagger-ui-express at GET /api/docs (see src/app.ts).
 *
 * This is hand-authored rather than parsed from JSDoc comments so that every
 * route stays documented in one place, in sync with the actual zod schemas
 * and service return shapes.
 */

const ApiErrorResponse = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: false },
    message: { type: 'string', example: 'Validation failed' },
    errorDetails: {
      nullable: true,
      example: [{ path: 'email', message: 'Invalid email address' }],
    },
  },
};

const PaginationMeta = {
  type: 'object',
  properties: {
    page: { type: 'integer', example: 1 },
    limit: { type: 'integer', example: 10 },
    total: { type: 'integer', example: 42 },
    totalPages: { type: 'integer', example: 5 },
  },
};

const User = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string', example: 'Jane Doe' },
    email: { type: 'string', format: 'email' },
    phone: { type: 'string', nullable: true },
    role: { type: 'string', enum: ['TENANT', 'LANDLORD', 'ADMIN'] },
    status: { type: 'string', enum: ['ACTIVE', 'BANNED'] },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const Category = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string', example: 'Apartment' },
  },
};

const Property = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    title: { type: 'string' },
    description: { type: 'string' },
    location: { type: 'string' },
    price: { type: 'number', format: 'decimal', example: 15000 },
    amenities: { type: 'array', items: { type: 'string' }, example: ['WiFi', 'Parking'] },
    images: { type: 'array', items: { type: 'string', format: 'uri' } },
    isAvailable: { type: 'boolean' },
    landlordId: { type: 'string', format: 'uuid' },
    categoryId: { type: 'string', format: 'uuid' },
    category: Category,
    landlord: User,
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const RentalRequest = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    status: {
      type: 'string',
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'COMPLETED', 'CANCELLED'],
    },
    moveInDate: { type: 'string', format: 'date-time', nullable: true },
    message: { type: 'string', nullable: true },
    tenantId: { type: 'string', format: 'uuid' },
    propertyId: { type: 'string', format: 'uuid' },
    tenant: User,
    property: Property,
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const Payment = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    transactionId: { type: 'string' },
    amount: { type: 'number', format: 'decimal' },
    provider: { type: 'string', enum: ['SSLCOMMERZ'] },
    status: { type: 'string', enum: ['PENDING', 'COMPLETED', 'FAILED'] },
    paidAt: { type: 'string', format: 'date-time', nullable: true },
    rentalRequestId: { type: 'string', format: 'uuid' },
    createdAt: { type: 'string', format: 'date-time' },
  },
};

const Review = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    rating: { type: 'integer', minimum: 1, maximum: 5 },
    comment: { type: 'string', nullable: true },
    tenantId: { type: 'string', format: 'uuid' },
    propertyId: { type: 'string', format: 'uuid' },
    rentalRequestId: { type: 'string', format: 'uuid' },
    createdAt: { type: 'string', format: 'date-time' },
  },
};

function success(dataSchema?: object, message = 'Request successful') {
  return {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: message },
      ...(dataSchema ? { data: dataSchema } : {}),
    },
  };
}

const paginated = (itemsKey: string, itemSchema: object) => ({
  type: 'object',
  properties: {
    meta: PaginationMeta,
    [itemsKey]: { type: 'array', items: itemSchema },
  },
});

const errorResponses = {
  400: { description: 'Validation error', content: { 'application/json': { schema: ApiErrorResponse } } },
  401: { description: 'Missing or invalid token', content: { 'application/json': { schema: ApiErrorResponse } } },
  403: { description: 'Forbidden — insufficient role or ownership', content: { 'application/json': { schema: ApiErrorResponse } } },
  404: { description: 'Not found', content: { 'application/json': { schema: ApiErrorResponse } } },
  409: { description: 'Conflict', content: { 'application/json': { schema: ApiErrorResponse } } },
};

const bearerAuth = [{ bearerAuth: [] }];

const pageParam = { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } };
const limitParam = { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 } };

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'RentNest API',
    version: '1.0.0',
    description:
      'Rental property marketplace API. Roles: TENANT, LANDLORD, ADMIN. All authenticated ' +
      'endpoints expect `Authorization: Bearer <token>`.',
  },
  servers: [{ url: '/api', description: 'API base path' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: { User, Category, Property, RentalRequest, Payment, Review, ApiErrorResponse, PaginationMeta },
  },
  tags: [
    { name: 'Health' },
    { name: 'Auth' },
    { name: 'Categories' },
    { name: 'Properties' },
    { name: 'Landlord Properties' },
    { name: 'Rentals' },
    { name: 'Landlord Rentals' },
    { name: 'Payments' },
    { name: 'Reviews' },
    { name: 'Admin' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: { 200: { description: 'API is running' } },
      },
    },

    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new tenant or landlord',
        description: 'ADMIN is not a selectable role here — admin accounts are seed-only.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password', 'role'],
                properties: {
                  name: { type: 'string', minLength: 2 },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 },
                  phone: { type: 'string' },
                  role: { type: 'string', enum: ['TENANT', 'LANDLORD'] },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Account created',
            content: {
              'application/json': {
                schema: success({
                  type: 'object',
                  properties: { user: User, token: { type: 'string' } },
                }),
              },
            },
          },
          400: errorResponses[400],
          409: errorResponses[409],
        },
      },
    },

    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Logged in',
            content: {
              'application/json': {
                schema: success({
                  type: 'object',
                  properties: { user: User, token: { type: 'string' } },
                }),
              },
            },
          },
          400: errorResponses[400],
          401: errorResponses[401],
          403: errorResponses[403],
        },
      },
    },

    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get the current authenticated user',
        security: bearerAuth,
        responses: {
          200: {
            description: 'Current user',
            content: { 'application/json': { schema: success(User) } },
          },
          401: errorResponses[401],
        },
      },
    },

    '/categories': {
      get: {
        tags: ['Categories'],
        summary: 'List all categories (public)',
        responses: {
          200: {
            description: 'Categories',
            content: {
              'application/json': { schema: success({ type: 'array', items: Category }) },
            },
          },
        },
      },
    },

    '/properties': {
      get: {
        tags: ['Properties'],
        summary: 'Browse properties (public)',
        parameters: [
          { name: 'location', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Matches title, description, or location' },
          { name: 'categoryId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'minPrice', in: 'query', schema: { type: 'number' } },
          { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
          { name: 'isAvailable', in: 'query', schema: { type: 'boolean' }, description: 'Defaults to true' },
          pageParam,
          limitParam,
        ],
        responses: {
          200: {
            description: 'Paginated properties',
            content: {
              'application/json': { schema: success(paginated('properties', Property)) },
            },
          },
          400: errorResponses[400],
        },
      },
    },

    '/properties/{id}': {
      get: {
        tags: ['Properties'],
        summary: 'Get a single property (public)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Property', content: { 'application/json': { schema: success(Property) } } },
          404: errorResponses[404],
        },
      },
    },

    '/landlord/properties': {
      post: {
        tags: ['Landlord Properties'],
        summary: 'Create a property listing',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['title', 'description', 'location', 'price', 'categoryId'],
                properties: {
                  title: { type: 'string', minLength: 3 },
                  description: { type: 'string', minLength: 10 },
                  location: { type: 'string' },
                  price: { type: 'number' },
                  categoryId: { type: 'string', format: 'uuid' },
                  amenities: { type: 'string', description: 'Comma-separated or JSON array string' },
                  images: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                    description: 'Up to 8 image files, field name "images"',
                  },
                  isAvailable: { type: 'boolean', default: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Property created', content: { 'application/json': { schema: success(Property) } } },
          400: errorResponses[400],
          401: errorResponses[401],
          403: errorResponses[403],
        },
      },
    },

    '/landlord/properties/{id}': {
      put: {
        tags: ['Landlord Properties'],
        summary: "Update a property (must be the owning landlord)",
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: { type: 'object', description: 'All fields optional; same shape as create' },
            },
          },
        },
        responses: {
          200: { description: 'Property updated', content: { 'application/json': { schema: success(Property) } } },
          400: errorResponses[400],
          401: errorResponses[401],
          403: errorResponses[403],
          404: errorResponses[404],
        },
      },
      delete: {
        tags: ['Landlord Properties'],
        summary: 'Delete a property (blocked if it has rental requests)',
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Property deleted' },
          400: errorResponses[400],
          401: errorResponses[401],
          403: errorResponses[403],
          404: errorResponses[404],
        },
      },
    },

    '/rentals': {
      post: {
        tags: ['Rentals'],
        summary: 'Submit a rental request',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['propertyId'],
                properties: {
                  propertyId: { type: 'string', format: 'uuid' },
                  moveInDate: { type: 'string', format: 'date-time' },
                  message: { type: 'string', maxLength: 1000 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Rental request created', content: { 'application/json': { schema: success(RentalRequest) } } },
          400: errorResponses[400],
          401: errorResponses[401],
          403: errorResponses[403],
          404: errorResponses[404],
          409: errorResponses[409],
        },
      },
      get: {
        tags: ['Rentals'],
        summary: "List the caller's rental requests (tenant sees own, landlord sees requests on their properties)",
        security: bearerAuth,
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'COMPLETED', 'CANCELLED'] } },
          pageParam,
          limitParam,
        ],
        responses: {
          200: { description: 'Paginated rental requests', content: { 'application/json': { schema: success(paginated('rentals', RentalRequest)) } } },
          401: errorResponses[401],
        },
      },
    },

    '/rentals/{id}': {
      get: {
        tags: ['Rentals'],
        summary: 'Get a rental request (tenant or landlord on the property only)',
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Rental request', content: { 'application/json': { schema: success(RentalRequest) } } },
          401: errorResponses[401],
          403: errorResponses[403],
          404: errorResponses[404],
        },
      },
    },

    '/landlord/requests': {
      get: {
        tags: ['Landlord Rentals'],
        summary: 'List rental requests for the landlord\'s own properties',
        security: bearerAuth,
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'COMPLETED', 'CANCELLED'] } },
          pageParam,
          limitParam,
        ],
        responses: {
          200: { description: 'Paginated rental requests', content: { 'application/json': { schema: success(paginated('rentals', RentalRequest)) } } },
          401: errorResponses[401],
          403: errorResponses[403],
        },
      },
    },

    '/landlord/requests/{id}': {
      patch: {
        tags: ['Landlord Rentals'],
        summary: 'Approve or reject a pending rental request',
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: { status: { type: 'string', enum: ['APPROVED', 'REJECTED'] } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Status updated', content: { 'application/json': { schema: success(RentalRequest) } } },
          400: errorResponses[400],
          401: errorResponses[401],
          403: errorResponses[403],
          404: errorResponses[404],
        },
      },
    },

    '/payments/create': {
      post: {
        tags: ['Payments'],
        summary: 'Create an SSLCommerz payment session for an approved rental request',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['rentalRequestId'],
                properties: { rentalRequestId: { type: 'string', format: 'uuid' } },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Payment session created — returns SSLCommerz GatewayPageURL',
            content: { 'application/json': { schema: success({ type: 'object', properties: { payment: Payment, gatewayUrl: { type: 'string' } } }) } },
          },
          400: errorResponses[400],
          401: errorResponses[401],
          403: errorResponses[403],
          404: errorResponses[404],
        },
      },
    },

    '/payments/confirm': {
      post: {
        tags: ['Payments'],
        summary: 'SSLCommerz success/fail/cancel redirect handler',
        description: 'Public — called by SSLCommerz, not by the frontend directly.',
        requestBody: {
          content: {
            'application/x-www-form-urlencoded': {
              schema: {
                type: 'object',
                required: ['val_id'],
                properties: { val_id: { type: 'string' }, tran_id: { type: 'string' } },
              },
            },
          },
        },
        responses: { 200: { description: 'Confirmation processed', content: { 'application/json': { schema: success(Payment) } } }, 400: errorResponses[400] },
      },
    },

    '/payments/ipn': {
      post: {
        tags: ['Payments'],
        summary: 'SSLCommerz Instant Payment Notification webhook',
        description: 'Public — server-to-server callback from SSLCommerz.',
        requestBody: {
          content: {
            'application/x-www-form-urlencoded': {
              schema: {
                type: 'object',
                required: ['val_id', 'tran_id'],
                properties: {
                  val_id: { type: 'string' },
                  tran_id: { type: 'string' },
                  status: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'IPN processed', content: { 'application/json': { schema: success(Payment) } } }, 400: errorResponses[400] },
      },
    },

    '/payments': {
      get: {
        tags: ['Payments'],
        summary: "Get the tenant's own payment history",
        security: bearerAuth,
        responses: {
          200: { description: 'Payment history', content: { 'application/json': { schema: success({ type: 'array', items: Payment }) } } },
          401: errorResponses[401],
          403: errorResponses[403],
        },
      },
    },

    '/payments/{id}': {
      get: {
        tags: ['Payments'],
        summary: 'Get a single payment (owning tenant, the property\'s landlord, or admin)',
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Payment', content: { 'application/json': { schema: success(Payment) } } },
          401: errorResponses[401],
          403: errorResponses[403],
          404: errorResponses[404],
        },
      },
    },

    '/reviews': {
      post: {
        tags: ['Reviews'],
        summary: 'Submit a review for a completed rental request',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['rentalRequestId', 'rating'],
                properties: {
                  rentalRequestId: { type: 'string', format: 'uuid' },
                  rating: { type: 'integer', minimum: 1, maximum: 5 },
                  comment: { type: 'string', maxLength: 1000 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Review created', content: { 'application/json': { schema: success(Review) } } },
          400: errorResponses[400],
          401: errorResponses[401],
          403: errorResponses[403],
          404: errorResponses[404],
          409: errorResponses[409],
        },
      },
    },

    '/reviews/property/{propertyId}': {
      get: {
        tags: ['Reviews'],
        summary: 'List reviews for a property (public), includes average rating',
        parameters: [
          { name: 'propertyId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          pageParam,
          limitParam,
        ],
        responses: {
          200: {
            description: 'Paginated reviews',
            content: {
              'application/json': {
                schema: success({
                  type: 'object',
                  properties: {
                    meta: {
                      allOf: [
                        PaginationMeta,
                        { type: 'object', properties: { averageRating: { type: 'number', nullable: true } } },
                      ],
                    },
                    reviews: { type: 'array', items: Review },
                  },
                }),
              },
            },
          },
          404: errorResponses[404],
        },
      },
    },

    '/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'List all users',
        security: bearerAuth,
        parameters: [
          { name: 'role', in: 'query', schema: { type: 'string', enum: ['TENANT', 'LANDLORD', 'ADMIN'] } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['ACTIVE', 'BANNED'] } },
          pageParam,
          limitParam,
        ],
        responses: {
          200: { description: 'Paginated users', content: { 'application/json': { schema: success(paginated('users', User)) } } },
          401: errorResponses[401],
          403: errorResponses[403],
        },
      },
    },

    '/admin/users/{id}': {
      patch: {
        tags: ['Admin'],
        summary: "Ban or unban a user (ADMIN accounts can't be targeted)",
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['ACTIVE', 'BANNED'] } } },
            },
          },
        },
        responses: {
          200: { description: 'Status updated', content: { 'application/json': { schema: success(User) } } },
          400: errorResponses[400],
          401: errorResponses[401],
          403: errorResponses[403],
          404: errorResponses[404],
        },
      },
    },

    '/admin/properties': {
      get: {
        tags: ['Admin'],
        summary: 'List all properties platform-wide',
        security: bearerAuth,
        parameters: [
          { name: 'categoryId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'isAvailable', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } },
          pageParam,
          limitParam,
        ],
        responses: {
          200: { description: 'Paginated properties', content: { 'application/json': { schema: success(paginated('properties', Property)) } } },
          401: errorResponses[401],
          403: errorResponses[403],
        },
      },
    },

    '/admin/rentals': {
      get: {
        tags: ['Admin'],
        summary: 'List all rental requests platform-wide',
        security: bearerAuth,
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'COMPLETED', 'CANCELLED'] } },
          pageParam,
          limitParam,
        ],
        responses: {
          200: { description: 'Paginated rental requests', content: { 'application/json': { schema: success(paginated('rentals', RentalRequest)) } } },
          401: errorResponses[401],
          403: errorResponses[403],
        },
      },
    },

    '/admin/categories': {
      post: {
        tags: ['Admin'],
        summary: 'Create a category',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['name'], properties: { name: { type: 'string', minLength: 2 } } },
            },
          },
        },
        responses: {
          201: { description: 'Category created', content: { 'application/json': { schema: success(Category) } } },
          400: errorResponses[400],
          401: errorResponses[401],
          403: errorResponses[403],
          409: errorResponses[409],
        },
      },
    },

    '/admin/categories/{id}': {
      put: {
        tags: ['Admin'],
        summary: 'Rename a category',
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['name'], properties: { name: { type: 'string', minLength: 2 } } },
            },
          },
        },
        responses: {
          200: { description: 'Category updated', content: { 'application/json': { schema: success(Category) } } },
          400: errorResponses[400],
          401: errorResponses[401],
          403: errorResponses[403],
          404: errorResponses[404],
        },
      },
      delete: {
        tags: ['Admin'],
        summary: 'Delete a category (blocked if any property still references it)',
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Category deleted' },
          400: errorResponses[400],
          401: errorResponses[401],
          403: errorResponses[403],
          404: errorResponses[404],
        },
      },
    },
  },
};
