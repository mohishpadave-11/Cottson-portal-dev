/**
 * User Service
 * Handles user-related business logic
 */

import User from '../models/User.js';
import crypto from 'crypto';
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
        await sendCredentialsEmail(email, email, tempPassword, role || 'client');
    } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Be silent about email failure but log it, fundamental user creation succeeded
    }

    const userResponse = user.toObject();
    delete userResponse.password;

    return userResponse;
};
