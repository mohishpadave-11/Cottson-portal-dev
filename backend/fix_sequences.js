import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const OrderSchema = new mongoose.Schema({
    orderNumber: String,
    sequence: Number
}, { strict: false });

const Order = mongoose.model('Order', OrderSchema);

async function migrate() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) throw new Error('MONGODB_URI not found in .env');

        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const orders = await Order.find({ sequence: { $exists: false } });
        console.log(`Found ${orders.length} orders missing sequence`);

        let updatedCount = 0;
        for (const order of orders) {
            if (order.orderNumber) {
                const parts = order.orderNumber.split('/');
                const lastPart = parts[parts.length - 1];
                const sequence = parseInt(lastPart);

                if (!isNaN(sequence)) {
                    order.sequence = sequence;
                    await order.save();
                    updatedCount++;
                    console.log(`Updated Order ${order.orderNumber} with sequence ${sequence}`);
                } else {
                    console.warn(`Could not parse sequence from orderNumber ${order.orderNumber}`);
                    // Fallback sequence if parsing fails
                    order.sequence = 0;
                    await order.save();
                    updatedCount++;
                }
            }
        }

        console.log(`Successfully migrated ${updatedCount} orders`);
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
