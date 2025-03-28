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
        from: this.configService.get('MAIL_FROM', 'Your App <noreply@yourapp.com>'),
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
}