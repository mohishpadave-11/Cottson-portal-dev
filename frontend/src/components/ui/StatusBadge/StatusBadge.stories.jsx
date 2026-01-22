import StatusBadge from './StatusBadge';

export default {
    title: 'Atoms/StatusBadge',
    component: StatusBadge,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        status: {
            control: 'text',
            description: 'The status value (case-insensitive)',
        },
        label: {
            control: 'text',
            description: 'Optional custom label',
        },
    },
};

export const Default = {
    args: {
        status: 'Pending',
    },
};

export const ProductActive = {
    args: {
        status: 'active',
    },
};

export const ProductInactive = {
    args: {
        status: 'inactive',
    },
};

const statuses = [
    'Pending',
    'Processing',
    'Shipped',
    'Delivered',
    'Cancelled',
    'Order Confirmed',
    'Fabric Purchase',
    'Fabric Cutting',
    'Embroidery/Printing',
    'Stitching',
    'Packing',
    'Order Completed',
];

export const AllVariants = {
    render: () => (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-white">
            {statuses.map((status) => (
                <div key={status} className="flex flex-col items-center p-2 border border-gray-100 rounded">
                    <span className="text-xs text-gray-500 mb-2">{status}</span>
                    <StatusBadge status={status} />
                </div>
            ))}
        </div>
    ),
};
