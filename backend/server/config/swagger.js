import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamic Server URL for Render
const getServerUrl = () => {
    if (process.env.RENDER_EXTERNAL_URL) {
        return process.env.RENDER_EXTERNAL_URL;
    }
    return 'http://localhost:5001';
};

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Cottoson Portal API',
            version: '1.0.0',
            description: 'API documentation for the Cottoson Portal CRM',
        },
        servers: [
            {
                url: getServerUrl(),
                description: process.env.RENDER_EXTERNAL_URL ? 'Production Server' : 'Development Server',
            },
            {
                url: 'http://localhost:5001',
                description: 'Local Development',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'User ID' },
                        name: { type: 'string', description: 'User Name' },
                        email: { type: 'string', format: 'email', description: 'User Email' },
                        role: { type: 'string', enum: ['superadmin', 'admin', 'client'], description: 'User Role' },
                    },
                },
                Order: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        orderNumber: { type: 'string' },
                        client: { type: 'string', description: 'Client ID' },
                        company: { type: 'string', description: 'Company ID' },
                        products: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    product: { type: 'string' },
                                    quantity: { type: 'number' },
                                    price: { type: 'number' },
                                },
                            },
                        },
                        totalAmount: { type: 'number' },
                        status: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string' },
                    },
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    // Use path.join to correctly resolve route files from this config directory
    // config is in server/config, routes are in server/routes. So go up one level then into routes.
    apis: [path.join(__dirname, '../routes/*.js')],
};

const specs = swaggerJsdoc(options);

export default specs;
