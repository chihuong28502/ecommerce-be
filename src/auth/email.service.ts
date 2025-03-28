import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor(
    private configService: ConfigService,

  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow('EMAIL_HOST'),
      port: parseInt(this.configService.getOrThrow('EMAIL_PORT')),
      secure: false,
      auth: {
        user: this.configService.getOrThrow('EMAIL_USER'),
        pass: this.configService.getOrThrow('EMAIL_PASS'),
      },
    });
  }
  async sendVerificationEmail(email: string, verificationUrl: string): Promise<void> {
    try {
      const mailOptions = {
        from: this.configService.get('EMAIL_SENDER', 'Your App <noreply@yourapp.com>'),
        to: email,
        subject: 'Xác minh tài khoản của bạn',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Xác minh tài khoản</h2>
            <p>Cảm ơn bạn đã đăng ký tài khoản. Vui lòng nhấp vào liên kết bên dưới để xác minh email của bạn:</p>
            <p>
              <a 
                href="${verificationUrl}" 
                style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;"
              >
                Xác minh email
              </a>
            </p>
            <p>Hoặc sao chép liên kết này vào trình duyệt của bạn:</p>
            <p>${verificationUrl}</p>
            <p>Liên kết này sẽ hết hạn sau 24 giờ.</p>
            <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw error;
    }
  }

  async sendInfoUserO2(email: string, password: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get('EMAIL_SENDER', 'Your App <noreply@yourapp.com>'),
        to: email,
        subject: 'Mật khẩu đăng nhập của bạn',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #333; text-align: center;">Chào mừng bạn đến với hệ thống của chúng tôi!</h2>
            <p style="font-size: 16px; color: #555;">Cảm ơn bạn đã đăng ký tài khoản. Dưới đây là thông tin đăng nhập của bạn:</p>
            <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; font-size: 16px;">
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Mật khẩu:</strong> <span style="color: #d9534f; font-weight: bold;">${password}</span></p>
            </div>
            <p style="font-size: 16px; color: #555;">Vui lòng đăng nhập và thay đổi mật khẩu ngay sau khi đăng nhập.</p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="http://yourwebsite.com/login" 
                 style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Đăng nhập ngay
              </a>
            </div>
            <p style="font-size: 14px; color: #777;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
            <p style="font-size: 14px; color: #777;">Trân trọng,</p>
            <p style="font-size: 14px; font-weight: bold; color: #333;">Đội ngũ hỗ trợ</p>
          </div>
        `,
      });
    } catch (error) {
      throw error;
    }
  }
}