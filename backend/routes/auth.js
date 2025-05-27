const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const InvalidToken = require('../models/InvalidToken');
const auth = require('../middleware/auth');
const { signupValidation, signinValidation, changePasswordValidation } = require('../middleware/validators');
const upload = require('../middleware/upload');

// TODO: Implement rate limiting for auth routes to prevent brute force attacks
// TODO: Add email verification system
// TODO: Implement refresh token mechanism

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
router.post('/signup', upload.single('profilePhoto'), signupValidation, async (req, res) => {
  try {
    // TODO: Add email verification before allowing signup
    // TODO: Implement social media signup options

    const { firstName, lastName, email, password, githubUrl, country } = req.body;

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
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */
router.post('/signout', auth, async (req, res) => {
  try {
    // Add token to invalid tokens collection
    const invalidToken = new InvalidToken({
      token: req.token
    });
    await invalidToken.save();

    res.json({ message: 'Sign out successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /auth/update-profile:
 *   put:
 *     summary: Update user profile information
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *               profilePhoto:
 *                 type: string
 *                 format: binary
 *               githubUrl:
 *                 type: string
 *               country:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Authentication required
 *       400:
 *         description: Invalid input
 */
router.put('/update-profile', auth, upload.single('profilePhoto'), async (req, res) => {
  try {
    const { firstName, lastName, githubUrl, country } = req.body;
    // Get the Mongoose document to use save()
    const user = await User.findById(req.user._id);

    // Handle profile photo update
    if (req.file) {
      // Delete old profile photo if exists
      if (user.profilePhoto) {
        const oldPhotoPath = path.join(__dirname, '..', user.profilePhoto);
        deleteUploadedFile(oldPhotoPath);
      }

      // Save new profile photo
      const relativePath = path.join('uploads', 'profile-photos', user.email, req.file.filename);
      user.profilePhoto = relativePath.replace(/\\/g, '/');
    }

    // Update user fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (githubUrl) user.githubUrl = githubUrl;
    if (country) user.country = country;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
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
    // If update fails and new photo was uploaded, delete it
    if (req.file) {
      deleteUploadedFile(req.file.path);
    }
    console.error('Profile update error:', error);
    res.status(400).json({ 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 minLength: 8
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Invalid old password
 *       400:
 *         description: Invalid input
 */
router.post('/change-password', auth, changePasswordValidation, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    // Get user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify old password
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid old password' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(400).json({ 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router; 