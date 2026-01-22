import Button from './Button';

export default {
    title: 'Atoms/Button',
    component: Button,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['primary', 'secondary', 'danger', 'ghost'],
            description: 'The visual style of the button',
        },
        size: {
            control: 'radio',
            options: ['sm', 'md', 'lg'],
            description: 'The size of the button',
        },
        disabled: {
            control: 'boolean',
            description: 'Whether the button is disabled',
        },
        children: {
            control: 'text',
            description: 'Button label or content',
        },
        onClick: { action: 'clicked' },
    },
};

export const Primary = {
    args: {
        variant: 'primary',
        children: 'Primary Button',
    },
};

export const Secondary = {
    args: {
        variant: 'secondary',
        children: 'Secondary Button',
    },
};

export const Danger = {
    args: {
        variant: 'danger',
        children: 'Danger Button',
    },
};

export const Sizes = {
    render: () => (
        <div className="flex items-center gap-4">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
        </div>
    ),
};
