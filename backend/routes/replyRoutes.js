const express = require('express');
const router = express.Router();
const replyController = require('../controllers/replyController');
const auth = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Reply:
 *       type: object
 *       required:
 *         - content
 *         - topic
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the reply
 *         content:
 *           type: string
 *           description: The content of the reply
 *         author:
 *           type: string
 *           description: The ID of the user who created the reply
 *         topic:
 *           type: string
 *           description: The ID of the topic this reply belongs to
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the reply was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the reply was last updated
 */

/**
 * @swagger
 * /replies:
 *   post:
 *     summary: Create a new reply to a topic
 *     tags: [Replies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - topicId
 *             properties:
 *               content:
 *                 type: string
 *               topicId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Reply created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Reply'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Topic not found
 *   get:
 *     summary: Get all replies with optional filters (topic or user) and pagination
 *     tags: [Replies]
 *     parameters:
 *       - in: query
 *         name: topicId
 *         schema:
 *           type: string
 *         description: Filter replies by topic ID
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter replies by user ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of replies per page
 *     responses:
 *       200:
 *         description: List of replies with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Reply'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */

/**
 * @swagger
 * /replies/topic/{topicId}:
 *   get:
 *     summary: Get all replies for a topic with pagination
 *     tags: [Replies]
 *     parameters:
 *       - in: path
 *         name: topicId
 *         schema:
 *           type: string
 *         required: true
 *         description: The topic ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of replies per page
 *     responses:
 *       200:
 *         description: List of replies for the topic
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Reply'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */

/**
 * @swagger
 * /replies/{id}:
 *   delete:
 *     summary: Delete a reply by ID (only by author)
 *     tags: [Replies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The reply ID
 *     responses:
 *       200:
 *         description: Reply deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       403:
 *         description: Not authorized to delete this reply
 *       404:
 *         description: Reply not found
 */

// Create a new reply (protected route)
router.post('/', auth, replyController.createReply);

// Get all replies with optional filters
router.get('/', replyController.getAllReplies);

// Get replies for a topic
router.get('/topic/:topicId', replyController.getTopicReplies);

// Delete a reply (protected route)
router.delete('/:id', auth, replyController.deleteReply);

module.exports = router; 