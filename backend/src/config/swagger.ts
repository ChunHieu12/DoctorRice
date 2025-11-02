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

