const DoctorProfile = require('../models/DoctorProfile');
const User = require('../models/User');
const Booking = require('../models/Booking'); 

// 1. جلب جميع الدكاترة المعتمدين (للمريض)
const getAllDoctors = async (req, res) => {
    try {
        const doctors = await DoctorProfile.find({ isApproved: true })
            .populate('user', 'name email') // نجيب الاسم من موديل اليوزر
            .populate({
                path: 'availableSlots', // الـ Virtual اللي عملناه في الموديل
                match: { isAvailable: true }, // هات المواعيد الفاضية بس
                select: 'date startTime endTime' 
            })
            .select('specialization degree bio consultationFee address availableSlots');

        res.status(200).json({
            message: 'تم جلب قائمة الأطباء بنجاح',
            count: doctors.length,
            doctors
        });
    } catch (error) {
        console.error('Error retrieving doctors:', error);
        res.status(500).json({ message: 'خطأ في السيرفر' });
    }
};

// 2. جلب دكتور معين بـ ID (صفحة البروفايل للمريض)
const getDoctorById = async (req, res) => {
    try {
        const { id } = req.params;

        const doctor = await DoctorProfile.findOne({ _id: id, isApproved: true })
            .populate('user', 'name email')
            .populate({
                path: 'availableSlots',
                match: { isAvailable: true },
                select: 'date startTime endTime'
            });

        if (!doctor) {
            return res.status(404).json({ message: 'الطبيب غير موجود' });
        }

        res.status(200).json({
            message: 'تم جلب بيانات الطبيب بنجاح',
            doctor
        });
    } catch (error) {
        console.error('Error retrieving doctor:', error);
        // لو الـ ID مبعوت بصيغة غلط
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'معرف الطبيب غير صحيح' });
        }
        res.status(500).json({ message: 'خطأ في السيرفر' });
    }
};

const getMe = async (req, res) => {
    try {
        // بنجيب بيانات اليوزر من الـ ID اللي في التوكن
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'المستخدم غير موجود' });
        }
        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في السيرفر' });
    }
};

const updateMe = async (req, res) => {
    try {
        // 1. نحدد الحقول المسموح بتعديلها فقط (عشان الأمان)
        const allowedUpdates = ['name', 'phone', 'gender', 'age'];
        const updates = {};
        
        Object.keys(req.body).forEach((key) => {
            if (allowedUpdates.includes(key)) {
                updates[key] = req.body[key];
            }
        });

        // 2. تحديث البيانات
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({
            message: 'تم تحديث البيانات بنجاح',
            user: updatedUser
        });
    } catch (error) {
        console.error('Update Error:', error);
        res.status(500).json({ message: 'خطأ في تحديث البيانات' });
    }
};

module.exports = { getAllDoctors, getDoctorById, updateMe, getMe };