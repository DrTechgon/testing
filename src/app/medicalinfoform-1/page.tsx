'use client'

import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import logoImage from "figma:asset/8e191f727b2ef8023e7e4984e9036f679c3d3038.png";
import { useRouter } from 'next/navigation';    
import { supabase } from "@/lib/createClient";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function MedicalInfoFormUI() {

  const [userId , setUserId] = useState('');

  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();
      if (data.user){
        setUserId(data.user.id)
      } 
    }
    getUser();
  }, [])
  
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyContact, setEmergencyContact] = useState([
    { name: "", phone: "", relation: "" },
  ]);

  const [bloodGroup, setBloodGroup] = useState("");

  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bmi, setBmi] = useState("");

  useEffect(() => {
    const h = Number(height);
    const w = Number(weight);
    if (!h || !w){
      setBmi("");
      return;
    }
    const height_in_m = h / 100;
    const calc_bmi = w / (height_in_m * height_in_m);
    if(!isNaN(calc_bmi) && isFinite(calc_bmi)){
      setBmi(calc_bmi.toFixed(1));
    }
  }, [height, weight]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // const height_in_m = Number(height) / 100;
    // const calc_bmi = Number(weight) / (height_in_m * height_in_m);
    // setBmi(calc_bmi.toFixed(1));

    const birthDate = new Date(dob);

    const personalData = {
      fullName,
      dob: birthDate.toString(),
      gender,
      address,
      emergencyContact,
      contactNumber,
      height,
      weight,
      bmi,
    };

    const { error } = await supabase
      .from("profiles")
      .insert({
        user_id: userId, 
        personal: personalData 
      })

    if (error) {
      alert("Error: " + error.message);
    } else {
      router.push("/medicalinfoform-2");
    }
  };

  return (
    
    <div className="min-h-screen bg-gradient-to-br from-[#309898]/20 via-white to-[#FF8000]/10 flex items-center justify-center p-4">
    <form
      onSubmit={handleSubmit}
      className="relative max-w-3xl w-full bg-white rounded-xl shadow-lg overflow-hidden p-6"
    >
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#309898] to-[#FF8000]"></div>
        {/* Logo */}
        <div className="flex justify-center mb-4">
            <Image
                src="/vytara-logo.png"
                alt="Vytara Logo"
                width={96}
                height={96}
                className='w-24 h-24'
                priority
            />
        </div>

        <h2 className="text-center text-[#309898] mb-2">Medical Information</h2>
        <p className="text-center text-gray-600 mb-6">Section 1/4</p>

        {/* Main Container */}
        <div className="min-h-[500px] space-y-6">

          <div className="space-y-4">
            <h3 className="text-[#FF8000] mb-4">Basic Personal Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Full Name */}
              <div className="md:col-span-2">
                <label className="block text-[#309898] mb-2">Full Name *</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border-2 border-[#309898]/30 text-gray-800"
                  placeholder="Full Name"
                />
              </div>

              {/* DOB */}
              <div>
                <label className="block text-[#309898] mb-2">Date of Birth *</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border-2 border-[#309898]/30 text-gray-800"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-[#309898] mb-2">Gender *</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border-2 border-[#309898]/30 text-gray-800"
                >
                  <option>Select Gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>

              {/* Blood Group */}
              <div>
                <label className="block text-[#309898] mb-2">Blood Group *</label>  
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border-2 border-[#309898]/30 text-gray-800"
                >
                  <option>Select Blood Group</option>
                  <option>A+</option>
                  <option>A−</option>
                  <option>B+</option>
                  <option>B−</option>
                  <option>AB+</option>
                  <option>AB−</option>
                  <option>O+</option>
                  <option>O−</option>
                </select>
              </div>
              
              {/* ADDRESS */}
                <div className="md:col-span-2">
                    <label className="block text-[#309898] mb-2">Address *</label>
                        <textarea
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border-2 border-[#309898]/30 text-gray-800"
                            placeholder="Address"
                        />
              </div>

              {/* Height */}
              <div>
                <label className="block text-[#309898] mb-2">Height (cm)</label>
                <input
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="eg: 172"
                  className="w-full px-4 py-2 rounded-lg border-2 border-[#309898]/30 text-gray-800 text-gray-800"
                />
              </div>

              {/* Weight */}
              <div>
                <label className="block text-[#309898] mb-2">Weight</label>
                <input
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="eg: 70 kg"
                  className="w-full px-4 py-2 rounded-lg border-2 border-[#309898]/30 text-gray-800 text-gray-800"
                />
              </div>

              {/* BMI */}
              <div>
                <label className="block text-[#309898] mb-2">BMI</label>
                <input
                  value={bmi}
                  onChange={(e) => setBmi(e.target.value)}
                  placeholder="eg: 2.7"
                  className="w-full px-4 py-2 rounded-lg border-2 border-[#309898]/30 text-gray-800 text-gray-800"
                  readOnly
                />
              </div>

              {/* Contact Number */}
              <div>
                <label className="block text-[#309898] mb-2">Contact Number *</label>
                <input
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border-2 border-[#309898]/30 text-gray-800"
                  placeholder="eg: 1234567890"
                />
              </div>
            </div>

            {/* Emergency Contacts */}
            <div>
  <div className="flex items-center justify-between mb-2">
    <label className="block text-[#309898]">Emergency Contacts</label>

    {/* Add New Emergency Contact */}
            <button
              type="button"
              className="text-[#FF8000]"
              onClick={() =>
                setEmergencyContact([
                  ...emergencyContact,
                  { name: "", phone: "", relation: "" },
                ])
              }
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {emergencyContact.map((contact, index) => (
            <div key={index} className="border p-4 rounded-xl mb-4">
              
              {/* Name + Phone in Same Row */}
              <div className="flex gap-2 mb-2">
                <input
                  placeholder="Name"
                  className="flex-1 px-4 py-2 rounded-lg border-2 border-[#309898]/30 text-gray-800"
                  value={contact.name}
                  onChange={(e) => {
                    const updated = [...emergencyContact];
                    updated[index].name = e.target.value;
                    setEmergencyContact(updated);
                  }}
                />

                <input
                  placeholder="Phone"
                  className="flex-1 px-4 py-2 rounded-lg border-2 border-[#309898]/30 text-gray-800"
                  value={contact.phone}
                  onChange={(e) => {
                    const updated = [...emergencyContact];
                    updated[index].phone = e.target.value;
                    setEmergencyContact(updated);
                  }}
                />
              </div>

              {/* Relation Below */}
              <input
                placeholder="Relation"
                className="w-full px-4 py-2 rounded-lg border-2 border-[#309898]/30 mb-2 text-gray-800"
                value={contact.relation}
                onChange={(e) => {
                  const updated = [...emergencyContact];
                  updated[index].relation = e.target.value;
                  setEmergencyContact(updated);
                }}
              />

              {/* Delete Contact */}
              {index !== 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const filtered = emergencyContact.filter((_, i) => i !== index);
                    setEmergencyContact(filtered);
                  }}
                  className="text-red-500 flex items-center gap-1"
                >
                  <X className="w-5 h-5" /> Remove
                </button>
              )}
            </div>
          ))}
        </div>

          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={() => router.push("/signup")}
            className="flex items-center gap-2 text-[#309898] cursor-pointer"
          >
            <ChevronLeft /> Previous
          </button>

          <button
            type="submit"
            className="flex items-center gap-2 bg-[#FF8000] text-white px-6 py-2 rounded-lg hover:bg-[#309898] cursor-pointer"
          >
            Next <ChevronRight />
          </button>
        </div>

    </form>
    </div>
  );
}
