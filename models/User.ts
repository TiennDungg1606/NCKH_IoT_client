import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  userName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  device: {
    type: [String], // Lưu danh sách các thiết bị (có thể là MAC Address hoặc ID của Collection Device)
    default: [],
  }
}, {
  timestamps: true,
});

// Trong Mongoose, mỗi document tự động có một trường `_id` mặc định đóng vai trò là id duy nhất cho người dùng.
// Chúng ta có thể thêm cấu hình để trả về `id` thay vì `_id` khi xuất dạng JSON (nếu cần thiết)
UserSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  }
});

const User = models.User || model('User', UserSchema);

export default User;
