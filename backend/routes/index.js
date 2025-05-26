const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: Returns a welcome message
 *     description: Returns a welcome message to verify the API is running
 *     responses:
 *       200:
 *         description: A welcome message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: API is running...
 */
router.get('/', (req, res) => {
  res.json({ message: 'API is running...' });
});

module.exports = router; 