const User = require('../models/User');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer'); 

//send an email
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

//register user
const register = async (request, response) => {
    try {
        const { name, email, password, role, phone, gender } = request.body;

        //cheack if exist
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return response.status(400).json({ message: 'البريد الإلكتروني مسجل بالفعل' });
        }
        
        //hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        //detrmine roles
        const allowedRoles = ['patient', 'doctor'];
        const finalRole = allowedRoles.includes(role) ? role : 'patient';

        //generate verfiction code 
        const vCode = Math.floor(100000 + Math.random() * 900000).toString();

        // create an user to save in DB
        const user = new User({
            name,
            email,
            password: hashedPassword,
            role: finalRole,
            phone,
            gender,
            verificationCode: vCode,
            verificationCodeExpires: Date.now() + 3600000 //one hour
        });

        await user.save();
        
        //send the verfiction email
      await transporter.sendMail({
        from: `"Sage Health-Care" <${process.env.EMAIL_USER}>`, 
        to: email,
        subject: 'كود تفعيل الحساب',
        text: `كود التفعيل الخاص بك هو: ${vCode}`
        });

        response.status(201).json({ message: 'تم التسجيل بنجاح، برجاء فحص إيميلك للتفعيل' });
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Server error, please try again' });
    }
};

//verfy user 
const verifyEmail = async (request, response) => {
    try {
        const { email, code } = request.body;

        const user = await User.findOne({ 
            email, 
            verificationCode: code,
            verificationCodeExpires: { $gt: Date.now() } 
        });

        if (!user) {
            return response.status(400).json({ message: 'كود غير صحيح أو انتهت صلاحيته' });
        }

        user.isVerified = true;
        user.verificationCode = undefined; // delete the code 
        user.verificationCodeExpires = undefined;
        await user.save();

        response.json({ message: 'تم تفعيل الحساب بنجاح، يمكنك تسجيل الدخول الآن' });
    } catch (error) {
        response.status(500).json({ message: 'Server Error, please try again' });
    }
};

// resend the code 
const resendVerificationCode = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });
        if (user.isVerified) return res.status(400).json({ message: "هذا الحساب مفعل بالفعل" });

        //generate code 
        const newCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationCode = newCode;
        user.verificationCodeExpires = Date.now() + 3600000; // one hour
        await user.save();

        //send the email
        await transporter.sendMail({
    // السطر ده كدة يخلي اسم العرض Sage Health-Care بس يبعت من إيميلك الحقيقي
        from: `"Sage Health-Care" <${process.env.EMAIL_USER}>`, 
        to: email,
        subject: 'كود تفعيل الحساب',
        text: `كود التفعيل الخاص بك هو: ${vCode}`
        });
        res.status(200).json({ message: "تم إعادة إرسال كود التفعيل لإيميلك" });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

//login
const login = async (request, response) => {
    try {
        const { email, password } = request.body;

        const user = await User.findOne({ email });
        if (!user) {
            return response.status(400).json({ message: 'بريد إلكتروني أو كلمة مرور غير صحيحة' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return response.status(400).json({ message: 'بريد إلكتروني أو كلمة مرور غير صحيحة' });
        }

        if (!user.isVerified) {
            return response.status(401).json({ message: 'برجاء تفعيل حسابك أولاً من خلال الإيميل' });    
        }

        //generate the jwt
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            response.json({ token });
        });

    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Server error, please try again' });
    }
};

//show  user profile
const getProfile = async (request, response) => {
    try {
        const user = await User.findById(request.user.id).select('-password'); 
        response.json(user);
    } catch (error) {
        response.status(500).json({ message: 'Server Error' });
    }
};

//update user profiele
const updateProfile = async (request, response) => {
    const { name, email, phone, gender } = request.body;
    
    try {
        let user = await User.findById(request.user.id);
        if (!user) return response.status(404).json({ message: 'لم يتم العثور علي المستخدم' });

        let message = 'تم تحديث البيانات بنجاح'; 

        if (email && email !== user.email) {
            
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return response.status(400).json({ message: 'البريد الإلكتروني الجديد مستخدم بالفعل، اختر بريداً آخر' });
            }

            user.email = email;
            user.isVerified = false; 

            // generate verfiction code 
            const vCode = Math.floor(100000 + Math.random() * 900000).toString();
            user.verificationCode = vCode;
            user.verificationCodeExpires = Date.now() + 3600000; // ساعة صلاحية

            // send code 
            await transporter.sendMail({
    // السطر ده كدة يخلي اسم العرض Sage Health-Care بس يبعت من إيميلك الحقيقي
        from: `"Sage Health-Care" <${process.env.EMAIL_USER}>`, 
        to: email,
        subject: 'كود تفعيل الحساب',
        text: `كود التفعيل الخاص بك هو: ${vCode}`
        });

            message = 'تم تحديث البيانات. يرجى تفعيل البريد الإلكتروني الجديد لاستعادة صلاحية الدخول.';
        }

        user.name = name || user.name;
        user.phone = phone || user.phone;   
        user.gender = gender || user.gender;

        await user.save();

        const updatedUser = await User.findById(user._id).select('-password -verificationCode');

        response.json({ message, updatedUser });

    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Server Error, please try again' });
    }
}; 

//update the role throw the super admin
const updateUserRole = async (req, res) => {
    try {
        const { userId, newRole, adminSecret } = req.body;

        if (newRole === 'admin') {
            if (adminSecret !== process.env.ADMIN_UPGRADE_SECRET) {
                return res.status(403).json({ 
                    message: "ممنوع: أنت بحاجة إلى مفتاح سر المشرف ." 
                });
            }
        }

        const user = await User.findByIdAndUpdate(
            userId, 
            { role: newRole }, 
            { new: true }
        ).select('-password'); 

        if (!user) {
            return res.status(404).json({ message: "لم يتم العثور علي المستخدم" });
        }

        res.status(200).json({ 
            message: `تم تحديث دور المستخدم بنجاح إلى ${newRole}`, 
            user 
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

//forget password 
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "هذا الإيميل غير مسجل لدينا" });
        }

        //generate code 
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        user.verificationCode = resetCode;
        user.verificationCodeExpires = Date.now() + 600000; // 10 دقايق
        await user.save();

         await transporter.sendMail({
    // السطر ده كدة يخلي اسم العرض Sage Health-Care بس يبعت من إيميلك الحقيقي
        from: `"Sage Health-Care" <${process.env.EMAIL_USER}>`, 
        to: email,
        subject: 'كود تفعيل الحساب',
        text: `كود التفعيل الخاص بك هو: ${vCode}`
        });

        res.status(200).json({ message: "تم إرسال كود إعادة التعيين إلى إيميلك" });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

//reset password
const resetPassword = async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;

        const user = await User.findOne({ 
            email, 
            verificationCode: code,
            verificationCodeExpires: { $gt: Date.now() } 
        });

        if (!user) {
            return res.status(400).json({ message: "كود غير صحيح أو انتهت صلاحيته" });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        user.verificationCode = undefined;
        user.verificationCodeExpires = undefined;
        
        await user.save();

        res.status(200).json({ message: "تم تغيير كلمة المرور بنجاح" });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = { register, verifyEmail, login, getProfile, updateProfile, updateUserRole, resendVerificationCode, resetPassword, forgotPassword };