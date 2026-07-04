import nodemailer from 'nodemailer';

export class EmailService {
  private static getTransporter() {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL || 'karthik6112001@gmail.com',
        pass: process.env.SMTP_PASSWORD || 'dhdd vmpl jmtt xqyp'
      }
    });
  }

  /**
   * Sends a password reset email triggered by the user (Forgot Password flow).
   */
  static async sendPasswordResetEmail(name: string, email: string, resetUrl: string): Promise<void> {
    const transporter = this.getTransporter();
    
    await transporter.sendMail({
      from: `"School Support" <${process.env.SMTP_EMAIL || 'karthik6112001@gmail.com'}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; color: #333;">
          <h2 style="color: #059669;">Reset Your Password</h2>
          <p>Hello ${name},</p>
          <p>We received a request to reset your password. Click the secure link below to proceed:</p>
          <div style="margin: 30px 0;">
            <a href="${resetUrl}" style="display:inline-block; padding:12px 24px; color:#ffffff; background-color:#10b981; border-radius:8px; text-decoration:none; font-weight:bold;">Set New Password</a>
          </div>
          <p style="font-size:14px; color:#666;">This link is valid for 15 minutes. If you did not request a password reset, you can safely ignore this email.</p>
        </div>
      `
    });
  }

  /**
   * Sends a password reset email triggered by an Administrator (User Management flow).
   */
  static async sendAdminPasswordResetEmail(name: string, email: string, resetUrl: string): Promise<void> {
    const transporter = this.getTransporter();
    // Using the specific fallback requested in user.routes.ts, though realistically they should use the same
    const fromEmail = process.env.SMTP_EMAIL || 'sam21cs1188@gmail.com'; 
    
    await transporter.sendMail({
      from: `"School Support" <${fromEmail}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; color: #333;">
          <h2 style="color: #059669;">Reset Your Password</h2>
          <p>Hello ${name},</p>
          <p>Your administrator has requested a password reset for your account. Click the secure link below to proceed:</p>
          <div style="margin: 30px 0;">
            <a href="${resetUrl}" style="display:inline-block; padding:12px 24px; color:#ffffff; background-color:#10b981; border-radius:8px; text-decoration:none; font-weight:bold;">Set New Password</a>
          </div>
          <p style="font-size:14px; color:#666;">This link is valid for 15 minutes. If you did not request a password reset, you can safely ignore this email.</p>
        </div>
      `
    });
  }

  // ==========================================
  // Future Extensibility - Do Not Implement Yet
  // ==========================================
  
  static async sendOrganizationProvisionedEmail(
    contactEmail: string,
    adminEmail: string | null,
    adminPassword: string | null, // Plain text password created during onboarding
    loginUrl: string,
    orgData: any
  ): Promise<void> {
    const transporter = this.getTransporter();
    const fromEmail = process.env.SMTP_EMAIL || 'karthik6112001@gmail.com';
    const subject = 'Welcome to School Smart – Your Organization is Ready';

    const loginDetailsHtml = adminEmail ? `
      <h3 style="color: #059669;">Login Details</h3>
      <p><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
      <p><strong>Admin Username (Email):</strong> ${adminEmail}</p>
      <p><strong>Password:</strong> ${adminPassword || '(The password you created during onboarding)'}</p>
      <div style="margin: 20px 0;">
        <a href="${loginUrl}" style="display:inline-block; padding:10px 20px; color:#ffffff; background-color:#10b981; border-radius:5px; text-decoration:none; font-weight:bold;">Login Now</a>
      </div>
    ` : '';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #059669;">Welcome to School Smart!</h2>
        <p>Your organization has been successfully provisioned and is ready for use.</p>
        
        ${loginDetailsHtml}
        
        <h3 style="color: #059669;">Organization Summary</h3>
        <h4>Organization Identity</h4>
        <ul>
          <li><strong>School Name:</strong> ${orgData.school_name || 'N/A'}</li>
          <li><strong>Contact Email:</strong> ${orgData.contact_email || 'N/A'}</li>
          <li><strong>Contact Phone:</strong> ${orgData.contact_phone || 'N/A'}</li>
          <li><strong>Subdomain:</strong> ${orgData.subdomain || 'N/A'}</li>
        </ul>
        
        <h4>License Details</h4>
        <ul>
          <li><strong>Maximum Users (Seats):</strong> ${orgData.licensed_seats || 'N/A'}</li>
        </ul>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size:12px; color:#666; text-align:center;">
          Support Email: support@schoolsmart.com<br/>
          Thank you for choosing School Smart!
        </p>
      </div>
    `;

    // Case 1: Contact Email == Admin Email
    if (adminEmail && contactEmail === adminEmail) {
      await transporter.sendMail({
        from: `"School Smart" <${fromEmail}>`,
        to: contactEmail,
        subject,
        html: htmlContent
      });
      return;
    }

    // Case 2: Contact Email != Admin Email
    const promises = [];
    if (contactEmail) {
      promises.push(transporter.sendMail({
        from: `"School Smart" <${fromEmail}>`,
        to: contactEmail,
        subject,
        html: htmlContent
      }));
    }
    
    if (adminEmail) {
      promises.push(transporter.sendMail({
        from: `"School Smart" <${fromEmail}>`,
        to: adminEmail,
        subject,
        html: htmlContent
      }));
    }

    await Promise.all(promises);
  }

  static async sendWelcomeEmail(): Promise<void> {
    throw new Error('Not implemented');
  }

  static async sendTeacherInvitation(): Promise<void> {
    throw new Error('Not implemented');
  }

  static async sendParentInvitation(): Promise<void> {
    throw new Error('Not implemented');
  }

  static async sendStudentInvitation(): Promise<void> {
    throw new Error('Not implemented');
  }
}
