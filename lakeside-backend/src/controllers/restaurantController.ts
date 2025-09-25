import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { validateLoginData, normalizePhone } from '../utils/validation';
import { comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { AuthenticatedRequest } from '../types/auth';

const prisma = new PrismaClient();

/**
 * Restaurant Authentication Controller
 */
export const restaurantLogin = async (req: Request, res: Response) => {
  try {
    console.log('Restaurant login request:', req.body);
    const { phone, password } = req.body;

    // Validate input data
    const validation = validateLoginData({ phone, password });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
      });
    }

    // Normalize phone number
    const normalizedPhone = normalizePhone(phone);

    // Find restaurant user by phone
    const user = await prisma.user.findFirst({
      where: { 
        phone: normalizedPhone,
        role: 'RESTAURANT'
      },
      include: {
        restaurantProfile: true,
      },
    });

    if (!user || !user.restaurantProfile) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password',
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password',
      });
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Account is not active',
      });
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      phone: user.phone,
      role: user.role,
    });

    const response = {
      success: true,
      data: {
        token,
        restaurant: {
          id: user.restaurantProfile.id,
          name: user.restaurantProfile.name,
          address: user.restaurantProfile.address,
          lat: Number(user.restaurantProfile.lat),
          lng: Number(user.restaurantProfile.lng),
          logoUrl: user.restaurantProfile.logoUrl,
          bannerUrl: user.restaurantProfile.bannerUrl,
          rating: user.restaurantProfile.rating,
          totalOrders: user.restaurantProfile.totalOrders,
          description: user.restaurantProfile.description,
          commissionRate: Number(user.restaurantProfile.commissionRate),
          status: user.restaurantProfile.status,
        },
      },
    };

    console.log('Restaurant login successful for:', user.phone);
    res.json(response);
  } catch (error) {
    console.error('Restaurant login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login',
    });
  }
};

/**
 * Get Restaurant Profile
 */
export const getRestaurantProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        restaurantProfile: true,
      },
    });

    if (!user || !user.restaurantProfile) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant profile not found',
      });
    }

    res.json({
      success: true,
      data: {
        id: user.restaurantProfile.id,
        name: user.restaurantProfile.name,
        address: user.restaurantProfile.address,
        lat: Number(user.restaurantProfile.lat),
        lng: Number(user.restaurantProfile.lng),
        logoUrl: user.restaurantProfile.logoUrl,
        bannerUrl: user.restaurantProfile.bannerUrl,
        rating: user.restaurantProfile.rating,
        totalOrders: user.restaurantProfile.totalOrders,
        description: user.restaurantProfile.description,
        commissionRate: Number(user.restaurantProfile.commissionRate),
        status: user.restaurantProfile.status,
      },
    });
  } catch (error) {
    console.error('Get restaurant profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch restaurant profile',
    });
  }
};

/**
 * Update Restaurant Profile
 */
export const updateRestaurantProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name, address, description, logoUrl, bannerUrl, status, lat, lng } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurantProfile: true },
    });

    if (!user || !user.restaurantProfile) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant profile not found',
      });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (description !== undefined) updateData.description = description;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (bannerUrl !== undefined) updateData.bannerUrl = bannerUrl;
    if (status !== undefined) updateData.status = status;
    if (lat !== undefined) updateData.lat = lat;
    if (lng !== undefined) updateData.lng = lng;

    const updatedRestaurant = await prisma.restaurant.update({
      where: { id: user.restaurantProfile.id },
      data: updateData,
    });

    res.json({
      success: true,
      data: updatedRestaurant,
      message: 'Restaurant profile updated successfully',
    });
  } catch (error) {
    console.error('Update restaurant profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update restaurant profile',
    });
  }
};
