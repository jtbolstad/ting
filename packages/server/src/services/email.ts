import nodemailer from 'nodemailer';
import { prisma } from '../prisma.js';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  event?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    if (process.env.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      console.log('📧 Email service initialized with SMTP');
    } else {
      console.log('📧 Email service in dev mode (no SMTP_HOST set — emails will be logged only)');
    }
  }

  async sendEmail({ to, subject, text, html, event }: EmailOptions): Promise<void> {
    console.log('\n📧 Email:');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${text}`);
    console.log('---\n');

    if (!this.transporter) {
      // Dev mode: log to DB as "dev" status and return
      prisma.emailLog.create({ data: { to, subject, event: event ?? 'unknown', status: 'dev' } }).catch(() => {});
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
      prisma.emailLog.create({ data: { to, subject, event: event ?? 'unknown', status: 'sent' } }).catch(() => {});
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      prisma.emailLog.create({ data: { to, subject, event: event ?? 'unknown', status: 'failed', error: String(error) } }).catch(() => {});
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

    await this.sendEmail({ to: userEmail, subject, text, html, event: 'due_soon' });
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

    await this.sendEmail({ to: userEmail, subject, text, html, event: 'overdue' });
  }

  async sendReservationConfirmed(
    userEmail: string,
    userName: string,
    itemName: string,
    startDate: Date,
    endDate: Date,
  ): Promise<void> {
    const subject = `Reservasjon bekreftet: ${itemName}`;
    const text = `Hei ${userName},\n\nDin reservasjon av "${itemName}" er bekreftet.\nPeriode: ${startDate.toLocaleDateString()} – ${endDate.toLocaleDateString()}\n\nHilsen Ting`;
    const html = `
      <h2 style="color: #16a34a;">Reservasjon bekreftet!</h2>
      <p>Hei ${userName},</p>
      <p>Din reservasjon av <strong>${itemName}</strong> er bekreftet.</p>
      <p><strong>Periode:</strong> ${startDate.toLocaleDateString()} – ${endDate.toLocaleDateString()}</p>
    `;
    await this.sendEmail({ to: userEmail, subject, text, html, event: 'reservation_confirmed' });
  }

  async sendReservationCancelled(
    userEmail: string,
    userName: string,
    itemName: string,
    startDate: Date,
    endDate: Date,
  ): Promise<void> {
    const subject = `Reservasjon avbrutt: ${itemName}`;
    const text = `Hei ${userName},\n\nDin reservasjon av "${itemName}" (${startDate.toLocaleDateString()} – ${endDate.toLocaleDateString()}) er avbrutt.\n\nHilsen Ting`;
    const html = `
      <h2>Reservasjon avbrutt</h2>
      <p>Hei ${userName},</p>
      <p>Din reservasjon av <strong>${itemName}</strong> (${startDate.toLocaleDateString()} – ${endDate.toLocaleDateString()}) er avbrutt.</p>
    `;
    await this.sendEmail({ to: userEmail, subject, text, html, event: 'reservation_cancelled' });
  }

  async sendApprovalRequest(
    adminEmails: string[],
    submitterName: string,
    itemName: string,
    orgName: string,
  ): Promise<void> {
    const subject = `Nytt ting til godkjenning: ${itemName}`;
    const text = `Hei,\n\n${submitterName} har lagt inn "${itemName}" i ${orgName} og venter på godkjenning.\n\nLogg inn i admin-panelet for å godkjenne eller avvise.\n\nHilsen Ting`;
    const html = `
      <h2>Nytt ting venter på godkjenning</h2>
      <p><strong>${submitterName}</strong> har lagt inn følgende ting i <strong>${orgName}</strong>:</p>
      <p style="font-size:1.1em; padding: 8px 16px; background:#f3f4f6; border-left: 4px solid #6366f1;">${itemName}</p>
      <p>Logg inn i admin-panelet for å godkjenne eller avvise.</p>
    `;

    for (const email of adminEmails) {
      await this.sendEmail({ to: email, subject, text, html, event: 'approval_request' });
    }
  }

  async sendItemApproved(userEmail: string, userName: string, itemName: string, orgName: string): Promise<void> {
    const subject = `"${itemName}" er godkjent!`;
    const text = `Hei ${userName},\n\nTinget ditt "${itemName}" er nå godkjent og synlig i katalogen til ${orgName}.\n\nTakk for at du bidrar!\n\nHilsen Ting`;
    const html = `
      <h2 style="color: #16a34a;">Tinget ditt er godkjent!</h2>
      <p>Hei ${userName},</p>
      <p><strong>${itemName}</strong> er nå godkjent og synlig i katalogen til <strong>${orgName}</strong>.</p>
      <p>Takk for at du bidrar til nabolaget!</p>
    `;

    await this.sendEmail({ to: userEmail, subject, text, html, event: 'item_approved' });
  }

  async sendItemRejected(
    userEmail: string,
    userName: string,
    itemName: string,
    orgName: string,
    note?: string,
  ): Promise<void> {
    const subject = `"${itemName}" ble ikke godkjent`;
    const noteText = note ? `\n\nBegrunnelse: ${note}` : '';
    const text = `Hei ${userName},\n\nDessverre ble "${itemName}" ikke godkjent i ${orgName}.${noteText}\n\nTa kontakt med administrator hvis du har spørsmål.\n\nHilsen Ting`;
    const noteHtml = note ? `<p><strong>Begrunnelse:</strong> ${note}</p>` : '';
    const html = `
      <h2 style="color: #dc2626;">Tinget ble ikke godkjent</h2>
      <p>Hei ${userName},</p>
      <p>Dessverre ble <strong>${itemName}</strong> ikke godkjent i <strong>${orgName}</strong>.</p>
      ${noteHtml}
      <p>Ta kontakt med administrator hvis du har spørsmål.</p>
    `;

    await this.sendEmail({ to: userEmail, subject, text, html, event: 'item_rejected' });
  }

  async sendWelcome(userEmail: string, userName: string, orgName: string): Promise<void> {
    const subject = `Velkommen til ${orgName} på Ting!`;
    const text = `Hei ${userName},\n\nVelkommen til ${orgName} på Ting! Du kan nå bla i katalogen og låne verktøy og utstyr fra fellesskapet.\n\nHilsen Ting`;
    const html = `
      <h2 style="color: #6366f1;">Velkommen til ${orgName}!</h2>
      <p>Hei ${userName},</p>
      <p>Du er nå registrert på <strong>Ting</strong> og medlem av <strong>${orgName}</strong>.</p>
      <p>Bla i katalogen og lån verktøy og utstyr fra fellesskapet.</p>
      <p>Hilsen Ting</p>
    `;
    await this.sendEmail({ to: userEmail, subject, text, html, event: 'welcome' });
  }

  async sendCheckedOut(
    userEmail: string,
    userName: string,
    itemName: string,
    dueDate: Date,
  ): Promise<void> {
    const subject = `Du har lånt: ${itemName}`;
    const text = `Hei ${userName},\n\n"${itemName}" er nå registrert som utlånt til deg.\nLeveres tilbake innen: ${dueDate.toLocaleDateString('no-NO')}\n\nHilsen Ting`;
    const html = `
      <h2>Utlånsbekreftelse</h2>
      <p>Hei ${userName},</p>
      <p><strong>${itemName}</strong> er nå registrert som utlånt til deg.</p>
      <p><strong>Leveringsfrist:</strong> ${dueDate.toLocaleDateString('no-NO')}</p>
      <p>Hilsen Ting</p>
    `;
    await this.sendEmail({ to: userEmail, subject, text, html, event: 'checked_out' });
  }

  async sendCheckedIn(userEmail: string, userName: string, itemName: string): Promise<void> {
    const subject = `${itemName} er levert inn`;
    const text = `Hei ${userName},\n\nTakk! "${itemName}" er registrert som innlevert.\n\nHilsen Ting`;
    const html = `
      <h2>Innlevering bekreftet</h2>
      <p>Hei ${userName},</p>
      <p>Takk! <strong>${itemName}</strong> er registrert som innlevert.</p>
      <p>Hilsen Ting</p>
    `;
    await this.sendEmail({ to: userEmail, subject, text, html, event: 'checked_in' });
  }

  async sendReservationReminderDay(
    userEmail: string,
    userName: string,
    itemName: string,
    startDate: Date,
  ): Promise<void> {
    const subject = `Påminnelse: ${itemName} er klar til henting i morgen`;
    const text = `Hei ${userName},\n\nHusk at reservasjonen din av "${itemName}" starter i morgen (${startDate.toLocaleDateString('no-NO')}).\n\nHilsen Ting`;
    const html = `
      <h2>Påminnelse: Reservasjon starter i morgen</h2>
      <p>Hei ${userName},</p>
      <p><strong>${itemName}</strong> er klar til henting i morgen, <strong>${startDate.toLocaleDateString('no-NO')}</strong>.</p>
      <p>Hilsen Ting</p>
    `;
    await this.sendEmail({ to: userEmail, subject, text, html, event: 'reservation_reminder_day' });
  }

  async sendReservationCancelledByAdmin(
    userEmail: string,
    userName: string,
    itemName: string,
    startDate: Date,
    endDate: Date,
    reason?: string,
  ): Promise<void> {
    const subject = `Reservasjon kansellert av administrator: ${itemName}`;
    const reasonText = reason ? `\n\nÅrsak: ${reason}` : '';
    const text = `Hei ${userName},\n\nDin reservasjon av "${itemName}" (${startDate.toLocaleDateString('no-NO')} – ${endDate.toLocaleDateString('no-NO')}) er kansellert av en administrator.${reasonText}\n\nTa kontakt med administrator for mer informasjon.\n\nHilsen Ting`;
    const reasonHtml = reason ? `<p><strong>Årsak:</strong> ${reason}</p>` : '';
    const html = `
      <h2 style="color: #dc2626;">Reservasjon kansellert</h2>
      <p>Hei ${userName},</p>
      <p>Din reservasjon av <strong>${itemName}</strong> (${startDate.toLocaleDateString('no-NO')} – ${endDate.toLocaleDateString('no-NO')}) er kansellert av en administrator.</p>
      ${reasonHtml}
      <p>Ta kontakt med administrator for mer informasjon.</p>
      <p>Hilsen Ting</p>
    `;
    await this.sendEmail({ to: userEmail, subject, text, html, event: 'reservation_cancelled_by_admin' });
  }

  async sendOrgRoleChanged(
    userEmail: string,
    userName: string,
    orgName: string,
    newRole: string,
  ): Promise<void> {
    const roleLabels: Record<string, string> = {
      MEMBER: 'Medlem',
      MANAGER: 'Administrator',
      ADMIN: 'Administrator',
      OWNER: 'Eier',
    };
    const roleLabel = roleLabels[newRole] ?? newRole;
    const subject = `Rollen din i ${orgName} er endret`;
    const text = `Hei ${userName},\n\nRollen din i ${orgName} er endret til: ${roleLabel}.\n\nHilsen Ting`;
    const html = `
      <h2>Rolle endret</h2>
      <p>Hei ${userName},</p>
      <p>Rollen din i <strong>${orgName}</strong> er endret til: <strong>${roleLabel}</strong>.</p>
      <p>Hilsen Ting</p>
    `;
    await this.sendEmail({ to: userEmail, subject, text, html, event: 'org_role_changed' });
  }
}

export const emailService = new EmailService();
