import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import ResetToken from "@/models/ResetToken";

export async function POST(req: Request) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: "Bắt buộc có token và mật khẩu mới" }, { status: 400 });
    }

    await dbConnect();

    // 1. Xác thực token (Giải mã JWT)
    const jwtSecret = process.env.JWT_RESET_SECRET || "fallback_secret_key_12345";
    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (error) {
      return NextResponse.json({ error: "Đường dẫn không hợp lệ hoặc đã hết hạn (chỉ có hiệu lực trong 15 phút)." }, { status: 401 });
    }

    const userId = decoded.id;

    // 2. Kiểm tra token có thực sự tồn tại trong Database không
    // (Bảo vệ chống việc dùng lại token đã dùng hoặc token cũ)
    const tokenRecord = await ResetToken.findOne({ userId, token });
    if (!tokenRecord) {
      return NextResponse.json({ error: "Đường dẫn này đã được sử dụng hoặc không hợp lệ." }, { status: 401 });
    }

    // 3. Truy xuất User từ DB
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "Không tìm thấy tài khoản người dùng." }, { status: 404 });
    }

    // 4. Mã hóa mật khẩu mới và lưu vào DB
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    // 5. Xóa token đã dùng khỏi Database 
    await ResetToken.deleteMany({ userId });

    return NextResponse.json({ message: "Đặt lại mật khẩu thành công! Giờ bạn có thể đăng nhập." }, { status: 200 });

  } catch (error: any) {
    console.error("Reset Password API Error:", error);
    return NextResponse.json({ error: "Lỗi hệ thống khi cập nhật mật khẩu." }, { status: 500 });
  }
}
