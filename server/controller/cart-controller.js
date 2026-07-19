import Cart from '../model/CartSchema.js';
import Medicine from '../model/MedicineSchema.js';

const populateCart = (userId) =>
  Cart.findOne({ userId }).populate('items.medicineId', 'name price mrp images stock prescriptionRequired isActive');

const summarize = (cart) => {
  if (!cart) return { items: [], subtotal: 0, itemCount: 0, prescriptionRequired: false };
  let subtotal = 0;
  let prescriptionRequired = false;
  const items = cart.items.map((it) => {
    const med = it.medicineId;
    const line = (med?.price ?? it.priceSnapshot) * it.quantity;
    subtotal += line;
    if (med?.prescriptionRequired) prescriptionRequired = true;
    return {
      medicine: med,
      quantity: it.quantity,
      priceSnapshot: it.priceSnapshot,
      lineTotal: line,
    };
  });
  return {
    _id: cart._id,
    userId: cart.userId,
    items,
    itemCount: items.reduce((n, it) => n + it.quantity, 0),
    subtotal,
    prescriptionRequired,
  };
};

export const getCart = async (req, res) => {
  try {
    const userId = req.user._id;
    let cart = await populateCart(userId);
    if (!cart) cart = await Cart.create({ userId, items: [] });
    res.json(summarize(cart));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { medicineId, quantity = 1 } = req.body;
    if (!medicineId || quantity < 1) {
      return res.status(400).json({ message: 'medicineId and positive quantity required' });
    }

    const medicine = await Medicine.findById(medicineId);
    if (!medicine || !medicine.isActive) {
      return res.status(404).json({ message: 'Medicine not available' });
    }
    if (medicine.stock < quantity) {
      return res.status(400).json({ message: `Only ${medicine.stock} in stock` });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) cart = new Cart({ userId, items: [] });

    const existing = cart.items.find((it) => it.medicineId.toString() === medicineId);
    if (existing) {
      const newQty = existing.quantity + quantity;
      if (medicine.stock < newQty) {
        return res.status(400).json({ message: `Only ${medicine.stock} in stock` });
      }
      existing.quantity = newQty;
      existing.priceSnapshot = medicine.price;
    } else {
      cart.items.push({ medicineId, quantity, priceSnapshot: medicine.price });
    }

    await cart.save();
    const populated = await populateCart(userId);
    res.json(summarize(populated));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { medicineId, quantity } = req.body;
    if (!medicineId || quantity == null) {
      return res.status(400).json({ message: 'medicineId and quantity required' });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const item = cart.items.find((it) => it.medicineId.toString() === medicineId);
    if (!item) return res.status(404).json({ message: 'Item not in cart' });

    if (quantity <= 0) {
      cart.items = cart.items.filter((it) => it.medicineId.toString() !== medicineId);
    } else {
      const medicine = await Medicine.findById(medicineId);
      if (!medicine || medicine.stock < quantity) {
        return res.status(400).json({ message: `Only ${medicine?.stock ?? 0} in stock` });
      }
      item.quantity = quantity;
      item.priceSnapshot = medicine.price;
    }

    await cart.save();
    const populated = await populateCart(userId);
    res.json(summarize(populated));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { medicineId } = req.params;
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });
    cart.items = cart.items.filter((it) => it.medicineId.toString() !== medicineId);
    await cart.save();
    const populated = await populateCart(userId);
    res.json(summarize(populated));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;
    await Cart.findOneAndUpdate({ userId }, { items: [] }, { upsert: true });
    res.json({ items: [], subtotal: 0, itemCount: 0, prescriptionRequired: false });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
