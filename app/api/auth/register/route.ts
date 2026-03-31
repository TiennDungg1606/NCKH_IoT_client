import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    // 1. Kết nối vào MongoDB
    await dbConnect();

    // 2. Lấy thông tin từ body của Request
    const { userName, email, password } = await req.json();

    // 3. Validate dữ liệu cơ bản
    if (!userName || !email || !password) {
      return NextResponse.json(
        { message: "Vui lòng điền đầy đủ các thông tin bắt buộc." },
        { status: 400 }
      );
    }

    // 4. Kiểm tra xem email đã tồn tại trong database chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "Email này đã được sử dụng. Vui lòng chọn email khác!" },
        { status: 400 }
      );
    }

    // 5. Mã hóa mật khẩu (hashing) trước khi lưu
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 6. Tạo người dùng mới trong DB
    const newUser = await User.create({
      userName,
      email,
      password: hashedPassword,
      device: [] // Mảng rỗng theo mặc định
    });

    // 7. Trả về kết quả thành công
    return NextResponse.json(
      { message: "Đăng ký tài khoản thành công!", user: { email: newUser.email, userName: newUser.userName } },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Lỗi khi đăng ký:", error);
    return NextResponse.json(
      { message: "Đã xảy ra lỗi hệ thống khi đăng ký.", error: error.message },
      { status: 500 }
    );
  }
}
