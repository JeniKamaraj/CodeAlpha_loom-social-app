const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/:username - public profile + their posts
router.get('/:username', optionalAuth, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const posts = await Post.find({ author: user._id })
      .sort({ createdAt: -1 })
      .populate('author', 'username displayName avatarColor');

    const isFollowing = req.userId
      ? user.followers.some((f) => f.toString() === req.userId)
      : false;

    res.json({
      profile: user.toPublicJSON(),
      isFollowing,
      isSelf: req.userId === user._id.toString(),
      posts: posts.map((p) => ({
        id: p._id,
        content: p.content,
        author: p.author,
        likeCount: p.likes.length,
        commentCount: p.commentCount,
        likedByMe: req.userId ? p.likes.some((l) => l.toString() === req.userId) : false,
        createdAt: p.createdAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: 'Could not load profile.', detail: err.message });
  }
});

// PATCH /api/users/me - edit own profile
router.patch('/me/edit', requireAuth, async (req, res) => {
  try {
    const { displayName, bio } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (displayName !== undefined) user.displayName = displayName.slice(0, 40);
    if (bio !== undefined) user.bio = bio.slice(0, 240);

    await user.save();
    res.json({ user: user.toPublicJSON() });
  } catch (err) {
    res.status(500).json({ error: 'Could not update profile.', detail: err.message });
  }
});

// POST /api/users/:username/follow - toggle follow
router.post('/:username/follow', requireAuth, async (req, res) => {
  try {
    const target = await User.findOne({ username: req.params.username });
    if (!target) return res.status(404).json({ error: 'User not found.' });
    if (target._id.toString() === req.userId) {
      return res.status(400).json({ error: 'You cannot follow yourself.' });
    }

    const me = await User.findById(req.userId);
    const alreadyFollowing = me.following.some((f) => f.toString() === target._id.toString());

    if (alreadyFollowing) {
      me.following = me.following.filter((f) => f.toString() !== target._id.toString());
      target.followers = target.followers.filter((f) => f.toString() !== me._id.toString());
    } else {
      me.following.push(target._id);
      target.followers.push(me._id);
    }

    await me.save();
    await target.save();

    res.json({
      following: !alreadyFollowing,
      followerCount: target.followers.length,
    });
  } catch (err) {
    res.status(500).json({ error: 'Could not update follow status.', detail: err.message });
  }
});

module.exports = router;
