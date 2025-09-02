const Comment = require('../models/comment.model');
const User = require('../models/user.model');
const mongoose = require('mongoose');

// Create a new comment
const createComment = async (req, res) => {
    try {
        const { content, user, task, doc, parent } = req.body;
        
        // Resolve user ID - use authenticated user if not provided, or resolve by email/name
        let userId;
        if (user) {
            if (mongoose.Types.ObjectId.isValid(user)) {
                userId = user;
            } else {
                // Try to find user by email or name
                const foundUser = await User.findOne({
                    $or: [
                        { email: user },
                        { name: user }
                    ]
                });
                userId = foundUser ? foundUser._id : req.user._id; // Fallback to authenticated user
            }
        } else {
            // Use authenticated user if no user specified
            userId = req.user._id;
        }
        
        const comment = new Comment({ 
            content, 
            user: userId, 
            task, 
            doc, 
            parent 
        });
        
        await comment.save();
        
        // Populate user info in response
        await comment.populate('user', 'name email');
        
        return res.status(201).json({ 
            message: 'Comment created', 
            comment 
        });
    } catch (error) {
        return res.status(500).json({ 
            message: 'Failed to create comment', 
            error: error.message 
        });
    }
};

// Get all comments (optionally filter by task or doc)
const getAllComments = async (req, res) => {
    try {
        const { task, doc } = req.query;
        const filter = {};
        if (task) filter.task = task;
        if (doc) filter.doc = doc;
        
        const comments = await Comment.find(filter)
            .populate('user', 'name email')
            .populate('parent')
            .sort({ createdAt: -1 });
            
        return res.status(200).json({ comments });
    } catch (error) {
        return res.status(500).json({ 
            message: 'Failed to fetch comments', 
            error: error.message 
        });
    }
};

// Like a comment
const likeComment = async (req, res) => {
    try {
        const { id } = req.params;
        const comment = await Comment.findByIdAndUpdate(id, { $inc: { likes: 1 } }, { new: true });
        if (!comment) return res.status(404).json({ message: 'Comment not found' });
        return res.status(200).json({ message: 'Comment liked', comment });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to like comment', error: error.message });
    }
};

// Reply to a comment
const replyToComment = async (req, res) => {
    try {
        const { content, user, task, doc } = req.body;
        const { parentId } = req.params;
        
        // Resolve user ID - use authenticated user if not provided, or resolve by email/name
        let userId;
        if (user) {
            if (mongoose.Types.ObjectId.isValid(user)) {
                userId = user;
            } else {
                // Try to find user by email or name
                const foundUser = await User.findOne({
                    $or: [
                        { email: user },
                        { name: user }
                    ]
                });
                userId = foundUser ? foundUser._id : req.user._id; // Fallback to authenticated user
            }
        } else {
            // Use authenticated user if no user specified
            userId = req.user._id;
        }
        
        const reply = new Comment({ 
            content, 
            user: userId, 
            task, 
            doc, 
            parent: parentId 
        });
        
        await reply.save();
        
        // Populate user info in response
        await reply.populate('user', 'name email');
        
        return res.status(201).json({ 
            message: 'Reply added', 
            reply 
        });
    } catch (error) {
        return res.status(500).json({ 
            message: 'Failed to add reply', 
            error: error.message 
        });
    }
};

module.exports = {
    createComment,
    getAllComments,
    likeComment,
    replyToComment
};