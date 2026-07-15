const express = require('express');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

function serializePost(p, userId) {
  return {
    id: p._id,
    content: p.content,
    author: p.author,
    likeCount: p.likes.length,
    commentCount: p.commentCount,
    likedByMe: userId ? p.likes.some((l) => l.toString() === userId) : false,
    createdAt: p.createdAt,
  };
}

// GET /api/posts/feed - posts from people you follow + your own; falls back to global feed
router.get('/feed', optionalAuth, async (req, res) => {
  try {
    let authorFilter = {};

    if (req.userId) {
      const me = await User.findById(req.userId);
      const ids = [...me.following, me._id];
      authorFilter = { author: { $in: ids } };
    }

    const posts = await Post.find(authorFilter)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('author', 'username displayName avatarColor');

    res.json({ posts: posts.map((p) => serializePost(p, req.userId)) });
  } catch (err) {
    res.status(500).json({ error: 'Could not load feed.', detail: err.message });
  }
});

// GET /api/posts/explore - every post, newest first
router.get('/explore', optionalAuth, async (req, res) => {
  try {
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('author', 'username displayName avatarColor');

    res.json({ posts: posts.map((p) => serializePost(p, req.userId)) });
  } catch (err) {
    res.status(500).json({ error: 'Could not load posts.', detail: err.message });
  }
});

// POST /api/posts - create a post
router.post('/', requireAuth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Post content cannot be empty.' });
    }

    const post = await Post.create({ author: req.userId, content: content.trim() });
    await post.populate('author', 'username displayName avatarColor');

    res.status(201).json({ post: serializePost(post, req.userId) });
  } catch (err) {
    res.status(500).json({ error: 'Could not create post.', detail: err.message });
  }
});

// DELETE /api/posts/:id - delete your own post
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    if (post.author.toString() !== req.userId) {
      return res.status(403).json({ error: 'You can only delete your own posts.' });
    }

    await Comment.deleteMany({ post: post._id });
    await post.deleteOne();

    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: 'Could not delete post.', detail: err.message });
  }
});

// POST /api/posts/:id/like - toggle like
router.post('/:id/like', requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    const alreadyLiked = post.likes.some((l) => l.toString() === req.userId);
    if (alreadyLiked) {
      post.likes = post.likes.filter((l) => l.toString() !== req.userId);
    } else {
      post.likes.push(req.userId);
    }

    await post.save();
    res.json({ liked: !alreadyLiked, likeCount: post.likes.length });
  } catch (err) {
    res.status(500).json({ error: 'Could not update like.', detail: err.message });
  }
});

// GET /api/posts/:id/comments - list comments on a post
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.id })
      .sort({ createdAt: 1 })
      .populate('author', 'username displayName avatarColor');

    res.json({
      comments: comments.map((c) => ({
        id: c._id,
        content: c.content,
        author: c.author,
        createdAt: c.createdAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: 'Could not load comments.', detail: err.message });
  }
});

// POST /api/posts/:id/comments - add a comment
router.post('/:id/comments', requireAuth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment cannot be empty.' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    const comment = await Comment.create({
      post: post._id,
      author: req.userId,
      content: content.trim(),
    });
    await comment.populate('author', 'username displayName avatarColor');

    post.commentCount += 1;
    await post.save();

    res.status(201).json({
      comment: {
        id: comment._id,
        content: comment.content,
        author: comment.author,
        createdAt: comment.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Could not add comment.', detail: err.message });
  }
});

module.exports = router;
