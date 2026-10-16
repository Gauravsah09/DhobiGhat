'use client';

import React, { useState } from 'react';
import { Grid, Plus, Trash2, Edit2, Shirt, Sparkles, Tag, X } from 'lucide-react';
import { useLaundry } from '@/context/LaundryContext';
import { formatCurrency } from '@/lib/utils';
import { PriceMatrixItem } from '@/types';

export function CatalogView() {
  const { 
    clothTypes, 
    services, 
    priceMatrix, 
    addClothType, 
    deleteClothType,
    addService, 
    deleteService,
    addPriceItem, 
    updatePriceItem, 
    deletePriceItem,
    settings 
  } = useLaundry();

  const [activeTab, setActiveTab] = useState<'prices' | 'garments' | 'services'>('prices');

  // Modal State for Price Item
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [editingPriceItem, setEditingPriceItem] = useState<PriceMatrixItem | null>(null);
  const [priceForm, setPriceForm] = useState({
    serviceId: services[0]?.id || '1',
    clothId: clothTypes[0]?.id || '1',
    shortCode: '',
    price: 10.0,
  });

  // Simple quick adds for Clothes and Services
  const [newClothName, setNewClothName] = useState('');
  const [newClothCode, setNewClothCode] = useState('');
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCode, setNewServiceCode] = useState('');

  const handleOpenAddPrice = () => {
    setEditingPriceItem(null);
    setPriceForm({
      serviceId: services[0]?.id || '1',
      clothId: clothTypes[0]?.id || '1',
      shortCode: '',
      price: 10.0,
    });
    setIsPriceModalOpen(true);
  };

  const handleOpenEditPrice = (item: PriceMatrixItem) => {
    setEditingPriceItem(item);
    setPriceForm({
      serviceId: item.serviceId,
      clothId: item.clothId,
      shortCode: item.shortCode,
      price: item.price,
    });
    setIsPriceModalOpen(true);
  };

  const handleSavePrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPriceItem) {
      updatePriceItem(editingPriceItem.id, priceForm);
    } else {
      addPriceItem(priceForm);
    }
    setIsPriceModalOpen(false);
  };

  const handleAddCloth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClothName.trim() || !newClothCode.trim()) return;
    addClothType({ name: newClothName.trim(), code: newClothCode.trim().toUpperCase() });
    setNewClothName('');
    setNewClothCode('');
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim() || !newServiceCode.trim()) return;
    addService({ name: newServiceName.trim(), code: newServiceCode.trim().toUpperCase() });
    setNewServiceName('');
    setNewServiceCode('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Service & Garment Price Matrix</h2>
          <p className="text-xs text-slate-500">
            Define laundry rates, custom shortcodes, garment types, and washing services.
          </p>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('prices')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'prices' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Price List ({priceMatrix.length})
          </button>
          <button
            onClick={() => setActiveTab('garments')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'garments' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Garments ({clothTypes.length})
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'services' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Services ({services.length})
          </button>
        </div>
      </div>

      {/* TAB 1: PRICE MATRIX */}
      {activeTab === 'prices' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Service Rate Rules</span>
            <button
              onClick={handleOpenAddPrice}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Price Rule
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-5">Short Code</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Garment Type</th>
                  <th className="py-3 px-4 text-right">Standard Rate</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {priceMatrix.map((item) => {
                  const srv = services.find((s) => s.id === item.serviceId);
                  const cloth = clothTypes.find((c) => c.id === item.clothId);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-5 font-mono font-bold text-sky-700">
                        <span className="px-2 py-0.5 rounded-md bg-sky-50 border border-sky-100">
                          {item.shortCode}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{srv?.name || 'Service'}</td>
                      <td className="py-3 px-4 font-medium">{cloth?.name || 'Garment'}</td>
                      <td className="py-3 px-4 text-right font-black text-slate-900 text-sm">
                        {formatCurrency(item.price, settings.currency)}
                      </td>
                      <td className="py-3 px-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditPrice(item)}
                            className="p-1.5 text-slate-400 hover:text-sky-600 rounded-lg"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete price rule ${item.shortCode}?`)) {
                                deletePriceItem(item.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: GARMENTS */}
      {activeTab === 'garments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs h-fit">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Shirt className="w-4 h-4 text-sky-600" />
              Add Garment Category
            </h3>
            <form onSubmit={handleAddCloth} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Garment Name</label>
                <input
                  type="text"
                  placeholder="e.g., Blazer, Towel, Bedsheet"
                  required
                  value={newClothName}
                  onChange={(e) => setNewClothName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Shorthand Code</label>
                <input
                  type="text"
                  placeholder="e.g., BLZ, TWL"
                  required
                  value={newClothCode}
                  onChange={(e) => setNewClothCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono uppercase"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-xs"
              >
                Save Garment
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-bold text-xs uppercase tracking-wider text-slate-500">
              Active Garment Types ({clothTypes.length})
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {clothTypes.map((c) => (
                <div key={c.id} className="p-3.5 px-5 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <span className="font-bold text-slate-900">{c.name}</span>
                    <span className="ml-2 font-mono text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      {c.code}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Delete garment ${c.name}?`)) deleteClothType(c.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SERVICES */}
      {activeTab === 'services' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs h-fit">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Add Laundry Service
            </h3>
            <form onSubmit={handleAddService} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Service Name</label>
                <input
                  type="text"
                  placeholder="e.g., Express Dry Clean"
                  required
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Service Code</label>
                <input
                  type="text"
                  placeholder="e.g., EDC"
                  required
                  value={newServiceCode}
                  onChange={(e) => setNewServiceCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono uppercase"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-xs"
              >
                Save Service
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-bold text-xs uppercase tracking-wider text-slate-500">
              Active Services ({services.length})
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {services.map((s) => (
                <div key={s.id} className="p-3.5 px-5 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <span className="font-bold text-slate-900">{s.name}</span>
                    <span className="ml-2 font-mono text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold">
                      {s.code}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Delete service ${s.name}?`)) deleteService(s.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Price Item Modal */}
      {isPriceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                {editingPriceItem ? 'Edit Price Rule' : 'New Price Rule'}
              </h3>
              <button onClick={() => setIsPriceModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSavePrice} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Select Service</label>
                <select
                  value={priceForm.serviceId}
                  onChange={(e) => setPriceForm({ ...priceForm, serviceId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Select Garment</label>
                <select
                  value={priceForm.clothId}
                  onChange={(e) => setPriceForm({ ...priceForm, clothId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                >
                  {clothTypes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Short Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., W/S, WI/P"
                  value={priceForm.shortCode}
                  onChange={(e) => setPriceForm({ ...priceForm, shortCode: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Rate Price ({settings.currency}) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={priceForm.price}
                  onChange={(e) => setPriceForm({ ...priceForm, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPriceModalOpen(false)}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
