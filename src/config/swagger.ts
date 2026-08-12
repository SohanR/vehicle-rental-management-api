export const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Vehicle Rental Management API',
    version: '1.0.0',
    description: 'REST API for staff authentication, vehicle inventory, rentals, and reports.',
  },
  servers: [{ url: '/api/v1', description: 'Current server' }],
  tags: [{ name: 'Auth' }, { name: 'Vehicles' }, { name: 'Rentals' }, { name: 'Reports' }],
  paths: {
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Authenticate a staff member',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Authentication successful',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/vehicles': {
      get: {
        tags: ['Vehicles'],
        summary: 'List active vehicles',
        parameters: [
          {
            in: 'query',
            name: 'category',
            required: false,
            schema: { $ref: '#/components/schemas/VehicleCategory' },
          },
          {
            in: 'query',
            name: 'search',
            required: false,
            description: 'Optional case-insensitive search by vehicle name',
            schema: { type: 'string', minLength: 1, maxLength: 150 },
          },
          { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1, default: 1 } },
          {
            in: 'query',
            name: 'limit',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          },
        ],
        responses: {
          '200': {
            description: 'Vehicle list',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/VehicleListResponse' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Vehicles'],
        summary: 'Create a vehicle',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': { schema: { $ref: '#/components/schemas/VehicleCreateInput' } },
          },
        },
        responses: {
          '201': {
            description: 'Vehicle created',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/VehicleResponse' } },
            },
          },
          '409': { $ref: '#/components/responses/Conflict' },
          '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/vehicles/{id}': {
      parameters: [{ $ref: '#/components/parameters/ResourceId' }],
      get: {
        tags: ['Vehicles'],
        summary: 'Get a vehicle',
        responses: {
          '200': {
            description: 'Vehicle details',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/VehicleResponse' } },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Vehicles'],
        summary: 'Update a vehicle',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': { schema: { $ref: '#/components/schemas/VehicleUpdateInput' } },
          },
        },
        responses: {
          '200': { description: 'Vehicle updated' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Vehicles'],
        summary: 'Soft-delete a vehicle',
        responses: {
          '204': { description: 'Vehicle soft-deleted successfully; response has no body' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/rentals': {
      get: {
        tags: ['Rentals'],
        summary: 'List rentals',
        parameters: [
          { in: 'query', name: 'status', schema: { $ref: '#/components/schemas/RentalStatus' } },
          { in: 'query', name: 'vehicle_id', schema: { type: 'integer' } },
          { in: 'query', name: 'start_date', schema: { type: 'string', format: 'date' } },
          { in: 'query', name: 'end_date', schema: { type: 'string', format: 'date' } },
          { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1, default: 1 } },
          {
            in: 'query',
            name: 'limit',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          },
        ],
        responses: {
          '200': {
            description: 'Rental list',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RentalListResponse' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Rentals'],
        summary: 'Create a rental booking',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/RentalInput' } },
          },
        },
        responses: {
          '201': {
            description: 'Rental created',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/RentalResponse' } },
            },
          },
          '409': { $ref: '#/components/responses/Conflict' },
        },
      },
    },
    '/rentals/{id}': {
      parameters: [{ $ref: '#/components/parameters/ResourceId' }],
      get: {
        tags: ['Rentals'],
        summary: 'Get a rental',
        responses: {
          '200': {
            description: 'Rental details',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/RentalResponse' } },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Rentals'],
        summary: 'Update a rental',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/RentalInput' } },
          },
        },
        responses: {
          '200': { description: 'Rental updated' },
          '404': { $ref: '#/components/responses/NotFound' },
          '409': { $ref: '#/components/responses/Conflict' },
        },
      },
      delete: {
        tags: ['Rentals'],
        summary: 'Cancel a rental',
        responses: {
          '204': { description: 'Rental cancelled' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/reports/rentals': {
      get: {
        tags: ['Reports'],
        summary: 'Get monthly vehicle rental performance',
        parameters: [
          {
            in: 'query',
            name: 'month',
            required: true,
            schema: {
              type: 'string',
              pattern: '^\\d{4}-(0[1-9]|1[0-2])$',
              example: '2026-08',
            },
          },
          { in: 'query', name: 'vehicle_id', schema: { type: 'integer', minimum: 1 } },
        ],
        responses: {
          '200': {
            description: 'Monthly report generated',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ReportResponse' } },
            },
          },
          '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    parameters: {
      ResourceId: {
        in: 'path',
        name: 'id',
        required: true,
        schema: { type: 'integer', minimum: 1 },
      },
    },
    schemas: {
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@rental.local' },
          password: { type: 'string', format: 'password', example: 'Admin123!' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              token: { type: 'string' },
              tokenType: { type: 'string', example: 'Bearer' },
            },
          },
        },
      },
      VehicleCategory: {
        type: 'string',
        enum: [
          'Sedan',
          'SUV',
          'Hatchback',
          'Coupe',
          'Convertible',
          'Wagon',
          'Van',
          'Minivan',
          'Pickup',
          'Microbus',
        ],
      },
      VehicleCreateInput: {
        type: 'object',
        required: ['name', 'plate_number', 'category', 'daily_rate'],
        properties: {
          name: { type: 'string', example: 'Toyota Corolla 2024' },
          plate_number: { type: 'string', example: 'DHAKA-METRO-GA-11-1001' },
          category: { $ref: '#/components/schemas/VehicleCategory' },
          daily_rate: { type: 'number', format: 'double', minimum: 0, example: 4500 },
          photo: {
            type: 'string',
            format: 'binary',
            description: 'Optional JPEG, PNG, or WebP photo (maximum 5 MB)',
          },
        },
      },
      VehicleUpdateInput: {
        type: 'object',
        minProperties: 1,
        description: 'All fields are optional; send only the fields that should change.',
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 150 },
          plate_number: { type: 'string', minLength: 2, maxLength: 50 },
          category: { $ref: '#/components/schemas/VehicleCategory' },
          daily_rate: { type: 'number', format: 'double', exclusiveMinimum: 0 },
          photo: { type: 'string', format: 'binary' },
        },
      },
      Vehicle: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Toyota Corolla 2024' },
          plate_number: { type: 'string', example: 'DHAKA-METRO-GA-11-1001' },
          category: { $ref: '#/components/schemas/VehicleCategory' },
          daily_rate: { type: 'number', format: 'double', example: 4500 },
          photo_path: {
            type: 'string',
            nullable: true,
            description: 'Server-generated public path; null when no photo was uploaded',
          },
          deleted_at: { type: 'string', format: 'date-time', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      RentalStatus: { type: 'string', enum: ['booked', 'ongoing', 'completed', 'cancelled'] },
      RentalInput: {
        type: 'object',
        required: ['vehicle_id', 'customer_name', 'customer_phone', 'start_date', 'end_date'],
        properties: {
          vehicle_id: { type: 'integer', example: 1 },
          customer_name: { type: 'string', example: 'Aminul Islam' },
          customer_phone: { type: 'string', example: '+8801711000001' },
          start_date: { type: 'string', format: 'date', example: '2026-07-29' },
          end_date: { type: 'string', format: 'date', example: '2026-08-03' },
          status: { $ref: '#/components/schemas/RentalStatus' },
        },
      },
      Rental: {
        allOf: [
          { $ref: '#/components/schemas/RentalInput' },
          {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              total_amount: { type: 'number', format: 'double', example: 27000 },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
            },
          },
        ],
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          pages: { type: 'integer' },
        },
      },
      VehicleResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { $ref: '#/components/schemas/Vehicle' },
        },
      },
      VehicleListResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { type: 'array', items: { $ref: '#/components/schemas/Vehicle' } },
          pagination: { $ref: '#/components/schemas/Pagination' },
        },
      },
      RentalResponse: {
        type: 'object',
        properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Rental' } },
      },
      RentalListResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { type: 'array', items: { $ref: '#/components/schemas/Rental' } },
          pagination: { $ref: '#/components/schemas/Pagination' },
        },
      },
      ReportResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              month: { type: 'string', example: '2026-08' },
              vehicles: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    name: { type: 'string' },
                    total_bookings: { type: 'integer' },
                    days_rented: { type: 'integer' },
                    revenue: { type: 'number' },
                  },
                },
              },
              metadata: { type: 'object' },
            },
          },
        },
      },
      Error: {
        type: 'object',
        required: ['success', 'error'],
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            required: ['message', 'code'],
            properties: {
              message: { type: 'string' },
              code: { type: 'string' },
              details: { nullable: true },
            },
          },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Authentication failed',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      NotFound: {
        description: 'Resource not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Conflict: {
        description: 'Resource conflict',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      ValidationError: {
        description: 'Validation failed',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
    },
  },
  security: [{ bearerAuth: [] }],
} as const;
