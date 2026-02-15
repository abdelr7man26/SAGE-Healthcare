const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { body } = require('express-validator');

// استيراد الكنترولرز صح
const { updateProfile, approveDoctor } = require('../Controllers/doctorController');
const { createSlots } = require('../Controllers/slotController'); // تأكد إنها createSlots بالجمع

// 1. إضافة مواعيد (استخدم الاسم الصح للفانكشن)
router.post('/add-slot', auth, authorize('doctor'), createSlots);


// 3. اعتماد دكتور (أدمن)
router.patch('/approve/:doctorId', auth, authorize('admin'), approveDoctor);

// 4. تحديث البروفايل
router.put('/profile', [
    body('specialization').notEmpty().withMessage('Specialization is required'),
    body('degree').notEmpty().withMessage('Degree is required'),
    body('bio').notEmpty().withMessage('Bio is required'),
    body('consultationFee').isNumeric().withMessage('Consultation fee must be a number')
], auth, authorize('doctor'), updateProfile);

// 5. تعديل الـ Availability (لو محتاجها)
// تأكد إن الكنترولر مفيهوش فانكشن اسمها setAvailability، استبدلها بـ createSlots
router.post('/availability', [
    body('slots').isArray({ min: 1 }).withMessage('At least one slot is required')
], auth, authorize('doctor'), createSlots);

module.exports = router;