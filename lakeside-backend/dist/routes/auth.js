"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = __importDefault(require("../utils/database"));
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const validation_1 = require("../utils/validation");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
/**
 * POST /api/auth/register
 * Register a new customer or driver account
 */
router.post('/register', async (req, res) => {
    try {
        console.log('Registration request body:', req.body);
        const { name, phone, password, role, vehicleType, licenseNumber, vehicleRegistration } = req.body;
        // Validate input data
        const validation = (0, validation_1.validateRegistrationData)({ name, phone, password });
        console.log('Validation result:', validation);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors,
            });
        }
        // Validate password strength
        const passwordValidation = (0, password_1.validatePassword)(password);
        console.log('Password validation result:', passwordValidation);
        if (!passwordValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: passwordValidation.message,
            });
        }
        // Validate driver-specific fields if registering as driver
        if (role === 'DRIVER') {
            if (!vehicleType || !licenseNumber || !vehicleRegistration) {
                return res.status(400).json({
                    success: false,
                    message: 'Vehicle type, license number, and vehicle registration are required for drivers'
                });
            }
        }
        // Normalize phone number
        const normalizedPhone = (0, validation_1.normalizePhone)(phone);
        // Check if user already exists
        const existingUser = await database_1.default.user.findUnique({
            where: { phone: normalizedPhone },
        });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'An account with this phone number already exists',
            });
        }
        // Hash password
        const hashedPassword = await (0, password_1.hashPassword)(password);
        // Create user and related records in a transaction
        console.log('Creating user with data:', { name: name.trim(), phone: normalizedPhone, role: role || 'CUSTOMER' });
        const result = await database_1.default.$transaction(async (tx) => {
            // Create user
            const newUser = await tx.user.create({
                data: {
                    name: name.trim(),
                    phone: normalizedPhone,
                    passwordHash: hashedPassword,
                    role: role || 'CUSTOMER', // Use provided role or default to customer
                    status: role === 'DRIVER' ? 'PENDING' : 'ACTIVE' // Drivers need approval
                },
            });
            console.log('User created successfully:', newUser.id);
            if (role === 'DRIVER') {
                // Create driver profile
                await tx.driver.create({
                    data: {
                        id: newUser.id,
                        vehicleType: vehicleType,
                        licenseNumber: licenseNumber,
                        vehicleRegistration: vehicleRegistration,
                        approvalStatus: 'PENDING' // Drivers start as pending approval
                    }
                });
                // Create driver wallet
                await tx.driverWallet.create({
                    data: {
                        driverId: newUser.id,
                        balance: 0.00,
                        totalEarnings: 0.00,
                        collateralAmount: 0.00
                    }
                });
                console.log('Driver profile and wallet created successfully');
            }
            else {
                // Create loyalty record for customer
                await tx.loyalty.create({
                    data: {
                        customerId: newUser.id,
                        totalOrders: 0,
                        loyaltyPoints: 0,
                    },
                });
                // Create customer wallet
                await tx.customerWallet.create({
                    data: {
                        customerId: newUser.id,
                        balance: 0.00,
                        totalTopUps: 0.00,
                        totalSpent: 0.00
                    }
                });
                console.log('Customer loyalty and wallet created successfully');
            }
            return newUser;
        });
        // Generate JWT token
        const token = (0, jwt_1.generateToken)({
            id: result.id,
            phone: result.phone,
            role: result.role,
        });
        const response = {
            success: true,
            message: 'Account created successfully',
            user: {
                id: result.id,
                name: result.name,
                phone: result.phone,
                role: result.role,
                status: result.status,
            },
            token,
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during registration',
        });
    }
});
/**
 * POST /api/auth/login
 * Login with phone number and password
 */
router.post('/login', async (req, res) => {
    try {
        console.log('Login request body:', req.body);
        const { phone, password } = req.body;
        // Validate input data
        const validation = (0, validation_1.validateLoginData)({ phone, password });
        console.log('Login validation result:', validation);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors,
            });
        }
        // Normalize phone number
        const normalizedPhone = (0, validation_1.normalizePhone)(phone);
        // Find user by phone
        const user = await database_1.default.user.findUnique({
            where: { phone: normalizedPhone },
        });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid phone number or password',
            });
        }
        // Check if account is active
        if (user.status === 'BLOCKED') {
            return res.status(401).json({
                success: false,
                message: 'Account has been blocked. Please contact support.',
            });
        }
        if (user.status === 'PENDING') {
            return res.status(401).json({
                success: false,
                message: 'Account is pending activation. Please contact support.',
            });
        }
        // Verify password
        const isPasswordValid = await (0, password_1.comparePassword)(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid phone number or password',
            });
        }
        // Generate JWT token
        const token = (0, jwt_1.generateToken)({
            id: user.id,
            phone: user.phone,
            role: user.role,
        });
        const response = {
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                name: user.name,
                phone: user.phone,
                role: user.role,
                status: user.status,
            },
            token,
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during login',
        });
    }
});
/**
 * GET /api/auth/me
 * Get current user profile (requires authentication)
 */
router.get('/me', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
        }
        // Fetch user details from database
        const user = await database_1.default.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                name: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true,
            },
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        // If customer, include loyalty information
        let loyaltyInfo = null;
        if (user.role === 'CUSTOMER') {
            loyaltyInfo = await database_1.default.loyalty.findUnique({
                where: { customerId: user.id },
                select: {
                    totalOrders: true,
                    loyaltyPoints: true,
                    lastRewardedAt: true,
                },
            });
        }
        res.status(200).json({
            success: true,
            message: 'Profile retrieved successfully',
            user: {
                ...user,
                loyalty: loyaltyInfo,
            },
        });
    }
    catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching profile',
        });
    }
});
/**
 * POST /api/auth/logout
 * Logout (client-side token removal, server acknowledges)
 * For drivers, also sets them offline
 */
router.post('/logout', auth_1.authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        // If the user is a driver, set them offline
        if (user && user.role === 'DRIVER') {
            try {
                await database_1.default.$transaction(async (tx) => {
                    // Set driver offline in main table
                    await tx.driver.update({
                        where: { id: user.id },
                        data: {
                            isAvailable: false,
                            onlineAt: null
                        }
                    });
                    // Also update driver state if using hybrid system
                    await tx.driverState.upsert({
                        where: { driverId: user.id },
                        create: {
                            driverId: user.id,
                            isOnline: false,
                            lastHeartbeatAt: new Date(),
                            lastLocationUpdate: new Date()
                        },
                        update: {
                            isOnline: false,
                            lastHeartbeatAt: new Date(),
                            onlineSince: null,
                            lastLocationUpdate: new Date(),
                            updatedAt: new Date()
                        }
                    });
                });
                console.log(`🔴 Driver ${user.id} set offline due to logout`);
            }
            catch (error) {
                console.error('Failed to set driver offline on logout:', error);
                // Don't fail the logout if driver status update fails
            }
        }
        res.status(200).json({
            success: true,
            message: 'Logged out successfully',
        });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during logout',
        });
    }
});
/**
 * POST /api/auth/verify-token
 * Verify if token is still valid
 */
router.post('/verify-token', auth_1.authenticateToken, (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Token is valid',
        user: req.user,
    });
});
exports.default = router;
//# sourceMappingURL=auth.js.map