const express = require('express');
const {
    createComment,
    getAllComments,
    likeComment,
    replyToComment
} = require('../../controllers/comment.controller');
const auth = require('../../middlewares/auth');

const router = express.Router();

router.post('/create', auth(), createComment);
router.get('/all', auth(), getAllComments);
router.post('/like/:id', auth(), likeComment);
router.post('/reply/:parentId', auth(), replyToComment);

module.exports = router;