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
                        _id: { type: 'string', description: 'User ID' },
                        email: { type: 'string', format: 'email', description: 'User Email' },
                        role: { type: 'string', enum: ['superadmin', 'admin', 'client'], description: 'User Role' },
                        status: { type: 'string', enum: ['active', 'inactive', 'suspended'], default: 'active' },
                        isActive: { type: 'boolean', default: true },
                        name: { type: 'string', description: 'Full Name' },
                        firstName: { type: 'string', description: 'First Name' },
                        lastName: { type: 'string', description: 'Last Name' },
                        phoneNumber: { type: 'string', description: 'Phone Number' },
                        companyId: { type: 'string', description: 'Company ID reference' },
                        department: { type: 'string', description: 'Department' },
                        profileImage: { type: 'string', description: 'Profile Image URL' },
                        avatar: { type: 'string', description: 'Avatar Initials' },
                        address: {
                            type: 'object',
                            properties: {
                                street: { type: 'string' },
                                city: { type: 'string' },
                                state: { type: 'string' },
                                zipCode: { type: 'string' },
                                country: { type: 'string' },
                            }
                        },
                        permissions: { type: 'array', items: { type: 'string' } },
                        lastLogin: { type: 'string', format: 'date-time' },
                        requiresPasswordChange: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Company: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', description: 'ID' },
                        companyName: { type: 'string', description: 'Company Name' },
                        tradeName: { type: 'string', description: 'Trade Name' },
                        gstNumber: { type: 'string', description: 'GST Number' },
                        billingAddress: { type: 'string' },
                        shippingAddresses: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    label: { type: 'string' },
                                    address: { type: 'string' }
                                }
                            }
                        },
                        companyId: { type: 'string', description: 'Readable Company ID' },
                        shortCode: { type: 'string', description: 'Company Short Code' },
                        status: { type: 'string', enum: ['active', 'inactive', 'suspended'] },
                        contactEmail: { type: 'string', format: 'email' },
                        contactPhone: { type: 'string' },
                        website: { type: 'string' },
                        bankDetails: {
                            type: 'object',
                            properties: {
                                accountHolder: { type: 'string' },
                                accountNumber: { type: 'string' },
                                bankName: { type: 'string' },
                                ifscCode: { type: 'string' }
                            }
                        },
                        notes: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    }
                },
                Client: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        name: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        phoneNumber: { type: 'string' },
                        companyId: { type: 'string', description: 'Company ID reference' },
                        userId: { type: 'string', description: 'User ID reference' },
                        status: { type: 'string', enum: ['active', 'inactive'] },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                Product: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        category: { type: 'string', enum: ["Apparel", "Accessories", "Home Textiles", "Corporate Gifts", "Other"] },
                        collectionId: { type: 'string', description: 'Collection ID reference' },
                        sku: { type: 'string' },
                        status: { type: 'string', enum: ["active", "inactive", "discontinued"] },
                        basePrice: { type: 'number' },
                        unit: { type: 'string', enum: ["piece", "meter", "kg", "box"] },
                        specifications: {
                            type: 'object',
                            properties: {
                                material: { type: 'string' },
                                color: { type: 'string' },
                                size: { type: 'string' },
                                weight: { type: 'string' }
                            }
                        },
                        imageUrl: { type: 'string' },
                        notes: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                Collection: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        status: { type: 'string', enum: ['active', 'inactive'] },
                        imageUrl: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                Complaint: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        orderId: { type: 'string', description: 'Order ID reference' },
                        clientId: { type: 'string' },
                        clientName: { type: 'string' },
                        clientEmail: { type: 'string', format: 'email' },
                        subject: { type: 'string' },
                        description: { type: 'string' },
                        priority: { type: 'string', enum: ['Low', 'Medium', 'High'] },
                        status: { type: 'string', enum: ['Open', 'In Progress', 'Resolved', 'Closed'] },
                        isReadByAdmin: { type: 'boolean' },
                        isReadByClient: { type: 'boolean' },
                        adminResponse: { type: 'string' },
                        resolvedAt: { type: 'string', format: 'date-time' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                Notification: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        recipient: { type: 'string', description: 'User ID reference' },
                        orderId: { type: 'string', description: 'Order ID reference' },
                        message: { type: 'string' },
                        type: { type: 'string', enum: ["document", "status_update", "general"] },
                        isRead: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                Settings: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        key: { type: 'string' },
                        value: { type: 'object', description: 'Mixed type value' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                Order: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        orderNumber: { type: 'string' },
                        sequence: { type: 'number' },
                        orderDate: { type: 'string', format: 'date-time' },
                        quantity: { type: 'number' },
                        price: { type: 'number' },
                        discount: { type: 'number' },
                        gstRate: { type: 'number' },
                        priceWithGst: { type: 'number' },
                        priceAfterDiscount: { type: 'number' },
                        customCharges: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    amount: { type: 'number' }
                                }
                            }
                        },
                        advancePercentage: { type: 'number' },
                        amountPaid: { type: 'number' },
                        payments: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    amount: { type: 'number' },
                                    date: { type: 'string', format: 'date-time' },
                                    type: { type: 'string' },
                                    notes: { type: 'string' }
                                }
                            }
                        },
                        paymentStatus: { type: 'string', enum: ["Advance Pending", "Balance Pending", "Full Settlement", "Cancelled"] },
                        orderStatus: { type: 'string', enum: ["Pending", "Confirmed", "In Progress", "Completed", "Cancelled"] },
                        companyId: { type: 'string', description: 'Company ID reference' },
                        clientId: { type: 'string', description: 'Client ID reference' },
                        productId: { type: 'string', description: 'Product ID reference' },
                        shippingAddress: { type: 'string' },
                        expectedDelivery: { type: 'string', format: 'date-time' },
                        actualDelivery: { type: 'string', format: 'date-time' },
                        delayDays: { type: 'number' },
                        deliveryStatus: { type: 'string', enum: ["On Time", "Delayed"] },
                        timeline: { type: 'string' },
                        timelineStages: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    stage: { type: 'string' },
                                    startDate: { type: 'string', format: 'date-time' },
                                    endDate: { type: 'string', format: 'date-time' },
                                    status: { type: 'string' }
                                }
                            }
                        },
                        documents: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    url: { type: 'string' },
                                    fileType: { type: 'string' }
                                }
                            }
                        },
                        createdBy: { type: 'string', description: 'User ID reference' },
                        notes: { type: 'string' },
                        internalNotes: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
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
    apis: [path.join(__dirname, '../routes/*.js')],
};

const specs = swaggerJsdoc(options);

export default specs;
