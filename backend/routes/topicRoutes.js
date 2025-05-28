const express = require('express');
const router = express.Router();
const topicController = require('../controllers/topicController');
const auth = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Topic:
 *       type: object
 *       required:
 *         - title
 *         - content
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the topic
 *         title:
 *           type: string
 *           description: The title of the topic
 *         content:
 *           type: string
 *           description: The content of the topic
 *         author:
 *           type: string
 *           description: The ID of the user who created the topic
 *         views:
 *           type: number
 *           description: Number of views on the topic
 *         replies:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of reply IDs
 *         replyCount:
 *           type: number
 *           description: Number of replies on the topic
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the topic was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the topic was last updated
 */

/**
 * @swagger
 * /topics:
 *   post:
 *     summary: Create a new topic
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Topic created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Topic'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *   get:
 *     summary: Get all topics with optional user filter (sorted by most recent updates)
 *     tags: [Topics]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter topics by user ID (optional)
 *     responses:
 *       200:
 *         description: List of topics (filtered by user if userId is provided, sorted by most recent updates)
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
 *                     $ref: '#/components/schemas/Topic'
 */

/**
 * @swagger
 * /topics/{id}:
 *   get:
 *     summary: Get a topic by ID
 *     tags: [Topics]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The topic ID
 *     responses:
 *       200:
 *         description: Topic details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Topic'
 *       404:
 *         description: Topic not found
 */

// Create a new topic (protected route)
router.post('/', auth, topicController.createTopic);

// Get all topics
router.get('/', topicController.getAllTopics);

// Get a single topic
router.get('/:id', topicController.getTopic);

module.exports = router; 