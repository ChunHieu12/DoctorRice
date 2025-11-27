import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Bác sĩ Lúa API',
      version: '1.0.0',
      description: `REST API for DoctorRice app - AI-powered rice disease detection with GPS watermarking
      
**Features:**
- 📸 Photo upload with GPS metadata
- 🤖 AI disease detection (4 classes: Bacterial Leaf Blight, Blast, Brown Spot, Healthy)
- 🗺️ GPS watermarking via Cloudinary
- 📊 Photo statistics and analytics
- 🗃️ Photo management (CRUD operations)

**AI Service:** https://doctorrice-ai-service.onrender.com`,
      contact: {
        name: 'DoctorRice Team',
        email: 'support@doctorrice.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server (Local)',
      },
      {
        url: 'https://doctorrice.onrender.com',
        description: 'Production server (Render)',
      },
    ],
    externalDocs: {
      description: 'AI Service API',
      url: 'https://doctorrice-ai-service.onrender.com',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Firebase JWT token from authentication',
        },
      },
      schemas: {
        // Photo Schemas
        PhotoMetadata: {
          type: 'object',
          properties: {
            lat: {
              type: 'number',
              description: 'Latitude coordinate',
              example: 10.825123,
              minimum: -90,
              maximum: 90,
            },
            lng: {
              type: 'number',
              description: 'Longitude coordinate',
              example: 106.629456,
              minimum: -180,
              maximum: 180,
            },
            timestamp: {
              type: 'number',
              description: 'Unix timestamp when photo was captured',
              example: 1699234567890,
            },
            device: {
              type: 'string',
              description: 'Device type',
              example: 'Android',
            },
            orientation: {
              type: 'string',
              enum: ['portrait', 'landscape'],
              description: 'Photo orientation',
              example: 'portrait',
            },
            address: {
              type: 'string',
              description: 'Reverse geocoded address from GPS coordinates',
              example: '123 Nguyen Hue, District 1, Ho Chi Minh City, Vietnam',
            },
          },
          required: ['lat', 'lng', 'timestamp', 'device'],
        },
        Prediction: {
          type: 'object',
          properties: {
            class: {
              type: 'string',
              enum: ['bacterial_leaf_blight', 'blast', 'brown_spot', 'healthy'],
              description: 'Disease class (English)',
              example: 'blast',
            },
            classVi: {
              type: 'string',
              description: 'Disease class (Vietnamese)',
              example: 'Bệnh đạo ôn',
            },
            confidence: {
              type: 'number',
              description: 'Prediction confidence percentage',
              example: 87.5,
              minimum: 0,
              maximum: 100,
            },
            allPredictions: {
              type: 'object',
              description: 'All class predictions with confidence scores',
              example: {
                bacterial_leaf_blight: 2.3,
                blast: 87.5,
                brown_spot: 8.1,
                healthy: 2.1,
              },
            },
          },
        },
        Photo: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'MongoDB ObjectId',
              example: '67890abcdef1234567890abc',
            },
            userId: {
              type: 'string',
              description: 'User ID (Firebase UID)',
              example: 'yTxXUSC5DLbB6JS6ckmZzV2kLZG2',
            },
            originalUrl: {
              type: 'string',
              description: 'Cloudinary URL of original image',
              example: 'https://res.cloudinary.com/doivrdij4/image/upload/v123/doctorrice/originals/photo.jpg',
            },
            watermarkedUrl: {
              type: 'string',
              description: 'Cloudinary URL with GPS watermark',
              example: 'https://res.cloudinary.com/doivrdij4/image/upload/l_text:Arial_32:Lat%3A%2010.825/photo.jpg',
            },
            thumbnailUrl: {
              type: 'string',
              description: 'Thumbnail URL (200x200px)',
              example: 'https://res.cloudinary.com/doivrdij4/image/upload/w_200,h_200,c_fill/photo.jpg',
            },
            cloudinaryPublicId: {
              type: 'string',
              description: 'Cloudinary public ID for transformations',
              example: 'doctorrice/photos/photo_user123_1699234567890',
            },
            metadata: {
              $ref: '#/components/schemas/PhotoMetadata',
            },
            prediction: {
              $ref: '#/components/schemas/Prediction',
            },
            status: {
              type: 'string',
              enum: ['processing', 'completed', 'failed'],
              description: 'Processing status',
              example: 'completed',
            },
            fileSize: {
              type: 'number',
              description: 'File size in bytes',
              example: 245678,
            },
            errorMessage: {
              type: 'string',
              description: 'Error message if status is failed',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
              example: '2024-11-06T12:30:00.000Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
              example: '2024-11-06T12:30:05.000Z',
            },
          },
        },
        MapMarker: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Photo ID',
              example: '67890abcdef1234567890abc',
            },
            latitude: {
              type: 'number',
              example: 10.825123,
            },
            longitude: {
              type: 'number',
              example: 106.629456,
            },
            thumbnail: {
              type: 'string',
              description: 'Thumbnail URL for marker icon',
            },
            image: {
              type: 'string',
              description: 'Full image URL',
            },
            prediction: {
              $ref: '#/components/schemas/Prediction',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        PhotoStats: {
          type: 'object',
          properties: {
            total: {
              type: 'number',
              description: 'Total photos count',
              example: 50,
            },
            completed: {
              type: 'number',
              description: 'Successfully processed photos',
              example: 48,
            },
            processing: {
              type: 'number',
              description: 'Photos currently processing',
              example: 1,
            },
            failed: {
              type: 'number',
              description: 'Failed processing photos',
              example: 1,
            },
            diseases: {
              type: 'object',
              properties: {
                bacterial_leaf_blight: {
                  type: 'number',
                  example: 5,
                },
                blast: {
                  type: 'number',
                  example: 12,
                },
                brown_spot: {
                  type: 'number',
                  example: 8,
                },
                healthy: {
                  type: 'number',
                  example: 23,
                },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'PHOTO_002',
                },
                message: {
                  type: 'string',
                  example: 'No file uploaded',
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/models/*.ts'], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);

