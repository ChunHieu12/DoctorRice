import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private useSendGrid: boolean = false;
  private sendGridFromEmail: string = '';
  private sendGridFromName: string = '';

  constructor() {
    this.initialize();
  }

  private initialize() {
    console.log('🔧 Initializing email service...');

    // Try SendGrid first (preferred for cloud platforms like Render)
    const sendGridApiKey = process.env.SENDGRID_API_KEY;
    if (sendGridApiKey) {
      try {
        sgMail.setApiKey(sendGridApiKey);
        this.useSendGrid = true;
        this.sendGridFromEmail = process.env.SENDGRID_FROM_EMAIL || 'doctorrice.contact@gmail.com';
        this.sendGridFromName = process.env.SENDGRID_FROM_NAME || 'DoctorRice';
        
        logger.info('✅ Email service initialized with SendGrid API');
        console.log('✅ Email service initialized with SendGrid API');
        console.log('📤 Emails will be sent from:', this.sendGridFromEmail);
        console.log('📛 Sender name:', this.sendGridFromName);
        return;
      } catch (error) {
        logger.error('❌ Failed to initialize SendGrid:', error);
        console.error('❌ SendGrid initialization failed, falling back to SMTP...');
      }
    } else {
      console.log('ℹ️  SENDGRID_API_KEY not found, trying SMTP...');
    }

    // Fallback to SMTP (may not work on Render Free Tier)
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;
    const emailService = process.env.EMAIL_SERVICE || 'gmail';

    console.log('📧 EMAIL_USER:', emailUser ? `${emailUser.substring(0, 3)}***` : 'NOT SET');
    console.log('🔑 EMAIL_PASSWORD:', emailPassword ? '***SET***' : 'NOT SET');
    console.log('🌐 EMAIL_SERVICE:', emailService);

    if (!emailUser || !emailPassword) {
      logger.warn('⚠️ Email credentials not configured. Email features will be disabled.');
      console.warn('⚠️ Email service NOT initialized - missing credentials');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        service: emailService,
        auth: {
          user: emailUser,
          pass: emailPassword,
        },
      });

      // Test connection
      this.transporter.verify((error, success) => {
        if (error) {
          logger.error('❌ Email service verification failed:', error);
          console.error('❌ SMTP verification failed:', error.message);
          console.error('⚠️ Note: Render.com Free Tier blocks SMTP ports (25, 465, 587)');
          console.error('💡 Solution: Use SendGrid API - set SENDGRID_API_KEY in environment');
        } else {
          logger.info('✅ Email service verified and ready (SMTP)');
          console.log('✅ Email service verified and ready to send emails (SMTP)');
          console.log('📤 Emails will be sent from:', emailUser);
        }
      });

      logger.info('✅ Email service initialized (SMTP)');
      console.log('✅ Email service initialized successfully (SMTP)');
    } catch (error) {
      logger.error('❌ Failed to initialize email service:', error);
      console.error('❌ Email service initialization error:', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    // Use SendGrid API
    if (this.useSendGrid) {
      try {
        const msg = {
          to: options.to,
          from: {
            email: this.sendGridFromEmail,
            name: this.sendGridFromName,
          },
          subject: options.subject,
          text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML if no text
          html: options.html,
        };

        console.log(`📧 Sending email via SendGrid to: ${options.to}`);
        await sgMail.send(msg);
        logger.info(`📧 Email sent successfully to ${options.to} via SendGrid`);
        console.log(`✅ Email sent successfully to ${options.to} via SendGrid`);
        return true;
      } catch (error: any) {
        logger.error(`❌ Failed to send email via SendGrid to ${options.to}:`, error);
        console.error(`❌ SendGrid error:`, error.response?.body || error.message);
        return false;
      }
    }

    // Fallback to SMTP
    if (!this.transporter) {
      logger.warn('⚠️ Email service not configured. Skipping email send.');
      console.warn('⚠️ Email not sent - service not initialized');
      return false;
    }

    try {
      const fromEmail = process.env.EMAIL_USER;
      const mailOptions = {
        from: `"Bác sĩ Lúa" <${fromEmail}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      console.log(`📧 Sending email via SMTP to: ${options.to}`);
      await this.transporter.sendMail(mailOptions);
      logger.info(`📧 Email sent successfully to ${options.to} via SMTP`);
      console.log(`✅ Email sent successfully to ${options.to} via SMTP`);
      return true;
    } catch (error: any) {
      logger.error(`❌ Failed to send email via SMTP to ${options.to}:`, error);
      console.error(`❌ SMTP error:`, error.message);
      
      // Log specific SMTP errors
      if (error.code === 'ETIMEDOUT') {
        console.error('⚠️ SMTP Connection Timeout - Render.com may be blocking SMTP ports');
        console.error('💡 Solution: Use SendGrid API - set SENDGRID_API_KEY in environment');
      } else if (error.code === 'EAUTH') {
        console.error('⚠️ SMTP Authentication failed - Check EMAIL_USER and EMAIL_PASSWORD');
      }
      
      return false;
    }
  }

  async sendLoginNotification(email: string, loginMethod: 'google' | 'facebook', deviceInfo?: string) {
    const subject = '🔔 Thông báo đăng nhập - Bác sĩ Lúa';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px; }
          .info-box { background: #f5f5f5; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
          .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌾 Bác sĩ Lúa</h1>
          </div>
          <div class="content">
            <h2>Xin chào! 👋</h2>
            <p>Chúng tôi phát hiện một đăng nhập mới vào tài khoản của bạn.</p>
            
            <div class="info-box">
              <strong>📍 Thông tin đăng nhập:</strong><br>
              <strong>Phương thức:</strong> ${loginMethod === 'google' ? 'Google' : 'Facebook'}<br>
              <strong>Email:</strong> ${email}<br>
              <strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN', { 
                timeZone: 'Asia/Ho_Chi_Minh',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}<br>
              ${deviceInfo ? `<strong>Thiết bị:</strong> ${deviceInfo}<br>` : ''}
            </div>

            <p><strong>Nếu đây là bạn:</strong> Không cần làm gì cả. Bạn đã đăng nhập thành công!</p>
            
            <p><strong>Nếu không phải bạn:</strong> Vui lòng đổi mật khẩu ngay lập tức và liên hệ với chúng tôi.</p>

            <p>Cảm ơn bạn đã sử dụng <strong>Bác sĩ Lúa</strong>! 🌾</p>
          </div>
          <div class="footer">
            <p>Email này được gửi tự động từ hệ thống Bác sĩ Lúa</p>
            <p>© ${new Date().getFullYear()} Bác sĩ Lúa. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Xin chào!

Chúng tôi phát hiện một đăng nhập mới vào tài khoản của bạn.

Thông tin đăng nhập:
- Phương thức: ${loginMethod === 'google' ? 'Google' : 'Facebook'}
- Email: ${email}
- Thời gian: ${new Date().toLocaleString('vi-VN')}
${deviceInfo ? `- Thiết bị: ${deviceInfo}` : ''}

Nếu đây là bạn: Không cần làm gì cả.
Nếu không phải bạn: Vui lòng đổi mật khẩu ngay lập tức.

Cảm ơn bạn đã sử dụng Bác sĩ Lúa!
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  async sendWelcomeEmail(email: string, displayName: string) {
    const subject = '🎉 Chào mừng đến với Bác sĩ Lúa!';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px; }
          .feature { margin: 15px 0; padding-left: 30px; }
          .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌾 Chào mừng đến với Bác sĩ Lúa!</h1>
          </div>
          <div class="content">
            <h2>Xin chào ${displayName}! 👋</h2>
            <p>Cảm ơn bạn đã tham gia cộng đồng <strong>Bác sĩ Lúa</strong>!</p>
            
            <p><strong>Với Bác sĩ Lúa, bạn có thể:</strong></p>
            <div class="feature">🤖 <strong>Bác sĩ AI:</strong> Chẩn đoán bệnh lúa bằng AI</div>
            <div class="feature">👨‍🌾 <strong>Chat với chuyên gia:</strong> Hỏi đáp trực tiếp với chuyên gia nông nghiệp</div>
            <div class="feature">🌤️ <strong>Theo dõi thời tiết:</strong> Cập nhật thời tiết theo khu vực</div>
            <div class="feature">🗺️ <strong>Bản đồ nông trại:</strong> Quản lý và theo dõi nông trại của bạn</div>
            <div class="feature">🌀 <strong>Cảnh báo bão:</strong> Thông tin bão và thiên tai kịp thời</div>

            <p>Chúc bạn có trải nghiệm tuyệt vời! 🌾</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Bác sĩ Lúa. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }
}

export default new EmailService();

