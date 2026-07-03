/**
 * Simple, inline-styled HTML email template for OTP delivery.
 * Kept dependency-free (no external template engine) for simplicity.
 */
const otpEmailTemplate = ({ name = 'there', otp, purpose, expiryMinutes }) => {
  const purposeText =
    purpose === 'reset_password'
      ? 'reset your MPTest account password'
      : 'verify your email and complete your MPTest signup';

  return `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #eaeaea; border-radius: 8px;">
    <h2 style="color: #1a1a1a; margin-bottom: 4px;">MPTest</h2>
    <p style="color: #555; font-size: 14px; margin-top: 0;">Education, simplified.</p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
    <p style="font-size: 15px; color: #333;">Hi ${name},</p>
    <p style="font-size: 15px; color: #333;">
      Use the code below to ${purposeText}. This code is valid for
      <strong>${expiryMinutes} minutes</strong>.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <span style="display: inline-block; padding: 14px 28px; font-size: 28px; letter-spacing: 8px; font-weight: bold; background: #f4f4f7; border-radius: 8px; color: #1a1a1a;">
        ${otp}
      </span>
    </div>
    <p style="font-size: 13px; color: #888;">
      If you didn't request this, you can safely ignore this email.
      Never share this code with anyone, including MPTest staff.
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
    <p style="font-size: 12px; color: #aaa; text-align: center;">&copy; ${new Date().getFullYear()} MPTest. All rights reserved.</p>
  </div>
  `;
};

module.exports = otpEmailTemplate;
