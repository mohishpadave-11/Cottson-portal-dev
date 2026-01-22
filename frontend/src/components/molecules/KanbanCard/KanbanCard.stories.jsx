import KanbanCard from './KanbanCard';

const MOCK_ORDER_DATA = {
    _id: '1',
    orderNumber: '12345',
    orderDate: new Date().toISOString(),
    productId: { name: 'Premium Cotton Shirt' },
    companyId: { companyName: 'Acme Corp' },
    clientId: { name: 'John Doe' },
    expectedDelivery: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 days from now
    quantity: 500,
    paymentStatus: 'Payment Completed',
    timeline: 'Fabric Cutting',
};

const MOCK_ORDER_DELAYED = {
    ...MOCK_ORDER_DATA,
    _id: '2',
    orderNumber: '67890',
    expectedDelivery: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    timeline: 'Fabric Purchase',
    paymentStatus: 'Advance Payment',
};

export default {
    title: 'Molecules/KanbanCard',
    component: KanbanCard,
    parameters: {
        layout: 'centered',
    },
    decorators: [
        (Story) => (
            <div style={{ maxWidth: '300px' }}>
                <Story />
            </div>
        ),
    ],
    tags: ['autodocs'],
    argTypes: {
        onClick: { action: 'clicked' },
        onDragStart: { action: 'dragStart' },
        onDragEnd: { action: 'dragEnd' },
    },
};

export const Default = {
    args: {
        order: MOCK_ORDER_DATA,
    },
};

export const Delayed = {
    args: {
        order: MOCK_ORDER_DELAYED,
    },
};
