import BloodDonor, { BLOOD_GROUPS, MONTHS } from '../model/BloodDonorSchema.js';
import BloodHospital from '../model/BloodHospitalSchema.js';

// ── Public: search donors ─────────────────────────────────────
export const searchDonors = async (req, res) => {
    try {
        const { bloodGroup, city, month, page = 1, limit = 20 } = req.query;
        const filter = { isActive: true };
        if (bloodGroup) filter.bloodGroup = bloodGroup;
        if (city) filter.city = { $regex: city, $options: 'i' };
        if (month) filter.availableMonths = month;

        const skip = (Number(page) - 1) * Number(limit);
        const [items, total] = await Promise.all([
            BloodDonor.find(filter)
                .select(BASE_SEARCH_FIELDS)
                .sort({ verified: -1, updatedAt: -1 })
                .skip(skip).limit(Number(limit)),
            BloodDonor.countDocuments(filter),
        ]);

        // Hide contact info if donor opted out
        const sanitized = items.map((d) => sanitizeForPublic(d));

        res.json({ items: sanitized, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const BASE_SEARCH_FIELDS = 'fullName phone email bloodGroup city state pincode availableMonths verified showContactInfo lastDonationDate age gender';

const sanitizeForPublic = (donor) => {
    const d = donor.toObject ? donor.toObject() : donor;
    if (!d.showContactInfo) {
        d.phone = 'Hidden by donor';
        d.email = 'Hidden by donor';
    }
    return d;
};

// ── Public: single donor detail ───────────────────────────────
export const getDonorPublic = async (req, res) => {
    try {
        const donor = await BloodDonor.findById(req.params.id).select(BASE_SEARCH_FIELDS);
        if (!donor || !donor.isActive) return res.status(404).json({ message: 'Donor not found' });
        res.json(sanitizeForPublic(donor));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── Authenticated: register / update my donor profile ─────────
export const registerDonor = async (req, res) => {
    try {
        const existing = await BloodDonor.findOne({ userId: req.user._id });
        if (existing) {
            return res.status(409).json({ message: 'You are already registered as a donor. Use update instead.' });
        }
        const payload = { ...req.body, userId: req.user._id, email: req.body.email || req.user.email };
        // sensible defaults
        if (!payload.availableMonths || payload.availableMonths.length === 0) {
            return res.status(400).json({ message: 'Select at least one available month' });
        }

        const donor = await BloodDonor.create(payload);
        res.status(201).json(donor);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getMyDonorProfile = async (req, res) => {
    try {
        const donor = await BloodDonor.findOne({ userId: req.user._id });
        res.json(donor); // null if not registered
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updateMyDonorProfile = async (req, res) => {
    try {
        const donor = await BloodDonor.findOne({ userId: req.user._id });
        if (!donor) return res.status(404).json({ message: 'Not registered as a donor' });

        // Prevent role/verification tampering
        const disallowed = ['userId', 'verified'];
        const updates = { ...req.body };
        for (const k of disallowed) delete updates[k];

        Object.assign(donor, updates);
        await donor.save();
        res.json(donor);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const deleteMyDonorProfile = async (req, res) => {
    try {
        const donor = await BloodDonor.findOneAndDelete({ userId: req.user._id });
        if (!donor) return res.status(404).json({ message: 'Not registered as a donor' });
        res.json({ message: 'Donor profile removed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── Public: list hospitals / blood banks ──────────────────────
export const listHospitals = async (req, res) => {
    try {
        const { city, type, bloodGroup } = req.query;
        const filter = { isActive: true };
        if (city) filter.city = { $regex: city, $options: 'i' };
        if (type) filter.type = type;
        if (bloodGroup) filter.bloodGroupsAvailable = bloodGroup;

        const items = await BloodHospital.find(filter).sort({ is24x7: -1, name: 1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── Admin: donor management ───────────────────────────────────
export const adminListDonors = async (req, res) => {
    try {
        const { q, bloodGroup, verified, page = 1, limit = 30 } = req.query;
        const filter = {};
        if (bloodGroup) filter.bloodGroup = bloodGroup;
        if (verified !== undefined) filter.verified = verified === 'true';
        if (q) {
            filter.$or = [
                { fullName: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } },
                { phone: { $regex: q, $options: 'i' } },
                { city: { $regex: q, $options: 'i' } },
            ];
        }
        const skip = (Number(page) - 1) * Number(limit);
        const [items, total] = await Promise.all([
            BloodDonor.find(filter).populate('userId', 'username email').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
            BloodDonor.countDocuments(filter),
        ]);
        res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const adminVerifyDonor = async (req, res) => {
    try {
        const donor = await BloodDonor.findByIdAndUpdate(
            req.params.id,
            { verified: !!req.body.verified },
            { new: true }
        );
        if (!donor) return res.status(404).json({ message: 'Donor not found' });
        res.json(donor);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const adminDeleteDonor = async (req, res) => {
    try {
        const donor = await BloodDonor.findByIdAndDelete(req.params.id);
        if (!donor) return res.status(404).json({ message: 'Donor not found' });
        res.json({ message: 'Donor removed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── Admin: hospital CRUD ──────────────────────────────────────
export const adminCreateHospital = async (req, res) => {
    try {
        const hospital = await BloodHospital.create(req.body);
        res.status(201).json(hospital);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const adminUpdateHospital = async (req, res) => {
    try {
        const hospital = await BloodHospital.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
        res.json(hospital);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const adminDeleteHospital = async (req, res) => {
    try {
        const hospital = await BloodHospital.findByIdAndDelete(req.params.id);
        if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
        res.json({ message: 'Hospital deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── Meta ──────────────────────────────────────────────────────
export const getBloodMeta = (_req, res) => {
    res.json({ bloodGroups: BLOOD_GROUPS, months: MONTHS });
};
