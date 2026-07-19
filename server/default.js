import { doctors } from "./constants/data.js";
import { seedCategories, seedMedicines } from "./constants/pharmacy-seed.js";
import { seedHospitals } from "./constants/blood-seed.js";
import Doctor from "./model/DoctorSchema.js";
import Category from "./model/CategorySchema.js";
import Medicine from "./model/MedicineSchema.js";
import BloodHospital from "./model/BloodHospitalSchema.js";

const seedDoctors = async () => {
  try {
    const count = await Doctor.countDocuments();
    if (count > 0) return;
    await Doctor.insertMany(doctors);
    console.log('Doctors inserted successfully');
  } catch (error) {
    console.log('Error while inserting doctors:', error.message);
  }
};

const seedPharmacy = async () => {
  try {
    // categories
    const existingCats = await Category.countDocuments();
    if (existingCats === 0) {
      await Category.insertMany(seedCategories);
      console.log('Pharmacy categories inserted');
    }

    // medicines
    const existingMeds = await Medicine.countDocuments();
    if (existingMeds === 0) {
      const cats = await Category.find({});
      const catBySlug = Object.fromEntries(cats.map((c) => [c.slug, c._id]));

      const docs = seedMedicines.map((m) => {
        const { categorySlug, ...rest } = m;
        return {
          ...rest,
          slug: `${m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`,
          category: catBySlug[categorySlug],
        };
      });
      await Medicine.insertMany(docs);
      console.log('Pharmacy medicines inserted');
    }
  } catch (error) {
    console.log('Error while inserting pharmacy seed:', error.message);
  }
};

const seedBloodBank = async () => {
  try {
    const count = await BloodHospital.countDocuments();
    if (count > 0) return;
    await BloodHospital.insertMany(seedHospitals);
    console.log('Blood bank hospitals inserted');
  } catch (error) {
    console.log('Error while inserting blood bank hospitals:', error.message);
  }
};

const DefaultData = async () => {
  await seedDoctors();
  await seedPharmacy();
  await seedBloodBank();
};

export default DefaultData;
