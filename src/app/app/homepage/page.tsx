'use client';

import {
  Calendar, Users, Stethoscope, Pill, AlertCircle, Phone, Sparkles, Menu
} from 'lucide-react';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#003B46] via-[#006770] via-[#00838B] to-[#00A3A9] pb-10 font-sans">
{/* bg-gradient-to-r
from-[hsla(169,100%,50%,1)]
via-[hsla(150,75%,70%,1)]
to-[hsla(67,70%,75%,1)] */}
      {/* Header */}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* SOS Button */}
        <div className="flex justify-center mb-8">
          <button className="w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-red-500 to-red-700 text-white rounded-full shadow-2xl flex flex-col items-center justify-center hover:scale-110 transition-transform duration-200">
            <AlertCircle className="w-10 h-10 sm:w-14 sm:h-14 mb-1" />
            <span className="text-lg sm:text-2xl font-bold">SOS</span>
          </button>
        </div>

        {/* <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">

          <div className="cursor-pointer">
            <div className="bg-white rounded-3xl shadow-xl p-6 border-2 hover:shadow-2xl transition-all" style={{ borderColor: '#006770' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto" style={{ backgroundColor: 'rgba(255, 127, 80, 0.2)' }}>
                <Calendar className="w-8 h-8" style={{ color: '#006770' }} />
              </div>
              <h3 className="text-center font-semibold text-gray-800 text-sm sm:text-base">Upcoming Appointments</h3>
            </div>
          </div>

          <div className="cursor-pointer">
            <div className="bg-white rounded-3xl shadow-xl p-6 border-2 hover:shadow-2xl transition-all" style={{ borderColor: '#00838B' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto" style={{ backgroundColor: 'rgba(255, 127, 80, 0.2)' }}>
                <Users className="w-8 h-8" style={{ color: '#00838B' }} />
              </div>
              <h3 className="text-center font-semibold text-gray-800 text-sm sm:text-base">Emergency Contacts</h3>
            </div>
          </div>

          <div className="cursor-pointer">
            <div className="bg-white rounded-3xl shadow-xl p-6 border-2 hover:shadow-2xl transition-all" style={{ borderColor: '#006770' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto" style={{ backgroundColor: 'rgba(255, 127, 80, 0.2)' }}>
                <Stethoscope className="w-8 h-8" style={{ color: '#006770' }} />
              </div>
              <h3 className="text-center font-semibold text-gray-800 text-sm sm:text-base">Medical Team</h3>
            </div>
          </div>

          <div className="cursor-pointer">
            <div className="bg-white rounded-3xl shadow-xl p-6 border-2 hover:shadow-2xl transition-all" style={{ borderColor: '#00838B' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto" style={{ backgroundColor: 'rgba(255, 127, 80, 0.2)' }}>
                <Pill className="w-8 h-8" style={{ color: '#00838B' }} />
              </div>
              <h3 className="text-center font-semibold text-gray-800 text-sm sm:text-base">Current Medication</h3>
            </div>
          </div>

        </div> */}

        {/* Calendar Section */}
        <div className="mt-10 bg-gray-50 p-4 sm:p-6 rounded-xl border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-teal-100 rounded-xl">
              <Calendar className="w-8 h-8 text-teal-700" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Calendar</h2>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center mb-4">
            <div className="text-xs sm:text-sm font-bold text-gray-400 uppercase">Su</div>
            <div className="text-xs sm:text-sm font-bold text-gray-400 uppercase">Mo</div>
            <div className="text-xs sm:text-sm font-bold text-gray-400 uppercase">Tu</div>
            <div className="text-xs sm:text-sm font-bold text-gray-400 uppercase">We</div>
            <div className="text-xs sm:text-sm font-bold text-gray-400 uppercase">Th</div>
            <div className="text-xs sm:text-sm font-bold text-gray-400 uppercase">Fr</div>
            <div className="text-xs sm:text-sm font-bold text-gray-400 uppercase">Sa</div>
          </div>

          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            <div className="h-16 sm:h-20 bg-white border border-gray-100 rounded-lg"></div>
            <div className="h-16 sm:h-20 bg-white border border-gray-100 rounded-lg"></div>
            <div className="h-16 sm:h-20 bg-white border border-gray-100 rounded-lg"></div>
            <div className="h-16 sm:h-20 bg-white border border-gray-100 rounded-lg"></div>
            <div className="h-16 sm:h-20 bg-white border border-gray-100 rounded-lg"></div>
            <div className="h-16 sm:h-20 bg-white border border-gray-100 rounded-lg"></div>
            <div className="h-16 sm:h-20 bg-white border border-gray-100 rounded-lg"></div>
          </div>
        </div>

        {/* Emergency Contacts Section */}
        <div className="mt-10 bg-gray-50 p-4 sm:p-6 rounded-xl border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-red-100 rounded-xl">
              <Phone className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Emergency Contacts</h2>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            <div className="p-4 border border-gray-100 rounded-xl bg-white"></div>
            <div className="p-4 border border-gray-100 rounded-xl bg-white"></div>
          </div>
        </div>

        {/* Doctors Section */}
        <div className="mt-10 bg-gray-50 p-4 sm:p-6 rounded-xl border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-teal-100 rounded-xl">
              <Stethoscope className="w-8 h-8 text-teal-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Medical Team</h2>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            <div className="p-4 border border-gray-100 rounded-xl bg-white"></div>
            <div className="p-4 border border-gray-100 rounded-xl bg-white"></div>
          </div>
        </div>

        {/* Medications Section */}
        <div className="mt-10 bg-gray-50 p-4 sm:p-6 rounded-xl border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-orange-100 rounded-xl">
              <Pill className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Current Medications</h2>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            <div className="p-4 border border-gray-100 rounded-xl bg-white"></div>
            <div className="p-4 border border-gray-100 rounded-xl bg-white"></div>
          </div>
        </div>

      </main>

    </div>
  );
}
