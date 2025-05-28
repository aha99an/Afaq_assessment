const Topic = require('../models/Topic');
const User = require('../models/User');
const Reply = require('../models/Reply');

// Create a new topic
exports.createTopic = async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.user._id; // Assuming you have authentication middleware

    const topic = new Topic({
      title,
      content,
      author: userId
    });

    await topic.save();

    // Add the topic to the user's topics
    await User.findByIdAndUpdate(userId, {
      $push: { topics: topic._id }
    });

    res.status(201).json({
      success: true,
      data: topic
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Get all topics with optional user filter
exports.getAllTopics = async (req, res) => {
  try {
    const { userId } = req.query;
    let query = {};

    // If userId is provided, filter topics by that user
    if (userId) {
      query.author = userId;
    }

    const topics = await Topic.find(query)
      .populate('author', 'firstName lastName profilePhoto')
      .sort({ updatedAt: -1 });

    // Add reply count to each topic
    const topicsWithReplyCount = topics.map(topic => {
      const topicObj = topic.toObject();
      topicObj.replyCount = topic.replies.length;
      return topicObj;
    });

    res.status(200).json({
      success: true,
      data: topicsWithReplyCount
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Get a single topic
exports.getTopic = async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id)
      .populate('author', 'firstName lastName profilePhoto');

    if (!topic) {
      return res.status(404).json({
        success: false,
        error: 'Topic not found'
      });
    }

    // Get replies for this topic
    const replies = await Reply.find({ topic: topic._id })
      .populate('author', 'firstName lastName profilePhoto');

    // Increment views
    topic.views += 1;
    await topic.save();

    // Add reply count to the topic
    const topicWithReplyCount = topic.toObject();
    topicWithReplyCount.replies = replies;
    topicWithReplyCount.replyCount = replies.length;

    res.status(200).json({
      success: true,
      data: topicWithReplyCount
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}; 