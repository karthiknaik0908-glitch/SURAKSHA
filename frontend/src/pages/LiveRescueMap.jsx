import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useApp } from '../contexts/AppContext';
import { apiService } from '../services/api';
import Badge from '../components/Badge';

// Helper to create reliable DivIcon markers without external PNG dependencies
function createMapIcon(type, priority) {
  let bg = '#3b82f6';
  let emoji = '📍';

  if (type === 'sos') {
    if (priority === 'critical') {
      bg = '#dc2626';
      emoji = '🆘';
    } else if (priority === 'high') {
      bg = '#f97316';
      emoji = '⚠️';
    } else {
      bg = '#eab308';
      emoji = '📢';
    }
  } else if (type === 'hospital') {
    bg = '#10b981';
    emoji = '🏥';
  } else if (type === 'shelter') {
    bg = '#6366f1';
    emoji = '🏕️';
  } else if (type === 'rescue_team') {
    bg = '#0284c7';
    emoji = '🚁';
  }

  const html = `
    <div style="
      background-color: ${bg};
      width: 34px;
      height: 34px;
      border-radius: 50%;
      border: 2px solid #ffffff;
      box-shadow: 0 4px 10px rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      cursor: pointer;
    ">
      ${emoji}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-suraksha-marker',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
}

export default function LiveRescueMap() {
  const { tr } = useApp();
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selectedPoint, setSelectedPoint] = useState(null);

  const loadPoints = async () => {
    try {
      setLoading(true);
      const res = await apiService.fetchMapPoints();
      setPoints(res.data || []);
    } catch (e) {
      console.error('Failed to load map data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPoints();
    const interval = setInterval(loadPoints, 20000);
    return () => clearInterval(interval);
  }, []);

  const filteredPoints = points.filter((p) => {
    if (filterType !== 'all' && p.type !== filterType) return false;
    if (filterPriority !== 'all' && p.type === 'sos' && p.priority !== filterPriority) return false;
    return true;
  });

  const counts = {
    sos: points.filter((p) => p.type === 'sos').length,
    hospital: points.filter((p) => p.type === 'hospital').length,
    shelter: points.filter((p) => p.type === 'shelter').length,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222222] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>🗺️</span>
            <span>{tr('nav.liveRescueMap')}</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Real-time geospatial coordination: victim SOS coordinates, medical trauma hospitals, and relief shelters
          </p>
        </div>

        <button
          onClick={loadPoints}
          className="bg-[#1c1c1c] hover:bg-[#282828] border border-[#333333] text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 self-start sm:self-auto"
        >
          <span>🔄</span>
          <span>Refresh GPS Points</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#141414] p-3 rounded-xl border border-[#222222]">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-gray-400 text-xs font-bold uppercase mr-1">Layer:</span>
          {[
            { id: 'all', label: `All Facilities (${points.length})` },
            { id: 'sos', label: `🆘 Active SOS (${counts.sos})` },
            { id: 'hospital', label: `🏥 Hospitals (${counts.hospital})` },
            { id: 'shelter', label: `🏕️ Relief Shelters (${counts.shelter})` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === f.id
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-[#1e1e1e] text-gray-400 hover:text-white border border-[#2a2a2a]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filterType === 'sos' || filterType === 'all' ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-gray-400 text-xs font-bold uppercase mr-1">Priority:</span>
            {['all', 'critical', 'high', 'medium'].map((p) => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider transition-all ${
                  filterPriority === p
                    ? 'bg-amber-600 text-white'
                    : 'bg-[#1e1e1e] text-gray-400 hover:text-white border border-[#2a2a2a]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Map Container */}
      <div className="bg-[#141414] rounded-xl border border-[#262626] overflow-hidden shadow-2xl relative" style={{ height: '560px' }}>
        <MapContainer
          center={[12.9716, 77.5946]}
          zoom={11}
          style={{ height: '100%', width: '100%', backgroundColor: '#111111' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {filteredPoints.map((point) => (
            <Marker
              key={point.id}
              position={[point.lat, point.lng]}
              icon={createMapIcon(point.type, point.priority)}
              eventHandlers={{
                click: () => setSelectedPoint(point),
              }}
            >
              <Popup>
                <div className="text-gray-900 p-1 min-w-[200px]">
                  <div className="font-extrabold text-sm mb-1 text-black flex items-center justify-between">
                    <span>{point.name}</span>
                  </div>
                  <p className="text-xs text-gray-700 leading-normal mb-2">{point.details}</p>
                  {point.contact && (
                    <div className="text-xs font-semibold text-blue-700 mb-1">
                      📞 {point.contact}
                    </div>
                  )}
                  {point.priority && (
                    <div className="text-[11px] font-bold text-red-700 uppercase">
                      Urgency: {point.priority} ({point.status})
                    </div>
                  )}
                  <div className="text-[10px] text-gray-500 font-mono mt-2 pt-1 border-t border-gray-200">
                    GPS: {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Map Legend & Demo Data Transparency Notice */}
      <div className="bg-[#141414] rounded-xl border border-[#222222] p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-[#222222] pb-3">
          <h3 className="text-white font-bold text-sm">Interactive Map Legend</h3>
          <span className="text-blue-400 text-xs font-mono">🔵 Verified Facilities marked with DEMO DATA</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { color: '#dc2626', emoji: '🆘', title: 'Critical SOS', sub: 'Threat to life' },
            { color: '#f97316', emoji: '⚠️', title: 'High Priority SOS', sub: 'Injuries present' },
            { color: '#eab308', emoji: '📢', title: 'Medium Priority SOS', sub: 'Assistance needed' },
            { color: '#10b981', emoji: '🏥', title: 'Medical Trauma Unit', sub: 'DEMO Hospital' },
            { color: '#6366f1', emoji: '🏕️', title: 'Relief Shelter Camp', sub: 'DEMO Safe Zone' },
          ].map((item) => (
            <div key={item.title} className="p-3 bg-[#1b1b1b] rounded-lg border border-[#2a2a2a] flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 text-white font-bold border border-white/40"
                style={{ backgroundColor: item.color }}
              >
                {item.emoji}
              </div>
              <div className="min-w-0">
                <span className="text-white text-xs font-bold block truncate">{item.title}</span>
                <span className="text-gray-400 text-[10px] block">{item.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
