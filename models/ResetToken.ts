import mongoose, { Schema, model, models } from 'mongoose';

const ResetTokenSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 900, // Tự động xóa khỏi DB sau 15 phút (900 giây)
  },
});

const ResetToken = models.ResetToken || model('ResetToken', ResetTokenSchema);

export default ResetToken;