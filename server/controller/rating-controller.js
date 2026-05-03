import Appointment from '../model/AppointmentSchema.js';
import Image from '../model/ImageSchema.js';

export const submitRating = async (req, res) => {
    const { appointmentId, rating, review } = req.body;

    if (!appointmentId || !rating) {
        return res.status(400).json({ success: false, message: 'appointmentId and rating are required.' });
    }

    if (rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
    }

    try {
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found.' });
        }

        if (appointment.rating) {
            return res.status(400).json({ success: false, message: 'This appointment has already been rated.' });
        }

        appointment.rating = rating;
        if (review) appointment.review = review;
        await appointment.save();

        // Recalculate doctor's average rating from all rated appointments
        const rated = await Appointment.find({
            doctorId: appointment.doctorId,
            rating: { $exists: true, $ne: null },
        });

        const totalRatings = rated.length;
        const averageRating = rated.reduce((sum, a) => sum + a.rating, 0) / totalRatings;

        await Image.findByIdAndUpdate(appointment.doctorId, {
            averageRating: Math.round(averageRating * 10) / 10,
            totalRatings,
        });

        res.json({ success: true, averageRating, totalRatings });
    } catch (err) {
        console.error('Error submitting rating:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};
