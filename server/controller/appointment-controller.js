import Appointment from "../model/AppointmentSchema.js";

export const createAppointment = async (req, res) => {
  const { userId, doctorId, doctorName, customerName, date, customerEmail } = req.body;

  if (!userId || !doctorId || !doctorName || !customerName || !date || !customerEmail) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const appointment = new Appointment({
      userId,
      doctorId,
      doctorName,
      customerName,
      customerEmail,
      date,
    });

    await appointment.save();
    res
      .status(201)
      .json({ message: "Appointment created successfully", appointment });
  } catch (error) {
    console.error("Error saving appointment:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  const { date } = req.body;

  try {
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const newDate = new Date(date);
    if (isNaN(newDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Check if appointment exists first
    const appointmentExists = await Appointment.exists({ _id: appointmentId });
    if (!appointmentExists) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if new slot is taken
    const slotTaken = await Appointment.findOne({
      doctorId: appointmentExists.doctorId, // might need to fetch doctorId separately if .exists() returns boolean only
      date: newDate,
      _id: { $ne: appointmentId },
    });

    if (slotTaken) {
      return res.status(400).json({ message: 'New time slot already booked' });
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { date: newDate },
      { new: true, runValidators: true }
    );

    return res.json({ message: 'Appointment rescheduled successfully', updatedAppointment });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return res.status(500).json({ message: error.message || 'Failed to update appointment' });
  }
};

// controllers/doctorController.js

export const getDoctorAppointments = async (req, res) => {
  try {
    const doctorId = req.params.id;
    console.log("Doctor ID:", doctorId);

    const appointments = await Appointment.find({ doctorId }).populate('userId');
    
    res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    console.error("Error fetching doctor appointments:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

