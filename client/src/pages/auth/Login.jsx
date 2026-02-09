import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // لفك التوكن ومعرفة الـ Role
import AuthContext from '../../contexts/AuthContext';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. إرسال البيانات للباك إند (بورت 5000)
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });

      // 2. تخزين التوكن في الـ LocalStorage وتحديث حالة المستخدم
      login(res.data.token);

      // 3. فك تشفير التوكن لقراءة الـ Role (مريض، دكتور، إلخ)
      const decoded = jwtDecode(res.data.token);
      const userRole = decoded.user.role;

      // 4. التوجيه بناءً على الصلاحيات
      if (userRole === 'patient') {
        navigate('/'); // صفحة المريض الرئيسية
      } else if (userRole === 'doctor') {
        navigate('/doctor/dashboard'); // لو دكتور (هنعملها بعدين)
      } else {
        setError('عفواً، لا تملك صلاحية الوصول');
      }
      
    } catch (err) {
      // التعامل مع أخطاء السيرفر (بيانات غلط، سيرفر واقف)
      setError(err.response?.data?.message || 'خطأ في تسجيل الدخول، تأكد من البيانات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        
        {/* Header الخاص بالصفحة */}
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <LogIn className="text-white size-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">أهلاً بك مجدداً</h2>
          <p className="text-gray-500 mt-2 text-sm">سجل دخولك لمتابعة حالتك الصحية</p>
        </div>

        {/* عرض رسائل الخطأ إن وجدت */}
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-xl mb-6 flex items-center gap-2 text-sm border border-red-100">
            <AlertCircle className="size-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* حقل البريد الإلكتروني */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 mr-1">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-3 top-3 text-gray-400 size-5" />
              <input
                type="email"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pr-10 pl-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                placeholder="example@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* حقل كلمة المرور */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 mr-1">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-3 top-3 text-gray-400 size-5" />
              <input
                type="password"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pr-10 pl-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* زر تسجيل الدخول */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-bold text-white transition shadow-lg ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 active:scale-[0.98]'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                جاري التحقق...
              </span>
            ) : 'دخول'}
          </button>
        </form>

        {/* روابط إضافية */}
        <p className="text-center mt-8 text-sm text-gray-500">
          ليس لديك حساب؟{' '}
          <Link to="/register" className="text-blue-600 font-bold hover:underline">
            إنشاء حساب مريض
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;