import Appointment from '../model/AppointmentSchema.js';
import nodemailer from 'nodemailer';

// Setup transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'akc64016@gmail.com',
    pass: 'udwg xwhv hgle xnqh', // app password
  },
});

// Centralized email sender
const sendNotification = async (to, subject, text) => {
  if (!to) {
    console.warn('No recipient email found. Skipping email notification.');
    return;
  }
  try {
    await transporter.sendMail({
      from: 'akc64016@gmail.com',
      to,
      subject,
      text,
    });
  } catch (err) {
    console.error('Error sending email:', err);
  }
};

// 🔥 Permanently delete appointment
export const cancelAppointment = async (req, res) => {
  const appointmentId = req.params.id;
  try {
    const deleted = await Appointment.findByIdAndDelete(appointmentId);
    if (!deleted) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    await sendNotification(
      deleted.customerEmail,
      'Appointment Cancelled',
      `Dear ${deleted.customerName || 'User'}, your appointment on ${new Date(deleted.date).toLocaleString()} has been cancelled.`
    );

    res.status(200).json({ message: 'Appointment cancelled successfully' });
  } catch (err) {
    console.error('Error cancelling appointment:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 🩺 Soft cancel by Doctor
export const cancelAppointmentByDoctor = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    await sendNotification(
      appointment.customerEmail,
      'Appointment Cancelled by Doctor',
      `Dear ${appointment.customerName || 'User'}, your appointment scheduled on ${new Date(appointment.date).toLocaleString()} has been cancelled by the doctor.`
    );

    res.status(200).json({ success: true, data: appointment });
  } catch (err) {
    console.error('Error cancelling appointment:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// 🔁 Reschedule appointment
export const rescheduleAppointment = async (req, res) => {
  const { newDate } = req.body;

  if (!newDate) {
    return res.status(400).json({ success: false, message: 'New date is required.' });
  }

  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { date: newDate, status: 'rescheduled' },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    await sendNotification(
      appointment.customerEmail,
      'Appointment Rescheduled',
      `Dear ${appointment.customerName || 'User'}, your appointment has been rescheduled to ${new Date(newDate).toLocaleString()}.`
    );

    res.status(200).json({ success: true, data: appointment });
  } catch (err) {
    console.error('Error rescheduling appointment:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
