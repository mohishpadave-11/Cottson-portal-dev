
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './server/models/User.js';
import Client from './server/models/Client.js';
import Company from './server/models/Company.js';
import { updateUser } from './server/controllers/adminController.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/cotton-portal";

// Mock Response object
const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

const runVerification = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        // 1. Setup Data
        console.log("Setting up test data...");

        // Create Company
        const company = await Company.create({
            companyName: "Test Sync Company",
            tradeName: "TSC",
            gstNumber: "29AAAAA0000A1Z5",
            address: {
                street: "123 Test St",
                city: "Test City",
                state: "Test State",
                zipCode: "123456",
                country: "India"
            },
            contactPerson: {
                name: "Test Person",
                email: "test_contact@example.com",
                phone: "1234567890"
            }
        });

        // Create User (Client Role)
        const user = await User.create({
            firstName: "Test",
            lastName: "Client",
            email: "test_client_sync_old@example.com",
            password: "password123",
            role: "client",
            companyId: company._id,
            phoneNumber: "9876543210"
        });

        // Create Client
        const client = await Client.create({
            name: "Test Client",
            email: "test_client_sync_old@example.com",
            phoneNumber: "9876543210",
            companyId: company._id,
            userId: user._id
        });

        console.log(`Created User: ${user.email} (${user._id})`);
        console.log(`Created Client: ${client.email} (${client._id})`);

        // 2. Test adminController.updateUser
        console.log("\nTesting updateUser (User -> Client sync)...");

        const newEmail = "test_client_sync_new@example.com";
        const req = {
            params: { id: user._id },
            body: {
                email: newEmail,
                firstName: "TestUpdated"
            }
        };
        const res = mockRes();

        await updateUser(req, res);

        if (res.statusCode && res.statusCode !== 200) {
            console.error("Update failed:", res.data);
            throw new Error("Update User failed");
        }

        // 3. Verify Sync
        const updatedClient = await Client.findById(client._id);
        console.log(`Updated Client Email: ${updatedClient.email}`);

        if (updatedClient.email === newEmail) {
            console.log("✅ SUCCESS: Client email updated automatically!");
        } else {
            console.error("❌ FAILURE: Client email did NOT update.");
            console.log(`Expected: ${newEmail}, Found: ${updatedClient.email}`);
        }

        // Cleanup
        console.log("\nCleaning up...");
        await User.findByIdAndDelete(user._id);
        await Client.findByIdAndDelete(client._id);
        await Company.findByIdAndDelete(company._id);

    } catch (error) {
        console.error("Verification Error:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected");
    }
};

runVerification();
