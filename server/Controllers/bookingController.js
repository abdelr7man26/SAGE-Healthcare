const Booking = require('../models/Booking');
const sendEmail = require('../Utils/emailService');
const DoctorProfile = require('../models/DoctorProfile');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Slot = require('../models/slots');

// Create a new booking (Atomic operation)
const createBooking = async (request, response) => {
    const { doctorId, slotId } = request.body; // doctorId هو ID الـ DoctorProfile
    const patientId = request.user.id;

    try {
        // 1. التأكد من وجود بروفايل الدكتور وسحب السعر الحالي (Price Stability)
        const doctorProfile = await DoctorProfile.findById(doctorId).populate('user', 'name email');
        if (!doctorProfile) {
            return response.status(404).json({ message: 'دكتور غير موجود' });
        }

        // 2. تحديث الميعاد ليكون "غير متاح" (Atomic Update لمنع الحجز المزدوج)
        // بنحدث الميعاد بشرط إنه يكون لسه متاح isAvailable: true
        const updatedSlot = await Slot.findOneAndUpdate(
            { _id: slotId, isAvailable: true },
            { $set: { isAvailable: false } },
            { new: true }
        );

        // لو الـ updatedSlot مرجعش حاجة، يبقى حد حجز الميعاد ده في الجزء من الثانية اللي فات
        if (!updatedSlot) {
            return response.status(400).json({ message: 'عذراً، هذا الموعد تم حجزه للتو أو غير متاح' });
        }

        // 3. منع حجز مواعيد في الماضي (اختياري لو إنت بتنظف المواعيد أول بأول)
        if (new Date(updatedSlot.date) < new Date().setHours(0,0,0,0)) {
            // لو طلع في الماضي، نرجع الميعاد متاح تاني قبل ما نقفل الطلب
            await Slot.findByIdAndUpdate(slotId, { isAvailable: true });
            return response.status(400).json({ message: 'لا يمكن حجز موعد في الماضي' });
        }

        // 4. إنشاء سجل الحجز (Storing Price & Details)
        const booking = new Booking({
            patient: patientId,
            doctor: doctorProfile.user._id, // الـ User ID بتاع الدكتور
            doctorProfile: doctorId,         // الـ Profile ID
            slotId: slotId,
            slotDetails: {
                date: updatedSlot.date,
                startTime: updatedSlot.startTime,
                endTime: updatedSlot.endTime
            },
            status: 'confirmed',
            consultationFee: doctorProfile.consultationFee // تثبيت السعر وقت الحجز
        });

        await booking.save();

        // 5. إرسال إيميل التأكيد (Logic سليم زي ما عملته)
        try {
            const patientUser = await User.findById(patientId);
            if (patientUser && patientUser.email) {
                await sendEmail({
                    email: patientUser.email,
                    subject: 'تأكيد حجز موعد طبي - Sage Healthcare',
                    message: `تم حجز موعدك بنجاح مع دكتور ${doctorProfile.user.name}. الموعد: ${updatedSlot.date.toDateString()} الساعة ${updatedSlot.startTime}.`
                });
            }
        } catch (emailError) {
            console.error('Email error:', emailError);
        }

        // 6. الرد النهائي
        const responseData = await Booking.findById(booking._id)
            .populate('doctor', 'name')
            .populate('doctorProfile', 'specialization');

        response.status(201).json({
            message: 'تم الحجز بنجاح',
            booking: responseData
        });

    } catch (error) {
        console.error('Booking Error:', error);
        // في حالة حدوث خطأ كارثي، يفضل محاولة إعادة الميعاد لـ متاح (إلا لو الحجز اتعمل فعلاً)
        response.status(500).json({ message: 'حدث خطأ في السيرفر' });
    }
};

