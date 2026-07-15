const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    commentCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

PostSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', PostSchema);
