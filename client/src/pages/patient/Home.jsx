import React from 'react';
import { Search, Mic, MapPin, Star, MessageSquare, PhoneCall } from 'lucide-react';

const PatientHome = () => {
  // بيانات تجريبية للدكاترة (هنجيبها من الباك إند بعدين)
  const doctors = [
    { id: 1, name: "د / أحمد يوسف", title: "استشاري أمراض القلب", rating: 4.9, location: "طنطا - ميدان الساعة", price: 450 },
    { id: 2, name: "د / محمود حسن", title: "ممارس عام", rating: 3.9, location: "الزمالك - القاهرة", price: 300 },
    { id: 3, name: "د / ليلى جلال", title: "أخصائية طب الأطفال", rating: 5.0, location: "الإسكندرية - ميامي", price: 400 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans" dir="rtl">
      {/* 1. Header & Navigation */}
      <header className="bg-white p-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <img src="https://via.placeholder.com/40" alt="profile" className="rounded-full border-2 border-orange-400" />
          <div>
            <p className="text-xs text-gray-500">صباح الخير ☀️</p>
            <h1 className="font-bold text-gray-800">أهلاً عبد الرحمن 👋</h1>
          </div>
        </div>
        <nav className="hidden md:flex gap-6 text-gray-600 font-medium">
          <a href="#" className="text-blue-600 border-b-2 border-blue-600">الرئيسية</a>
          <a href="#">احجز دكتور</a>
          <a href="#">الصيدلية</a>
          <a href="#">بروفايلك</a>
        </nav>
        <div className="relative w-1/3">
           <Search className="absolute right-3 top-2.5 text-gray-400 size-5" />
           <input type="text" placeholder="حابب تبحث عن إيه؟" className="w-full bg-gray-100 rounded-full py-2 pr-10 pl-4 outline-none border focus:border-blue-300" />
           <Mic className="absolute left-3 top-2.5 text-gray-400 size-5 cursor-pointer" />
        </div>
      </header>

      {/* 2. Medicine Reminder */}
      <div className="max-w-4xl mx-auto mt-6 bg-white rounded-2xl p-4 flex justify-between items-center shadow-sm border border-blue-50">
        <div className="flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-xl"><span className="text-2xl">🔔</span></div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg">تذكير بموعد الدواء</h3>
            <p className="text-sm text-gray-500">حان موعد مضاد حيوي 500 مجم</p>
          </div>
        </div>
        <button className="bg-[#0D3B66] text-white px-6 py-2 rounded-lg font-medium">تناول دواءك</button>
      </div>

      {/* 3. AI Chat Hero Section */}
      <div className="max-w-4xl mx-auto mt-8 bg-blue-50/50 rounded-3xl p-10 text-center border border-blue-100 relative">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">ازيك عامل ايه؟ حابب اساعدك في ايه؟</h2>
        <p className="text-gray-500 mb-8 text-sm">المساعد الذكي متاح دائماً للتشخيص المبدئي والاجابة على استفساراتك الطبية</p>
        
        <div className="relative max-w-2xl mx-auto">
          <textarea placeholder="اكتب اعراضك هنا بالتفصيل ..." className="w-full rounded-2xl p-4 pr-6 pl-14 shadow-lg border-none focus:ring-2 focus:ring-blue-400 min-h-[80px] text-right" />
          <button className="absolute left-3 bottom-3 bg-blue-600 p-2 rounded-xl text-white hover:bg-blue-700 transition">
            <Search className="size-6 rotate-90" />
          </button>
        </div>

        <div className="flex gap-3 justify-center mt-4">
          <button className="bg-white px-4 py-2 rounded-full text-xs text-gray-600 shadow-sm border flex items-center gap-2"><span>😞</span> عندي صداع نصفي</button>
          <button className="bg-white px-4 py-2 rounded-full text-xs text-gray-600 shadow-sm border flex items-center gap-2"><span>🌡️</span> حاسس بسخونية</button>
          <button className="bg-white px-4 py-2 rounded-full text-xs text-gray-600 shadow-sm border flex items-center gap-2"><span>🛡️</span> اقرب صيدلية</button>
        </div>
      </div>

      {/* 4. Doctor Suggestions */}
      <div className="max-w-6xl mx-auto mt-12 px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">دكاتره مقترحين ليك</h2>
          <a href="#" className="text-blue-600 text-sm">عرض الكل ←</a>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {doctors.map(doc => (
            <div key={doc.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="flex flex-col items-center text-center">
                <img src="https://via.placeholder.com/100" className="rounded-2xl mb-4" />
                <h3 className="font-bold text-lg text-gray-800">{doc.name}</h3>
                <p className="text-blue-600 text-sm font-medium mb-2">{doc.title}</p>
                <div className="flex items-center gap-1 text-orange-400 text-sm mb-3">
                  <Star className="fill-current size-4" /> <span>{doc.rating} (210 تقييم)</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-4">
                  <MapPin className="size-4" /> {doc.location}
                </div>
                <div className="w-full bg-blue-50/50 rounded-xl p-3 flex justify-between items-center mb-4">
                   <span className="text-xs text-gray-500">سعر الكشف: {doc.price} ج.م</span>
                </div>
                <div className="flex w-full gap-2">
                  <button className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold">حجز موعد</button>
                  <button className="p-3 border rounded-xl text-blue-600"><MessageSquare /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. SOS Floating Button */}
      <button className="fixed left-6 bottom-6 bg-red-400/90 text-white p-4 rounded-full shadow-xl flex flex-col items-center gap-1 hover:scale-110 transition active:scale-95">
        <PhoneCall className="size-6" />
        <span className="text-[10px] font-bold">طوارئ</span>
      </button>
    </div>
  );
};

export default PatientHome;