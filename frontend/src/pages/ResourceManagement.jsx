import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { apiService } from '../services/api';
import Badge from '../components/Badge';

const RESOURCE_TYPES = [
  { id: 'ambulances', icon: '🚑', label: 'Ambulances', unit: 'vehicles' },
  { id: 'food_supplies', icon: '🍱', label: 'Food Supplies', unit: 'packets' },
  { id: 'drinking_water', icon: '💧', label: 'Drinking Water', unit: 'cans (20L)' },
  { id: 'emergency_shelters', icon: '🏕️', label: 'Emergency Shelters', unit: 'tents' },
  { id: 'medical_supplies', icon: '💊', label: 'Medical Supplies', unit: 'kits' },
  { id: 'rescue_personnel', icon: '🧑‍🚒', label: 'Rescue Personnel', unit: 'personnel' },
];

export default function ResourceManagement() {
  const { tr } = useApp();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const [form, setForm] = useState({
    type: 'ambulances',
    name: '',
    quantity: 10,
    available: 10,
    location: '',
    unit: 'vehicles',
  });

  const loadResources = async () => {
    try {
      setLoading(true);
      const res = await apiService.fetchResources();
      setResources(res.data || []);
    } catch (e) {
      console.error('Failed to load resources:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  const handleOpenAdd = () => {
    setEditingResource(null);
    setForm({
      type: 'ambulances',
      name: '',
      quantity: 10,
      available: 10,
      location: '',
      unit: 'vehicles',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (res) => {
    setEditingResource(res);
    setForm({
      type: res.type,
      name: res.name,
      quantity: res.quantity,
      available: res.available,
      location: res.location,
      unit: res.unit || 'units',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg({ type: '', text: '' });

    try {
      const payload = {
        ...form,
        quantity: parseInt(form.quantity, 10),
        available: parseInt(form.available, 10),
      };

      if (editingResource) {
        await apiService.updateResource(editingResource.id, payload);
        setMsg({ type: 'success', text: 'Resource updated successfully!' });
      } else {
        await apiService.createResource(payload);
        setMsg({ type: 'success', text: 'New resource inventory registered!' });
      }
      setShowModal(false);
      await loadResources();
      setTimeout(() => setMsg({ type: '', text: '' }), 3000);
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from inventory?`)) return;
    try {
      await apiService.deleteResource(id);
      setMsg({ type: 'success', text: 'Resource removed from logistics system.' });
      await loadResources();
      setTimeout(() => setMsg({ type: '', text: '' }), 3000);
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  // Grouped breakdown & shortage calculations
  const summaries = RESOURCE_TYPES.map((t) => {
    const matching = resources.filter((r) => r.type === t.id);
    const total = matching.reduce((sum, r) => sum + (r.quantity || 0), 0);
    const available = matching.reduce((sum, r) => sum + (r.available || 0), 0);
    const pct = total > 0 ? Math.round((available / total) * 100) : 0;
    const isShortage = total > 0 && pct < 25;

    return {
      ...t,
      total,
      available,
      pct,
      isShortage,
      count: matching.length,
    };
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222222] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>📦</span>
            <span>{tr('resources.title')}</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {tr('resources.subtitle')}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md shadow-red-900/50 flex items-center gap-2 self-start sm:self-auto"
        >
          <span>➕</span>
          <span>{tr('resources.add')}</span>
        </button>
      </div>

      {msg.text && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border ${
            msg.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
              : 'bg-red-950/60 border-red-800 text-red-300'
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* 6 Category Summary Cards with Shortage Warning */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {summaries.map((s) => (
          <div
            key={s.id}
            className={`p-4 rounded-xl border transition-all ${
              s.isShortage
                ? 'bg-red-950/40 border-red-800 shadow-md shadow-red-950/40'
                : 'bg-[#141414] border-[#222222]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl p-1.5 bg-black/40 rounded-lg">{s.icon}</span>
              {s.isShortage && (
                <span className="text-[10px] bg-red-600 text-white font-bold px-1.5 py-0.5 rounded uppercase animate-pulse">
                  Shortage
                </span>
              )}
            </div>

            <div className="text-xs text-gray-400 font-semibold truncate mb-1">{s.label}</div>
            <div className="text-lg font-black font-mono text-white">
              {s.available}{' '}
              <span className="text-xs font-normal text-gray-500">/ {s.total}</span>
            </div>

            {/* Availability bar */}
            <div className="w-full bg-[#222222] rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  s.isShortage ? 'bg-red-500' : s.pct > 60 ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${s.pct}%` }}
              />
            </div>
            <div className="text-[10px] text-gray-500 mt-1 font-mono">{s.pct}% ready</div>
          </div>
        ))}
      </div>

      {/* Resource Inventory Table */}
      <div className="bg-[#141414] rounded-xl border border-[#222222] overflow-hidden shadow-lg">
        <div className="p-4 border-b border-[#222222] flex items-center justify-between">
          <h2 className="text-white font-bold text-base flex items-center gap-2">
            <span>📋</span>
            <span>{tr('resources.inventoryTitle')} ({resources.length} {tr('resources.items')})</span>
          </h2>
          <button
            onClick={loadResources}
            className="text-gray-400 hover:text-white text-xs flex items-center gap-1"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-[#1c1c1c] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : resources.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">No resources logged.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#0f0f0f] text-gray-400 text-xs font-bold uppercase tracking-wider border-b border-[#222222]">
                <tr>
                  <th className="py-3 px-4">Resource Item</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Available / Total</th>
                  <th className="py-3 px-4">Depot Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {resources.map((res) => {
                  const typeObj = RESOURCE_TYPES.find((t) => t.id === res.type);
                  const isDepleted = res.quantity > 0 && res.available / res.quantity < 0.25;

                  return (
                    <tr key={res.id} className="hover:bg-[#1a1a1a] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{typeObj?.icon || '📦'}</span>
                          <div>
                            <div>{res.name}</div>
                            {res.notes?.includes('DEMO') && (
                              <span className="text-blue-400 text-[10px] font-mono">DEMO DATA</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-300">
                        <span className="capitalize">{res.type?.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono">
                          <span className={`font-bold ${isDepleted ? 'text-red-400' : 'text-emerald-400'}`}>
                            {res.available}
                          </span>
                          <span className="text-gray-500"> / {res.quantity} {res.unit}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-300">{res.location}</td>
                      <td className="py-3.5 px-4">
                        <Badge status={res.status || 'available'} />
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(res)}
                          className="px-2.5 py-1 bg-[#222222] hover:bg-[#333333] text-gray-300 hover:text-white rounded text-xs font-semibold transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(res.id, res.name)}
                          className="px-2.5 py-1 bg-red-950/60 hover:bg-red-900/80 text-red-300 rounded text-xs font-semibold border border-red-800 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Resource Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-[#141414] rounded-2xl border border-[#333333] p-6 max-w-md w-full space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <h2 className="text-white font-extrabold text-base flex items-center gap-2">
                <span>📦</span>
                <span>{editingResource ? 'Edit Resource' : tr('resources.add')}</span>
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white text-base font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-gray-400 text-xs font-semibold block mb-1">
                  {tr('resources.type')} *
                </label>
                <select
                  value={form.type}
                  onChange={(e) => {
                    const sel = RESOURCE_TYPES.find((t) => t.id === e.target.value);
                    setForm({ ...form, type: e.target.value, unit: sel?.unit || 'units' });
                  }}
                  className="w-full bg-[#1c1c1c] border border-[#333333] text-white rounded-lg px-3 py-2 text-sm focus:border-red-500 outline-none"
                >
                  {RESOURCE_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.icon} {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-xs font-semibold block mb-1">
                  Resource Name / Tag *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Heavy Ambulance Unit 4"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#1c1c1c] border border-[#333333] text-white rounded-lg px-3 py-2 text-sm focus:border-red-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs font-semibold block mb-1">
                    {tr('resources.quantity')} *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full bg-[#1c1c1c] border border-[#333333] text-white rounded-lg px-3 py-2 text-sm focus:border-red-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-gray-400 text-xs font-semibold block mb-1">
                    {tr('resources.available')} *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.available}
                    onChange={(e) => setForm({ ...form, available: e.target.value })}
                    className="w-full bg-[#1c1c1c] border border-[#333333] text-white rounded-lg px-3 py-2 text-sm focus:border-red-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-xs font-semibold block mb-1">
                  {tr('resources.location')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., State Disaster Relief Base, Mysuru"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full bg-[#1c1c1c] border border-[#333333] text-white rounded-lg px-3 py-2 text-sm focus:border-red-500 outline-none"
                />
              </div>

              <div>
                <label className="text-gray-400 text-xs font-semibold block mb-1">
                  Unit Specification
                </label>
                <input
                  type="text"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="e.g., vehicles, packets, cans"
                  className="w-full bg-[#1c1c1c] border border-[#333333] text-white rounded-lg px-3 py-2 text-sm focus:border-red-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-[#222222] hover:bg-[#2c2c2c] text-gray-300 rounded-lg text-xs font-semibold transition-colors"
                >
                  {tr('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-md"
                >
                  {submitting ? tr('common.loading') : editingResource ? 'Save Updates' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
