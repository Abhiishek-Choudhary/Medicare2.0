import Address from '../model/AddressSchema.js';

export const listAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.user._id }).sort({ isDefault: -1, updatedAt: -1 });
    res.json(addresses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createAddress = async (req, res) => {
  try {
    const body = { ...req.body, userId: req.user._id };
    if (body.isDefault) {
      await Address.updateMany({ userId: req.user._id }, { isDefault: false });
    }
    const address = await Address.create(body);
    res.status(201).json(address);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, userId: req.user._id });
    if (!address) return res.status(404).json({ message: 'Address not found' });
    if (req.body.isDefault) {
      await Address.updateMany({ userId: req.user._id }, { isDefault: false });
    }
    Object.assign(address, req.body);
    await address.save();
    res.json(address);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!address) return res.status(404).json({ message: 'Address not found' });
    res.json({ message: 'Address deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
