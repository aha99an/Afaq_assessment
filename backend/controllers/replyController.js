const Reply = require('../models/Reply');
const Topic = require('../models/Topic');

// Create a new reply
exports.createReply = async (req, res) => {
  try {
    const { content, topicId } = req.body;
    const userId = req.user._id; // From auth middleware

    // Check if topic exists
    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({
        success: false,
        error: 'Topic not found'
      });
    }

    // Create the reply
    const reply = new Reply({
      content,
      author: userId,
      topic: topicId
    });

    await reply.save();

    // Add reply to topic's replies array
    topic.replies.push(reply._id);
    // Update topic's updatedAt timestamp
    topic.updatedAt = new Date();
    await topic.save();

    // Populate author information
    await reply.populate('author', 'firstName lastName profilePhoto');

    res.status(201).json({
      success: true,
      data: reply
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Get all replies with optional filters
exports.getAllReplies = async (req, res) => {
  try {
    const { topicId, userId, page = 1, limit = 10 } = req.query;
    let query = {};

    // Apply filters if provided
    if (topicId) {
      query.topic = topicId;
    }
    if (userId) {
      query.author = userId;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await Reply.countDocuments(query);
    const replies = await Reply.find(query)
      .populate('author', 'firstName lastName profilePhoto')
      .populate('topic', 'title') // Include basic topic info
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: replies,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Get replies for a topic
exports.getTopicReplies = async (req, res) => {
  try {
    const { topicId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await Reply.countDocuments({ topic: topicId });
    const replies = await Reply.find({ topic: topicId })
      .populate('author', 'firstName lastName profilePhoto')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: replies,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Delete a reply
exports.deleteReply = async (req, res) => {
  try {
    const reply = await Reply.findById(req.params.id);
    
    if (!reply) {
      return res.status(404).json({
        success: false,
        error: 'Reply not found'
      });
    }

    // Check if the authenticated user is the author
    if (reply.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this reply'
      });
    }

    // Remove reply from topic's replies array
    await Topic.findByIdAndUpdate(reply.topic, {
      $pull: { replies: reply._id }
    });

    // Delete the reply
    await reply.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Reply deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}; 