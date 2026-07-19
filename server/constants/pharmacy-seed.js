export const seedCategories = [
  { name: 'Pain Relief',     slug: 'pain-relief' },
  { name: 'Cold & Fever',    slug: 'cold-fever' },
  { name: 'Diabetes Care',   slug: 'diabetes-care' },
  { name: 'Vitamins & Supplements', slug: 'vitamins-supplements' },
  { name: 'Skin Care',       slug: 'skin-care' },
  { name: 'Antibiotics',     slug: 'antibiotics' },
];

// Prices in INR. images left empty; add to /uploads and set paths later.
export const seedMedicines = [
  {
    name: 'Paracetamol 500mg', sku: 'PARA500-10T', brand: 'Crocin', manufacturer: 'GSK',
    description: 'Pain reliever and fever reducer.', composition: 'Paracetamol 500mg',
    dosageForm: 'tablet', strength: '500mg', packSize: '10 tablets',
    price: 25, mrp: 30, stock: 500,
    categorySlug: 'pain-relief', tags: ['fever', 'headache'], prescriptionRequired: false,
  },
  {
    name: 'Ibuprofen 400mg', sku: 'IBU400-10T', brand: 'Brufen', manufacturer: 'Abbott',
    description: 'Anti-inflammatory pain reliever.', composition: 'Ibuprofen 400mg',
    dosageForm: 'tablet', strength: '400mg', packSize: '10 tablets',
    price: 45, mrp: 55, stock: 300,
    categorySlug: 'pain-relief', tags: ['pain', 'inflammation'], prescriptionRequired: false,
  },
  {
    name: 'Cetirizine 10mg', sku: 'CETI10-10T', brand: 'Cetzine', manufacturer: 'Dr. Reddy',
    description: 'Antihistamine for allergy and cold.', composition: 'Cetirizine 10mg',
    dosageForm: 'tablet', strength: '10mg', packSize: '10 tablets',
    price: 30, mrp: 40, stock: 400,
    categorySlug: 'cold-fever', tags: ['allergy', 'cold'], prescriptionRequired: false,
  },
  {
    name: 'Metformin 500mg', sku: 'MET500-15T', brand: 'Glycomet', manufacturer: 'USV',
    description: 'Oral anti-diabetic medication.', composition: 'Metformin HCl 500mg',
    dosageForm: 'tablet', strength: '500mg', packSize: '15 tablets',
    price: 55, mrp: 70, stock: 200,
    categorySlug: 'diabetes-care', tags: ['diabetes'], prescriptionRequired: true,
  },
  {
    name: 'Amoxicillin 500mg', sku: 'AMOX500-10C', brand: 'Mox', manufacturer: 'Cipla',
    description: 'Broad-spectrum antibiotic.', composition: 'Amoxicillin 500mg',
    dosageForm: 'capsule', strength: '500mg', packSize: '10 capsules',
    price: 90, mrp: 110, stock: 150,
    categorySlug: 'antibiotics', tags: ['antibiotic'], prescriptionRequired: true,
  },
  {
    name: 'Vitamin D3 60000 IU', sku: 'VITD3-4S', brand: 'Uprise-D3', manufacturer: 'Alkem',
    description: 'Weekly vitamin D3 supplement.', composition: 'Cholecalciferol 60000 IU',
    dosageForm: 'other', strength: '60000 IU', packSize: '4 sachets',
    price: 120, mrp: 150, stock: 250,
    categorySlug: 'vitamins-supplements', tags: ['vitamin', 'supplement'], prescriptionRequired: false,
  },
];
