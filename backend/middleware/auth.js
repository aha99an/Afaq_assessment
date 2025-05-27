const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const checkInvalidToken = require('./checkInvalidToken');

// TODO: Implement role-based access control (RBAC)
// TODO: Add permission-based authorization
// TODO: Implement API key authentication for service-to-service communication
// TODO: Add request rate limiting per user

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // First check if token is invalidated
    try {
      await checkInvalidToken(req, res, async () => {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          
          // Convert string ID to ObjectId
          const userId = new mongoose.Types.ObjectId(decoded.userId);
          const user = await User.findById(userId);
          

          if (!user) {
            return res.status(401).json({ 
              message: 'User not found',
              debug: {
                userId: decoded.userId,
                tokenDecoded: decoded,
                timestamp: new Date().toISOString()
              }
            });
          }

          // Convert user to plain object and remove sensitive data
          const userObject = user.toObject();
          delete userObject.password;

          req.user = userObject;
          req.token = token;
          return next();
        } catch (jwtError) {
          console.error('JWT Error:', {
            name: jwtError.name,
            message: jwtError.message,
            stack: jwtError.stack
          });

          if (jwtError.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token has expired' });
          } else if (jwtError.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
          }
          throw jwtError;
        }
      });
    } catch (error) {
      console.error('Token check error:', error);
      return res.status(401).json({ message: 'Authentication failed' });
    }
  } catch (error) {
    console.error('Auth middleware error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports = auth; 