// Get all bookings for a doctor
const getDoctorBookings = async (request, response) => {
    try {
        // حماية: التأكد إن اللي بيطلب هو دكتور
        if (request.user.role !== 'doctor') {
            return response.status(403).json({ message: 'دخول ممنوع' });
        }

        // البحث مباشرة بـ User ID بتاع الدكتور (أسرع وأقل ضغط على الداتا بيز)
        // وبنعمل populate لتفاصيل المريض، وتفاصيل البروفايل لو احتجناها
        const bookings = await Booking.find({ doctor: request.user.id })
            .populate('patient', 'name email phone gender') // زودنا الموبايل والنوع عشان الدكتور يعرف مين اللي جاي
            .sort({ 'slotDetails.date': 1, 'slotDetails.startTime': 1 }); // ترتيب حسب ميعاد الكشف نفسه (الأقرب فالأبعد)

        response.status(200).json({
            count: bookings.length,
            bookings: bookings
        });

    } catch (error) {
        console.error('Error fetching doctor bookings:', error);
        response.status(500).json({ message: 'Server error' });
    }
};

// Get all bookings for a patient
const getPatientBookings = async (request, response) => {
    try {
        // 1. التأكد إن اللي بيطلب هو مريض (أو على الأقل مش مجهول)
        if (request.user.role !== 'patient') {
            return response.status(403).json({ message: 'دخول ممنوع' });
        }

        // 2. جلب الحجوزات مع تفاصيل الدكتور والعنوان والسعر
        const bookings = await Booking.find({ patient: request.user.id })
            .populate('doctor', 'name email phone') // اسم وتليفون الدكتور
            .populate('doctorProfile', 'specialization degree address') // التخصص والعنوان المفصل
            .sort({ 'slotDetails.date': 1, 'slotDetails.startTime': 1 }); // ترتيب من الأقرب للأبعد

        response.status(200).json({
            count: bookings.length,
            bookings: bookings
        });

    } catch (error) {
        console.error('Error fetching patient bookings:', error);
        response.status(500).json({ message: 'Server error' });
    }
};

// Cancel a booking
const cancelBooking = async (request, response) => {
    try {
        const { bookingId } = request.params;

        // 1. هات الحجز واتأكد إنه موجود
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return response.status(404).json({ message: 'الحجز غير موجود' });
        }

        // 2. التحقق من الصلاحية (Authorized?)
        // المريض صاحب الحجز، أو الدكتور صاحب الميعاد، أو الأدمن
        const isPatient = booking.patient.toString() === request.user.id;
        const isDoctor = booking.doctor.toString() === request.user.id;
        const isAdmin = request.user.role === 'admin';

        if (!isPatient && !isDoctor && !isAdmin) {
            return response.status(403).json({ message: 'ليس لديك صلاحية لإلغاء هذا الحجز' });
        }

        // 3. هل الحجز قابل للإلغاء أصلاً؟
        if (booking.status === 'cancelled' || booking.status === 'completed') {
            return response.status(400).json({ message: 'لا يمكن إلغاء حجز ملغي بالفعل أو مكتمل' });
        }

        // 4. تحديث حالة الحجز لـ Cancelled
        booking.status = 'cancelled';
        await booking.save();

        // 5. السحر هنا: إرجاع الميعاد (Slot) متاحاً مرة أخرى للمرضى
        // بنحدث موديل Slot مباشرة باستخدام الـ slotId اللي متسيف جوه الحجز
        await Slot.findByIdAndUpdate(booking.slotId, { isAvailable: true });

        // 6. (اختياري) ممكن تبعت إيميل للطرف التاني تبلغه بالإلغاء
        /* const otherParty = isPatient ? booking.doctor : booking.patient;
        // logic إرسال الإيميل هنا...
        */

        response.status(200).json({
            message: 'تم إلغاء الحجز بنجاح والموعد متاح الآن لمرضى آخرين',
            booking: booking
        });

    } catch (error) {
        console.error('Error cancelling booking:', error);
        response.status(500).json({ message: 'حدث خطأ في السيرفر' });
    }
};

