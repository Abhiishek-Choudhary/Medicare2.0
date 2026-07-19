import Prescription from '../model/PrescriptionSchema.js';

export const uploadPrescription = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'file required' });
    const prescription = await Prescription.create({
      userId: req.user._id,
      fileUrl: `/uploads/${req.file.filename}`,
      originalName: req.file.originalname,
      status: 'pending',
    });
    res.status(201).json(prescription);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const listUserPrescriptions = async (req, res) => {
  try {
    const targetUser = req.params.userId || req.user._id;
    // customers can only see their own
    if (req.user.role === 'customer' && targetUser.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const prescriptions = await Prescription.find({ userId: targetUser }).sort({ createdAt: -1 });
    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const listPendingPrescriptions = async (_req, res) => {
  try {
    const prescriptions = await Prescription.find({ status: 'pending' })
      .populate('userId', 'username email')
      .sort({ createdAt: 1 });
    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const verifyPrescription = async (req, res) => {
  try {
    const { action, reason } = req.body; // 'verify' | 'reject'
    if (!['verify', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'action must be verify or reject' });
    }

    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });

    prescription.status = action === 'verify' ? 'verified' : 'rejected';
    prescription.verifiedBy = req.user._id;
    prescription.verifiedAt = new Date();
    if (action === 'reject') prescription.rejectionReason = reason;
    await prescription.save();

    res.json(prescription);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
