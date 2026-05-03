import Appointment from '../model/AppointmentSchema.js';
import { sendCancellationNotice, sendRescheduleNotice } from '../utils/mailer.js';

export const cancelAppointment = async (req, res) => {
  const appointmentId = req.params.id;
  try {
    const deleted = await Appointment.findByIdAndDelete(appointmentId);
    if (!deleted) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    sendCancellationNotice({
      to: deleted.customerEmail,
      customerName: deleted.customerName,
      doctorName: deleted.doctorName,
      date: deleted.date,
      cancelledBy: 'patient',
    });

    res.status(200).json({ message: 'Appointment cancelled successfully' });
  } catch (err) {
    console.error('Error cancelling appointment:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

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

    sendCancellationNotice({
      to: appointment.customerEmail,
      customerName: appointment.customerName,
      doctorName: appointment.doctorName,
      date: appointment.date,
      cancelledBy: 'doctor',
    });

    res.status(200).json({ success: true, data: appointment });
  } catch (err) {
    console.error('Error cancelling appointment:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const rescheduleAppointment = async (req, res) => {
  const { newDate } = req.body;

  if (!newDate) {
    return res.status(400).json({ success: false, message: 'New date is required.' });
  }

  try {
    const existing = await Appointment.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const oldDate = existing.date;

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { date: newDate, status: 'rescheduled' },
      { new: true }
    );

    sendRescheduleNotice({
      to: appointment.customerEmail,
      customerName: appointment.customerName,
      doctorName: appointment.doctorName,
      oldDate,
      newDate,
    });

    res.status(200).json({ success: true, data: appointment });
  } catch (err) {
    console.error('Error rescheduling appointment:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
