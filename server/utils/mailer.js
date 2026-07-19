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

// ── Pharmacy order emails ───────────────────────────────────────────

const rupees = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const itemsTable = (items) => `
  <table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:13px;">
    <thead>
      <tr style="background:#f0f7ff;">
        <th style="text-align:left;padding:8px 10px;border-bottom:1px solid #dbe6f2;">Item</th>
        <th style="text-align:center;padding:8px 10px;border-bottom:1px solid #dbe6f2;">Qty</th>
        <th style="text-align:right;padding:8px 10px;border-bottom:1px solid #dbe6f2;">Price</th>
        <th style="text-align:right;padding:8px 10px;border-bottom:1px solid #dbe6f2;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((it) => `
        <tr>
          <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;">${it.name}</td>
          <td style="text-align:center;padding:8px 10px;border-bottom:1px solid #f0f0f0;">${it.quantity}</td>
          <td style="text-align:right;padding:8px 10px;border-bottom:1px solid #f0f0f0;">${rupees(it.price)}</td>
          <td style="text-align:right;padding:8px 10px;border-bottom:1px solid #f0f0f0;">${rupees(it.subtotal)}</td>
        </tr>`).join('')}
    </tbody>
  </table>`;

const addressBlock = (addr) => `
  <div style="font-size:13px;color:#333;line-height:1.5;">
    <strong>${addr.fullName}</strong><br/>
    ${addr.line1}${addr.line2 ? ', ' + addr.line2 : ''}<br/>
    ${addr.city}, ${addr.state} - ${addr.pincode}<br/>
    Phone: ${addr.phone}
  </div>`;

export const sendOrderConfirmation = async ({ to, customerName, order }) => {
    if (!to || !order) return;
    const rxNote = order.requiresPrescription
        ? `<p style="color:#e65100;font-size:13px;background:#fff3e0;border-left:4px solid #e65100;padding:10px 14px;border-radius:6px;">
             <strong>Prescription verification pending.</strong> Our pharmacist will verify your uploaded prescription before dispatching Rx items.
           </p>`
        : '';

    const html = baseTemplate(`
      <div class="header">
        <h1>Order Confirmed ✓</h1>
        <p>Medicare Pharmacy</p>
      </div>
      <div class="body">
        <span class="badge" style="background:#e8f5e9;color:#2e7d32;">Order placed</span>
        <p>Dear <strong>${customerName}</strong>,</p>
        <p>Thank you for your order! We've received your purchase and it's being processed.</p>

        <div class="info-box">
          <p><strong>Order number:</strong> ${order.orderNumber}</p>
          <p><strong>Order date:</strong> ${new Date(order.createdAt).toLocaleString('en-IN')}</p>
          <p><strong>Payment:</strong> ${order.paymentMethod} · ${order.paymentStatus}</p>
        </div>

        <h3 style="margin:20px 0 6px;font-size:15px;color:#1976d2;">Items</h3>
        ${itemsTable(order.items)}

        <table style="width:100%;font-size:13px;margin-top:8px;">
          <tr><td style="padding:3px 10px;color:#666;">Subtotal</td><td style="text-align:right;padding:3px 10px;">${rupees(order.subtotal)}</td></tr>
          <tr><td style="padding:3px 10px;color:#666;">Delivery</td><td style="text-align:right;padding:3px 10px;">${order.deliveryFee === 0 ? 'FREE' : rupees(order.deliveryFee)}</td></tr>
          <tr><td style="padding:3px 10px;color:#666;">GST</td><td style="text-align:right;padding:3px 10px;">${rupees(order.tax)}</td></tr>
          <tr><td style="padding:8px 10px;font-weight:700;border-top:1px solid #ddd;">Total</td>
              <td style="text-align:right;padding:8px 10px;font-weight:700;border-top:1px solid #ddd;">${rupees(order.totalAmount)}</td></tr>
        </table>

        <h3 style="margin:20px 0 6px;font-size:15px;color:#1976d2;">Shipping to</h3>
        ${addressBlock(order.shippingAddress)}

        ${rxNote}

        <p style="color:#555;font-size:13px;margin-top:20px;">
          You can track your order anytime from your Medicine Orders page.
        </p>
      </div>`);

    await send(to, `Order Confirmed – ${order.orderNumber} – Medicare Pharmacy`, html);
};

export const sendOrderCancellation = async ({ to, customerName, order, reason }) => {
    if (!to || !order) return;
    const html = baseTemplate(`
      <div class="header" style="background:linear-gradient(135deg,#c62828,#ef5350);">
        <h1>Order Cancelled</h1>
        <p>Medicare Pharmacy</p>
      </div>
      <div class="body">
        <span class="badge" style="background:#ffebee;color:#c62828;">Cancelled</span>
        <p>Dear <strong>${customerName}</strong>,</p>
        <p>Your order <strong>${order.orderNumber}</strong> has been cancelled.</p>
        ${reason ? `<div class="info-box" style="border-color:#c62828;"><p><strong>Reason:</strong> ${reason}</p></div>` : ''}
        <p style="color:#555;font-size:13px;">If payment was made, a refund will be initiated within 5-7 business days.</p>
      </div>`);

    await send(to, `Order Cancelled – ${order.orderNumber} – Medicare Pharmacy`, html);
};

export const sendOrderStatusUpdate = async ({ to, customerName, order, newStatus, note }) => {
    if (!to || !order) return;

    const statusMeta = {
        confirmed:        { label: 'Confirmed',        color: '#1976d2', bg: '#e3f2fd', msg: 'Your order has been confirmed and is being prepared.' },
        packed:           { label: 'Packed',           color: '#1976d2', bg: '#e3f2fd', msg: 'Your order has been packed and is ready to ship.' },
        shipped:          { label: 'Shipped',          color: '#0288d1', bg: '#e1f5fe', msg: 'Your order is on its way!' },
        out_for_delivery: { label: 'Out for Delivery', color: '#e65100', bg: '#fff3e0', msg: 'Your order is out for delivery today.' },
        delivered:        { label: 'Delivered',        color: '#2e7d32', bg: '#e8f5e9', msg: 'Your order has been delivered. We hope you feel better soon!' },
        returned:         { label: 'Returned',         color: '#c62828', bg: '#ffebee', msg: 'Your order has been marked as returned.' },
    };
    const meta = statusMeta[newStatus] || { label: newStatus, color: '#666', bg: '#eee', msg: `Your order status is now ${newStatus}.` };

    const tracking = order.trackingId
        ? `<div class="info-box"><p><strong>Delivery partner:</strong> ${order.deliveryPartner || '—'}</p>
           <p><strong>Tracking ID:</strong> ${order.trackingId}</p></div>`
        : '';

    const html = baseTemplate(`
      <div class="header" style="background:linear-gradient(135deg,${meta.color},${meta.color}cc);">
        <h1>Order ${meta.label}</h1>
        <p>Medicare Pharmacy</p>
      </div>
      <div class="body">
        <span class="badge" style="background:${meta.bg};color:${meta.color};">${meta.label}</span>
        <p>Dear <strong>${customerName}</strong>,</p>
        <p>${meta.msg}</p>
        <div class="info-box"><p><strong>Order number:</strong> ${order.orderNumber}</p></div>
        ${tracking}
        ${note ? `<p style="color:#555;font-size:13px;"><strong>Note:</strong> ${note}</p>` : ''}
      </div>`);

    await send(to, `Order ${meta.label} – ${order.orderNumber} – Medicare Pharmacy`, html);
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
