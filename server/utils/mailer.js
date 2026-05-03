import nodemailer from 'nodemailer';

const getTransporter = () =>
    nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    body { font-family: Arial, sans-serif; background: #f8fafd; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 32px auto; background: #fff; border-radius: 12px;
                 box-shadow: 0 2px 12px rgba(0,0,0,0.08); overflow: hidden; }
    .header { background: linear-gradient(135deg,#1976d2,#42a5f5); padding: 28px 32px; }
    .header h1 { color: #fff; margin: 0; font-size: 22px; }
    .header p  { color: rgba(255,255,255,0.85); margin: 4px 0 0; font-size: 13px; }
    .body { padding: 28px 32px; }
    .info-box { background: #f0f7ff; border-left: 4px solid #1976d2; border-radius: 6px;
                padding: 14px 18px; margin: 16px 0; }
    .info-box p { margin: 4px 0; font-size: 14px; color: #333; }
    .info-box strong { color: #1976d2; }
    .footer { background: #f8fafd; padding: 18px 32px; text-align: center;
              font-size: 12px; color: #999; border-top: 1px solid #eee; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px;
             font-size: 13px; font-weight: 600; margin-bottom: 14px; }
  </style>
</head>
<body>
  <div class="container">
    ${content}
    <div class="footer">Medicare Health Platform &mdash; Do not reply to this email.</div>
  </div>
</body>
</html>`;

export const sendBookingConfirmation = async ({ to, customerName, doctorName, date, fee }) => {
    if (!to) return;
    const formattedDate = new Date(date).toLocaleString('en-IN', {
        dateStyle: 'full', timeStyle: 'short',
    });
    const html = baseTemplate(`
      <div class="header">
        <h1>Appointment Confirmed ✓</h1>
        <p>Medicare Health Platform</p>
      </div>
      <div class="body">
        <span class="badge" style="background:#e8f5e9;color:#2e7d32;">Scheduled</span>
        <p>Dear <strong>${customerName}</strong>,</p>
        <p>Your appointment has been successfully booked. Here are the details:</p>
        <div class="info-box">
          <p><strong>Doctor:</strong> Dr. ${doctorName}</p>
          <p><strong>Date & Time:</strong> ${formattedDate}</p>
          <p><strong>Consultation Fee:</strong> ₹${fee}</p>
        </div>
        <p style="color:#555;font-size:14px;">Please arrive 10 minutes early. If you need to reschedule or cancel, you can do so from your dashboard.</p>
      </div>`);

    await send(to, 'Appointment Confirmed – Medicare', html);
};

export const sendCancellationNotice = async ({ to, customerName, doctorName, date, cancelledBy = 'system' }) => {
    if (!to) return;
    const formattedDate = new Date(date).toLocaleString('en-IN', {
        dateStyle: 'full', timeStyle: 'short',
    });
    const byMsg = cancelledBy === 'doctor'
        ? 'This appointment was cancelled by the doctor.'
        : 'You cancelled this appointment from your dashboard.';

    const html = baseTemplate(`
      <div class="header" style="background:linear-gradient(135deg,#c62828,#ef5350);">
        <h1>Appointment Cancelled</h1>
        <p>Medicare Health Platform</p>
      </div>
      <div class="body">
        <span class="badge" style="background:#ffebee;color:#c62828;">Cancelled</span>
        <p>Dear <strong>${customerName}</strong>,</p>
        <p>${byMsg}</p>
        <div class="info-box" style="border-color:#c62828;">
          <p><strong>Doctor:</strong> Dr. ${doctorName}</p>
          <p><strong>Original Date:</strong> ${formattedDate}</p>
        </div>
        <p style="color:#555;font-size:14px;">You can book a new appointment anytime from our platform.</p>
      </div>`);

    await send(to, 'Appointment Cancelled – Medicare', html);
};

export const sendRescheduleNotice = async ({ to, customerName, doctorName, oldDate, newDate }) => {
    if (!to) return;
    const fmtOld = new Date(oldDate).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' });
    const fmtNew = new Date(newDate).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' });

    const html = baseTemplate(`
      <div class="header" style="background:linear-gradient(135deg,#e65100,#fb8c00);">
        <h1>Appointment Rescheduled</h1>
        <p>Medicare Health Platform</p>
      </div>
      <div class="body">
        <span class="badge" style="background:#fff3e0;color:#e65100;">Rescheduled</span>
        <p>Dear <strong>${customerName}</strong>,</p>
        <p>Your appointment with <strong>Dr. ${doctorName}</strong> has been rescheduled.</p>
        <div class="info-box" style="border-color:#e65100;">
          <p><strong>Previous Date:</strong> <span style="text-decoration:line-through;color:#999;">${fmtOld}</span></p>
          <p><strong>New Date:</strong> ${fmtNew}</p>
        </div>
        <p style="color:#555;font-size:14px;">If this change does not work for you, please log in to reschedule or cancel.</p>
      </div>`);

    await send(to, 'Appointment Rescheduled – Medicare', html);
};

// Internal helper — never throws so email failures never break the main flow
const send = async (to, subject, html) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('Email credentials not set. Skipping email to:', to);
            return;
        }
        await getTransporter().sendMail({
            from: `"Medicare" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        });
        console.log(`Email sent to ${to}: ${subject}`);
    } catch (err) {
        console.error('Email send failed:', err.message);
    }
};
