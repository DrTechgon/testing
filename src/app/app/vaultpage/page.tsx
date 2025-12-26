'use client';

import { Plus, Search, Filter, FileText, Shield, CreditCard } from 'lucide-react';

export default function VaultPage() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Medical Vault
            </h1>
            <p className="text-sm text-gray-500">
              Secure document storage
            </p>
          </div>

          <button className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg">
            <Plus size={18} />
            Add Document
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex items-center gap-2 bg-white border rounded-lg px-4 py-2 w-full md:w-1/2">
            <Search size={18} className="text-gray-400" />
            <input
              placeholder="Search"
              className="outline-none w-full text-black"
            />
          </div>

          <div className="flex items-center gap-2 bg-white border rounded-lg px-4 py-2 w-full md:w-1/4">
            <Filter size={18} className="text-gray-400" />
            <span className="text-sm text-gray-600">Filter</span>
          </div>
        </div>

        {/* Categories (pure visuals) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <CategoryCard title="Lab Reports" icon={<FileText />} />
          <CategoryCard title="Prescriptions" icon={<Shield />} />
          <CategoryCard title="Insurance" icon={<CreditCard />} />
          <CategoryCard title="Bills" icon={<FileText />} />
        </div>

        {/* Document Cards (placeholders only) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <DocumentCard />
          <DocumentCard />
          <DocumentCard />
        </div>
      </div>
    </div>
  );
}

/* ---------------- UI Blocks ---------------- */

function CategoryCard({
  title,
  icon,
}: {
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white border rounded-xl p-5 flex items-center justify-between">
      <h3 className="font-medium text-gray-900">{title}</h3>
      <div className="text-gray-400">{icon}</div>
    </div>
  );
}

function DocumentCard() {
  return (
    <div className="bg-white border rounded-xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gray-100 rounded-lg">
          <FileText className="text-gray-600" />
        </div>

        <div>
          <h4 className="font-medium text-gray-900">
            Document Title
          </h4>
          <p className="text-xs text-gray-400">
            Document description
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="text-sm text-blue-600">
          View
        </button>
      </div>
    </div>
  );
}
