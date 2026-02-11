import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Activity } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'patient' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/auth/register', formData);
      alert('تم إنشاء الحساب بنجاح! سجل دخولك الآن');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'خطأ في التسجيل');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"><UserPlus className="text-white" /></div>
          <h2 className="text-2xl font-bold">إنشاء حساب جديد</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute right-3 top-3 text-gray-400 size-5" />
            <input type="text" placeholder="الاسم الكامل" className="w-full bg-gray-50 border rounded-xl py-2.5 pr-10 pl-4 outline-none focus:border-blue-500" 
            onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div className="relative">
            <Mail className="absolute right-3 top-3 text-gray-400 size-5" />
            <input type="email" placeholder="البريد الإلكتروني" className="w-full bg-gray-50 border rounded-xl py-2.5 pr-10 pl-4 outline-none focus:border-blue-500" 
            onChange={(e) => setFormData({...formData, email: e.target.value})} required />
          </div>
          <div className="relative">
            <Lock className="absolute right-3 top-3 text-gray-400 size-5" />
            <input type="password" placeholder="كلمة المرور" className="w-full bg-gray-50 border rounded-xl py-2.5 pr-10 pl-4 outline-none focus:border-blue-500" 
            onChange={(e) => setFormData({...formData, password: e.target.value})} required />
          </div>
          <button type="submit" className="w-full py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-lg">إنشاء حساب</button>
        </form>
      </div>
    </div>
  );
};

export default Register;