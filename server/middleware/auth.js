const jwt = require('jsonwebtoken');

//make sure its a valid tooken 
const auth = (request, response, next) => {
    const token = request.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return response.status(401).json({ message: 'الوصول مرفوض. لا يوجد توكن' });
    }

try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("🔍 Full Decoded Token:", decoded); // عشان نتأكد دايماً

        // التعديل السحري: بيقرأ من decoded.user لو موجودة، أو من decoded مباشرة
        const userData = decoded.user || decoded; 

        if (!userData.id && !userData._id) {
            return response.status(401).json({ message: 'التوكن لا يحتوي على معرف مستخدم' });
        }

        request.user = {
            id: userData.id || userData._id,
            role: userData.role
        };
        
        console.log("✅ Request User Set To:", request.user);
        next(); 
    } catch (err) {
        response.status(401).json({ message: 'توكن غير صالح أو انتهت صلاحيته' });
    }
};
//بتتأكد من الصلاحيات 
const authorize = (...roles) => {
    return (request, response, next) => {
        if (!request.user || !roles.includes(request.user.role)) {
            return response.status(403).json({ message: 'Access denied' });
        }
        next();
    };
};

module.exports = { auth, authorize };