// Get all bookings (Admin only)
const getAllBookings = async (request, response) => {
    try {
        // حماية: التأكد إن اللي داخل أدمن
        if (request.user.role !== 'admin') {
            return response.status(403).json({ message: 'دخول ممنوع، للأدمن فقط' });
        }

        const { patientId, doctorId, status, startDate, endDate, page = 1, limit = 20 } = request.query;
        
        let query = {};

        if (patientId) query.patient = patientId;
        if (doctorId) query.doctor = doctorId;
        if (status) query.status = status;

        // الفلترة حسب تاريخ الكشف (أهم للأدمن في التقارير)
        if (startDate || endDate) {
            query['slotDetails.date'] = {};
            if (startDate) query['slotDetails.date'].$gte = new Date(startDate);
            if (endDate) query['slotDetails.date'].$lte = new Date(endDate);
        }

        // حساب عدد الصفحات
        const skip = (page - 1) * limit;

        const bookings = await Booking.find(query)
            .populate('patient', 'name email phone')
            .populate('doctor', 'name email phone')
            .populate('doctorProfile', 'specialization address.city')
            .sort({ 'slotDetails.date': -1 }) // ترتيب بالأحدث زمنياً ككشف
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Booking.countDocuments(query);

        response.status(200).json({
            count: bookings.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            bookings
        });

    } catch (error) {
        console.error('Error fetching all bookings:', error);
        response.status(500).json({ message: 'Server error' });
    }
};

// Get available slots for a doctor
const getAvailableSlots = async (request, response) => {
    try {
        const { doctorId } = request.params; // ده الـ ID بتاع الـ DoctorProfile

        // 1. نتأكد الأول إن الدكتور ده موجود ومعتمد (Approved)
        const doctorProfile = await DoctorProfile.findOne({ _id: doctorId, isApproved: true })
            .populate('user', 'name');
            
        if (!doctorProfile) {
            return response.status(404).json({ message: 'الطبيب غير موجود أو لم يتم اعتماده بعد' });
        }

        // 2. نجيب المواعيد المتاحة فقط من موديل الـ Slot
        // بنفلتر بـ doctorId (User ID) وبـ isAvailable: true
        const availableSlots = await Slot.find({ 
            doctor: doctorProfile.user._id, 
            isAvailable: true,
            date: { $gte: new Date().setHours(0,0,0,0) } // اختياري: هات مواعيد النهاردة واللي جاي بس
        }).sort({ date: 1, startTime: 1 });

        // 3. نرجع الداتا منظمة
        response.status(200).json({
            doctor: {
                id: doctorProfile._id,
                name: doctorProfile.user.name,
                specialization: doctorProfile.specialization,
                consultationFee: doctorProfile.consultationFee
            },
            availableSlots: availableSlots
        });

    } catch (error) {
        console.error('Error fetching available slots:', error);
        response.status(500).json({ message: 'حدث خطأ في السيرفر' });
    }
};

// Complete a booking (doctor marks it as completed)
const completeBooking = async (request, response) => {
    try {
        const { bookingId } = request.params;

        // 1. التأكد إن اللي داخل "دكتور" (زيادة أمان)
        if (request.user.role !== 'doctor') {
            return response.status(403).json({ message: 'عذراً، هذه الخاصية للطبيب فقط' });
        }

        const booking = await Booking.findById(bookingId);
        
        if (!booking) {
            return response.status(404).json({ message: 'الحجز غير موجود' });
        }

        // 2. التأكد إن الدكتور ده هو صاحب الحجز فعلاً
        if (booking.doctor.toString() !== request.user.id) {
            return response.status(403).json({ message: 'غير مسموح لك بإتمام هذا الحجز' });
        }

        // 3. التأكد إن الحالة الحالية "confirmed"
        if (booking.status !== 'confirmed') {
            return response.status(400).json({ message: 'يمكن فقط إتمام الحجوزات المؤكدة' });
        }

        // 4. تحديث الحالة
        booking.status = 'completed';
        await booking.save();

        response.status(200).json({
            message: 'تم تحديث حالة الكشف إلى: مكتمل بنجاح',
            booking: booking
        });

    } catch (error) {
        console.error('Error completing booking:', error);
        response.status(500).json({ message: 'حدث خطأ في السيرفر' });
    }
};

module.exports = { createBooking, getDoctorBookings, getPatientBookings, cancelBooking, getAllBookings, getAvailableSlots, completeBooking };
