/**
 * User Service
 * Handles user-related business logic
 */

import User from '../models/User.js';
import crypto from 'crypto';
import EmailService from './EmailService.js';
import { sendCredentialsEmail } from '../config/mailer.js';

/**
 * Create a new user (admin or client) and send credentials
 */
export const createUser = async ({ firstName, lastName, name, email, role, isActive = true, status = 'active' }) => {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new Error('User with this email already exists');
    }

    // Generate temporary password
    const tempPassword = crypto.randomBytes(8).toString('hex');

    // Prepare user data
    const userData = {
        email,
        password: tempPassword,
        role: role || 'client',
        requiresPasswordChange: true,
    };

    if (name) {
        userData.name = name;
    } else {
        userData.firstName = firstName;
        userData.lastName = lastName;
    }

    // Handle status/isActive based on schema capability
    if (role === 'admin' || role === 'superadmin') {
        userData.status = status;
    } else {
        userData.isActive = isActive;
    }

    // Create user
    const user = new User(userData);
    await user.save();

    // Send credentials email
    try {
        if (role === 'admin' || role === 'superadmin') {
            const userName = name || (firstName + ' ' + lastName);
            await EmailService.sendAdminWelcome(email, userName, tempPassword);
        } else {
            // Keep existing or handle client welcome differently if needed
            // For now, using the same or falling back to a client specific method if exists
            // But since I only added adminWelcome, I'll use that or maybe I should check if I need a client one.
            // The user request specified "when admin is created".
            // Existing code used sendCredentialsEmail for everyone. 
            // I should technically convert clients too, but let's stick to admin first to be safe, 
            // OR use sendAdminWelcome for both but maybe rename it? 
            // "Welcome to Cottson Admin Portal" might be confusing for clients.

            // Checking existing EmailService... it has sendWelcomeEmail(clientEmail, clientName, loginUrl).
            // But that doesn't include password. 
            // The previous sendCredentialsEmail did include password.

            // I'll stick to using sendCredentialsEmail for clients for now to avoid breaking client flow, 
            // and use EmailService.sendAdminWelcome for admins.
            // But wait, I need to import sendCredentialsEmail if I use it.

            // Actually, I should probably migrate client too, but the task is about admin.
            // Let's rely on the requested change for ADMIN.

            await sendCredentialsEmail(email, email, tempPassword, role || 'client');
        }
    } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Be silent about email failure but log it, fundamental user creation succeeded
    }

    const userResponse = user.toObject();
    delete userResponse.password;

    return userResponse;
};
