const Slot = require('../models/slots'); // تأكد إن المسار لملف slots.js

// 1. إضافة مواعيد (Bulk Insert)
const createSlots = async (request, response) => {
    // حماية: للدكاترة فقط
    if (request.user.role !== 'doctor') {
        return response.status(403).json({ message: 'دخول ممنوع، هذه الخاصية للأطباء فقط' });
    }

    try {
        const { slots } = request.body; 

        if (!Array.isArray(slots) || slots.length === 0) {
            return response.status(400).json({ message: "برجاء إرسال مصفوفة من المواعيد" });
        }

        // ربط المواعيد بالدكتور اللي عامل Login
        const slotsWithDoctor = slots.map(slot => ({
            ...slot,
            doctor: request.user.id
        }));

        const newSlots = await Slot.insertMany(slotsWithDoctor);

        response.status(201).json({ 
            message: "تم إضافة المواعيد بنجاح!", 
            count: newSlots.length,
            slots: newSlots 
        });
    } catch (error) {
        response.status(500).json({ message: "خطأ في إضافة المواعيد", error: error.message });
    }
};

// 2. عرض مواعيد الدكتور (ليعرف جدول أعماله)
const getMySlots = async (req, res) => {
    try {
        const slots = await Slot.find({ doctor: req.user.id }).sort({ date: 1, startTime: 1 });
        res.status(200).json({ count: slots.length, slots });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// 3. حذف ميعاد معين (بشرط ميكونش اتحجز)
const deleteSlot = async (req, res) => {
    try {
        const { id } = req.params;
        // بنمسح الميعاد لو هو "متاح" (isAvailable: true) وبتاع الدكتور ده
        const slot = await Slot.findOneAndDelete({ 
            _id: id, 
            doctor: req.user.id, 
            isAvailable: true 
        });

        if (!slot) {
            return res.status(404).json({ message: "الميعاد غير موجود أو تم حجزه بالفعل ولا يمكن حذفه" });
        }

        res.status(200).json({ message: "تم حذف الميعاد بنجاح" });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = { createSlots, getMySlots, deleteSlot };