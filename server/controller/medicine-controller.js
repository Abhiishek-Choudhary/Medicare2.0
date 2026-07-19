import Medicine from '../model/MedicineSchema.js';
import Category from '../model/CategorySchema.js';
import Hospital from '../model/HospitalSchema.js';

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const listMedicines = async (req, res) => {
  try {
    const {
      q,
      category,
      hospitalId,
      minPrice,
      maxPrice,
      prescriptionRequired,
      page = 1,
      limit = 20,
      sort = 'newest',
    } = req.query;

    const filter = { isActive: true };

    if (hospitalId) {
      const hospital = await Hospital.findById(hospitalId).select('inHouseMedicineIds');
      if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
      filter._id = { $in: hospital.inHouseMedicineIds };
    }

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { composition: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
      ];
    }

    if (category) {
      // accept id or slug
      if (category.match(/^[0-9a-f]{24}$/i)) {
        filter.category = category;
      } else {
        const cat = await Category.findOne({ slug: category });
        if (cat) filter.category = cat._id;
        else return res.json({ items: [], total: 0, page: Number(page), pages: 0 });
      }
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (prescriptionRequired !== undefined) {
      filter.prescriptionRequired = prescriptionRequired === 'true';
    }

    const sortMap = {
      newest: { createdAt: -1 },
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      name_asc: { name: 1 },
    };

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Medicine.find(filter)
        .populate('category', 'name slug')
        .sort(sortMap[sort] || sortMap.newest)
        .skip(skip)
        .limit(Number(limit)),
      Medicine.countDocuments(filter),
    ]);

    res.json({
      items,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMedicineById = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id).populate('category', 'name slug');
    if (!medicine || !medicine.isActive) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    res.json(medicine);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createMedicine = async (req, res) => {
  try {
    const body = { ...req.body };
    if (!body.name || body.price == null || body.mrp == null || !body.sku) {
      return res.status(400).json({ message: 'name, sku, price, mrp are required' });
    }
    body.slug = body.slug || `${slugify(body.name)}-${Date.now().toString(36)}`;
    const medicine = await Medicine.create(body);
    res.status(201).json(medicine);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateMedicine = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.name && !updates.slug) updates.slug = slugify(updates.name);
    const medicine = await Medicine.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!medicine) return res.status(404).json({ message: 'Medicine not found' });
    res.json(medicine);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!medicine) return res.status(404).json({ message: 'Medicine not found' });
    res.json({ message: 'Medicine deactivated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateStock = async (req, res) => {
  try {
    const { stock } = req.body;
    if (stock == null || stock < 0) {
      return res.status(400).json({ message: 'valid stock required' });
    }
    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      { stock },
      { new: true }
    );
    if (!medicine) return res.status(404).json({ message: 'Medicine not found' });
    res.json(medicine);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
