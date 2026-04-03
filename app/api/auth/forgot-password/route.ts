import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import ResetToken from "@/models/ResetToken";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email là bắt buộc" }, { status: 400 });
    }

    await dbConnect();

    // 1. Kiểm tra User có tồn tại trong DB không
    const user = await User.findOne({ email });
    if (!user) {
      // Vì lý do bảo mật, không nên báo lỗi "Tài khoản không tồn tại"
      // Nhưng để demo hiển thị tốt, ta sẽ trả về lỗi:
      return NextResponse.json({ error: "Email này không tồn tại trong hệ thống." }, { status: 404 });
    }

    // 2. Kí một token mang ID User (Hết hạn trong 15 phút)
    const jwtSecret = process.env.JWT_RESET_SECRET || "fallback_secret_key_12345";
    const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: '15m' });
    
    // Lưu hoặc ghi đè token vào DB 
    // Nếu user này đã có token trước đó, xóa cái cũ cho an toàn
    await ResetToken.deleteMany({ userId: user._id });
    
    await ResetToken.create({
      userId: user._id,
      token: token,
      // createdAt is auto set
    });

    // 3. Định hình và tạo đường link chứa Token
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    // 4. Khởi tạo Transporter cho Nodemailer gửi đi
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
      },
    });

    const mailOptions = {
      from: `"NCKH Smart Home" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Yêu cầu khôi phục mật khẩu NCKH Smart",
      html: `
        <div style="font-family: sans-serif; padding: 20px; line-height: 1.6; color: #333;">
            <div style="max-w: 600px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 12px; border: 1px solid #eaeaea;">
              <h2 style="color: #111;">Khôi phục mật khẩu</h2>
              <p>Chào bạn,</p>
              <p>Bạn vừa gửi yêu cầu đặt lại mật khẩu cho tài khoản NCKH Smart Home kết nối với email này. Vui lòng bấm vào nút bên dưới để thiết lập mật khẩu mới. Hết hạn trong <strong>15 phút</strong>.</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #9333ea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Đặt lại mật khẩu
                </a>
              </p>
              <p>Nếu bạn không yêu cầu thay đổi, vui lòng bỏ qua email này.</p>
              <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
              <p style="font-size: 12px; color: #888;">Gửi từ hệ thống trung tâm NCKH Smart Home.</p>
            </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: "Link khôi phục đã được gửi vào Email của bạn!" }, { status: 200 });

  } catch (error) {
    console.error("Forgot Email Error: ", error);
    return NextResponse.json({ error: "Lỗi gửi mail hoặc Server đang bận. Vui lòng thử lại sau." }, { status: 500 });
  }
}