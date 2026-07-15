const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 24,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    displayName: {
      type: String,
      default: function () {
        return this.username;
      },
    },
    bio: {
      type: String,
      default: '',
      maxlength: 240,
    },
    avatarColor: {
      // used by the frontend to render a generated avatar swatch
      type: String,
      default: '#E8A33D',
    },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

UserSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    username: this.username,
    displayName: this.displayName,
    bio: this.bio,
    avatarColor: this.avatarColor,
    followerCount: this.followers.length,
    followingCount: this.following.length,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', UserSchema);
