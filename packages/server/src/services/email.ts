import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // For development, use ethereal email (fake SMTP)
    // In production, replace with real SMTP credentials
    if (process.env.NODE_ENV === 'production') {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Development mode - log emails to console
      console.log('📧 Email service initialized in development mode (emails will be logged)');
    }
  }

  async sendEmail({ to, subject, text, html }: EmailOptions): Promise<void> {
    if (!this.transporter) {
      // In development, just log the email
      console.log('\n📧 Email would be sent:');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${text}`);
      console.log('---\n');
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@ting.com',
        to,
        subject,
        text,
        html: html || text,
      });

      console.log(`✅ Email sent: ${info.messageId}`);
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      throw error;
    }
  }

  async sendDueSoonReminder(userEmail: string, userName: string, itemName: string, dueDate: Date): Promise<void> {
    const subject = '⏰ Reminder: Item Due Soon';
    const text = `Hi ${userName},\n\nThis is a friendly reminder that "${itemName}" is due back on ${dueDate.toLocaleDateString()}.\n\nPlease return it on time so others can use it.\n\nThank you!`;
    const html = `
      <h2>Reminder: Item Due Soon</h2>
      <p>Hi ${userName},</p>
      <p>This is a friendly reminder that <strong>${itemName}</strong> is due back on <strong>${dueDate.toLocaleDateString()}</strong>.</p>
      <p>Please return it on time so others can use it.</p>
      <p>Thank you!</p>
    `;

    await this.sendEmail({ to: userEmail, subject, text, html });
  }

  async sendOverdueNotice(userEmail: string, userName: string, itemName: string, dueDate: Date): Promise<void> {
    const subject = '⚠️ Overdue: Please Return Item';
    const text = `Hi ${userName},\n\n"${itemName}" was due back on ${dueDate.toLocaleDateString()} and is now overdue.\n\nPlease return it as soon as possible.\n\nThank you for your cooperation.`;
    const html = `
      <h2 style="color: #dc2626;">Overdue: Please Return Item</h2>
      <p>Hi ${userName},</p>
      <p><strong>${itemName}</strong> was due back on <strong>${dueDate.toLocaleDateString()}</strong> and is now overdue.</p>
      <p>Please return it as soon as possible.</p>
      <p>Thank you for your cooperation.</p>
    `;

    await this.sendEmail({ to: userEmail, subject, text, html });
  }
}

export const emailService = new EmailService();
