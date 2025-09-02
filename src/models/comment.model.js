const mongoose = require('mongoose');


const commentSchema = new mongoose.Schema({
    content: { type: String, required: true }, 
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' }, 
    doc: { type: mongoose.Schema.Types.ObjectId, ref: 'Doc' }, 
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
    likes: { type: Number, default: 0 }
}, { timestamps: true });


module.exports = mongoose.model('Comment', commentSchema, 'comments');

