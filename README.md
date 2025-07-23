# 🏥 Doctor Availability & Appointment Allocator

This is a full-stack medical appointment booking platform developed as my **Final Year Project** using the **MERN stack**.  
It enables patients to book appointments with doctors based on real-time availability and handles appointment scheduling, payments, and notifications.

🩺 Separate panels for **Doctors** and **Users**  
💳 Integrated **Razorpay** payment gateway  
📧 Email notifications using **Nodemailer**

> 🚧 **Note:** This project is **not deployed yet**.  
> Please clone the repository and follow the setup instructions to run it locally.

---

## 📌 Features

### 👨‍⚕️ Doctor Panel
- Manage availability (dates & time slots)
- Receive real-time email notifications for new appointments
- View upcoming and past appointments
- Accept/Reject appointments (optional)

### 👤 User Panel
- Browse available doctors by specialization/date
- Schedule appointments and make secure payments
- Modify or cancel appointments before confirmation
- Receive email confirmations & reminders

### 💸 Payment
- Razorpay integration for secure appointment payment

### 📬 Email System
- Automatic email sent via **Nodemailer**:
  - Doctor receives email when user books an appointment
  - User gets confirmation/reminder or rescheduling email

### 🧠 Additional Features
- Auth with JWT
- Protected routes for doctor and user dashboards
- Fully responsive UI
- Admin-like control over schedules

---

## 🧰 Tech Stack

| Layer        | Tech                                      |
|--------------|-------------------------------------------|
| Frontend     | React.js (with Elastic UI / Tailwind)     |
| Backend      | Node.js + Express.js                      |
| Database     | MongoDB Atlas                             |
| Payment      | Razorpay                                  |
| Email        | Nodemailer                                |
| Auth         | JWT + Bcrypt                              |

---

## 📂 Folder Structure

medical-app/
├── client/ # React frontend
│ └── src/
│ ├── pages/
│ ├── components/
│ └── services/
├── server/ # Express backend
│ ├── controllers/
│ ├── models/
│ ├── routes/
│ ├── utils/ # nodemailer, Razorpay setup
│ └── middleware/
├── .env
├── README.md
└── package.json

yaml
Copy
Edit

---

## ⚙️ Local Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Abhiishek-Choudhary/Medicare2.0.git
cd medical-app

2. Setup Backend
bash
cd server
npm install

Create a .env file with:
env
PORT=5000
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=youremail@example.com
SMTP_PASS=your_email_password
bash
npm run dev

3. Setup Frontend
bash
cd ../client
npm install
npm run dev
Visit http://localhost:5173

📧 Email Flow (Using Nodemailer)
When user books → Doctor gets a confirmation email with details

When doctor updates → User is notified

When user cancels/reschedules → Both parties receive updates

📬 Contact
👤 Name: Abhishek Chaudhary

📧 Email: akc64016@gmail.com

🐙 GitHub: @Abhiishek-Choudhary

🔗 LinkedIn: (https://www.linkedin.com/in/abhishek-chaudhary-2b276324b/)

🧪 Future Enhancements (Ideas)
Real-time chat between doctor and user

Video consultation via WebRTC / third-party API

Admin dashboard for managing specializations/doctors

SMS notifications using Twilio

Mobile app with React Native
