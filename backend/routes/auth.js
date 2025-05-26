const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { signupValidation, signinValidation } = require('../middleware/validators');
const upload = require('../middleware/upload');

// TODO: Implement rate limiting for auth routes to prevent brute force attacks
// TODO: Add password reset functionality
// TODO: Add email verification system
// TODO: Implement refresh token mechanism
// TODO: Add session management for multiple device support

// Helper function to delete uploaded file
const deleteUploadedFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               profilePhoto:
 *                 type: string
 *                 format: binary
 *               githubUrl:
 *                 type: string
 *               country:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/signup', upload.single('profilePhoto'), async (req, res) => {
  try {
    // TODO: Add email verification before allowing signup
    // TODO: Implement password strength validation
    // TODO: Add CAPTCHA for bot prevention
    // TODO: Implement social media signup options

    // First validate the input
    const validationErrors = [];
    const { firstName, lastName, email, password, githubUrl, country } = req.body;

    // Basic validation
    if (!firstName || firstName.length < 2) {
      validationErrors.push({ field: 'firstName', message: 'First name must be at least 2 characters long' });
    }
    if (!lastName || lastName.length < 2) {
      validationErrors.push({ field: 'lastName', message: 'Last name must be at least 2 characters long' });
    }
    if (!email || !email.includes('@')) {
      validationErrors.push({ field: 'email', message: 'Please enter a valid email address' });
    }
    if (!password || password.length < 8) {
      validationErrors.push({ field: 'password', message: 'Password must be at least 8 characters long' });
    }

    // If there are validation errors, delete the uploaded file and return errors
    if (validationErrors.length > 0) {
      if (req.file) {
        deleteUploadedFile(req.file.path);
      }
      return res.status(400).json({ errors: validationErrors });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (req.file) {
        deleteUploadedFile(req.file.path);
      }
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Handle profile photo
    let profilePhotoPath = '';
    if (req.file) {
      const relativePath = path.join('uploads', 'profile-photos', email, req.file.filename);
      profilePhotoPath = relativePath.replace(/\\/g, '/');
    }

    // TODO: Add email verification token generation
    // TODO: Send welcome email to new users
    // TODO: Implement referral system if needed

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      profilePhoto: profilePhotoPath,
      githubUrl,
      country
    });

    try {
      await user.save();
    } catch (error) {
      // If user creation fails, delete the uploaded file
      if (req.file) {
        deleteUploadedFile(req.file.path);
      }
      throw error;
    }

    // TODO: Implement refresh token generation
    // TODO: Add user preferences initialization
    // TODO: Set up user activity tracking

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profilePhoto: user.profilePhoto,
        githubUrl: user.githubUrl,
        country: user.country,
        joinDate: user.joinDate
      }
    });
  } catch (error) {
    // TODO: Implement proper error logging system
    // TODO: Add error tracking service integration
    console.error('Signup error:', error);
    res.status(400).json({ 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * @swagger
 * /auth/signin:
 *   post:
 *     summary: Sign in user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sign in successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/signin', signinValidation, async (req, res) => {
  try {
    // TODO: Implement login attempt tracking
    // TODO: Add 2FA support
    // TODO: Implement remember me functionality
    // TODO: Add device fingerprinting

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // TODO: Update last login timestamp
    // TODO: Track login location
    // TODO: Implement session management
    // TODO: Add login notification if enabled

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Sign in successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profilePhoto: user.profilePhoto,
        githubUrl: user.githubUrl,
        country: user.country,
        joinDate: user.joinDate
      }
    });
  } catch (error) {
    // TODO: Implement proper error logging
    res.status(400).json({ message: error.message });
  }
});

/**
 * @swagger
 * /auth/signout:
 *   post:
 *     summary: Sign out user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sign out successful
 */
router.post('/signout', auth, async (req, res) => {
  try {
    // TODO: Implement token blacklisting
    // TODO: Clear user sessions
    // TODO: Add signout activity logging
    // TODO: Implement force signout from all devices option

    // In a real application, you might want to invalidate the token
    // For now, we'll just send a success message
    res.json({ message: 'Sign out successful' });
  } catch (error) {
    // TODO: Implement proper error logging
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 