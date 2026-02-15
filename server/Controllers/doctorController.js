const DoctorProfile = require('../models/DoctorProfile');
const { validationResult } = require('express-validator');
const User = require('../models/User');

// Update doctor profile
const updateProfile = async (request, response) => {
    if (request.user.role !== 'doctor') {
    return response.status(403).json({ message: 'Access denied. Only doctors can update this profile.' });
    }
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
        return response.status(400).json({ errors: errors.array() });
    }

    const { specialization, degree, bio, consultationFee, address} = request.body;

    try {
        const profile = await DoctorProfile.findOneAndUpdate(
            { user: request.user.id },
            { specialization, degree, bio, consultationFee, address },
            { new: true, upsert: true, runValidators: true}
        );

        response.status(200).json({
        message: 'Profile updated successfully',
        profile: profile 
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        response.status(500).json({ message: 'Server error' });
    }
};

const approveDoctor = async (request, response) => {
    try {
        // 1. استلام الـ ID من الرابط (Params)
        const { doctorId } = request.params; 

        // 2. التحديث: بنخلي isApproved بـ true
        // ملحوظة: doctorId هنا هو الـ ID بتاع الـ Profile نفسه مش الـ User
        const profile = await DoctorProfile.findByIdAndUpdate(
            doctorId,
            { isApproved: true },
            { new: true }
        ).populate('user', 'name email'); // بنجيب بيانات اليوزر عشان نبعت إيميل مثلاً

        if (!profile) {
            return response.status(404).json({ message: 'لم يتم العثور على ملف الطبيب' });
        }

        // 3. (اختياري لكن احترافي) ممكن نبعت إيميل للدكتور هنا نبلغه إن حسابه اتفعل
        await transporter.sendMail({
            to: profile.user.email,
            subject: 'تهانينا! تم تفعيل حسابك',
            text: `دكتور ${profile.user.name}، يمكنك الآن البدء في استقبال الحجوزات.`
        }); 
        

        response.status(200).json({
            message: 'تمت الموافقة على الطبيب بنجاح، ويمكنه الآن استقبال الحجوزات',
            profile
        });
    } catch (error) {
        console.error('Error approving doctor:', error);
        response.status(500).json({ message: 'حدث خطأ في السيرفر' });
    }
};



module.exports = { updateProfile, approveDoctor };
