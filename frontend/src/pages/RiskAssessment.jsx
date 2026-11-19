import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { apiService } from '../services/api';
import Badge from '../components/Badge';

const RISK_THEMES = {
  low: {
    bg: 'bg-emerald-950/40 border-emerald-800 text-emerald-300',
    bar: 'bg-emerald-500',
    title: 'text-emerald-400',
  },
  medium: {
    bg: 'bg-yellow-950/40 border-yellow-800 text-yellow-300',
    bar: 'bg-yellow-500',
    title: 'text-yellow-400',
  },
  high: {
    bg: 'bg-orange-950/40 border-orange-800 text-orange-300',
    bar: 'bg-orange-500',
    title: 'text-orange-400',
  },
  critical: {
    bg: 'bg-red-950/60 border-red-700 text-red-200 shadow-lg shadow-red-950/50',
    bar: 'bg-red-600',
    title: 'text-red-400',
  },
};

export default function RiskAssessment() {
  const { tr } = useApp();
  const [activeTab, setActiveTab] = useState('flood');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Flood model inputs
  const [floodForm, setFloodForm] = useState({
    rainfall_mm: 120,
    water_level_m: 6.5,
    previous_flooding: true,
    soil_saturation: 85,
  });

  // Landslide model inputs
  const [landslideForm, setLandslideForm] = useState({
    rainfall_intensity: 45,
    soil_moisture: 80,
    slope_angle: 40,
    historical_landslides: true,
    vegetation_cover: 'sparse',
  });

  const assess = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const payload =
        activeTab === 'flood'
          ? { disaster_type: 'flood', flood_data: floodForm }
          : { disaster_type: 'landslide', landslide_data: landslideForm };

      const res = await apiService.assessDisasterRisk(payload);
      setResult(res.data);
    } catch (e) {
      setError(e.message || 'Failed to complete risk assessment');
    } finally {
      setLoading(false);
    }
  };

  const theme = result ? RISK_THEMES[result.risk_level] || RISK_THEMES.medium : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222222] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>🔬</span>
            <span>{tr('risk.title')}</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">{tr('risk.subtitle')}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-purple-950/80 text-purple-300 border border-purple-800 text-xs px-3 py-1.5 rounded-lg font-mono">
            🤖 Engine: Rule-Based v1.0
          </span>
        </div>
      </div>

      {/* Model Limitation / Disclaimer Notice */}
      <div className="bg-[#141414] border border-amber-900/60 rounded-xl p-4 flex items-start gap-3">
        <span className="text-xl">⚠️</span>
        <div className="text-xs text-amber-200/90 leading-relaxed">
          <strong className="font-bold text-amber-300 block mb-0.5">SCIENTIFIC TRANSPARENCY NOTICE:</strong>
          {tr('risk.disclaimer')}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#222222] pb-2">
        <button
          onClick={() => {
            setActiveTab('flood');
            setResult(null);
            setError('');
          }}
          className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'flood'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-950/60'
              : 'bg-[#141414] text-gray-400 hover:text-white border border-[#222222]'
          }`}
        >
          <span>🌊</span>
          <span>{tr('risk.flood')}</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('landslide');
            setResult(null);
            setError('');
          }}
          className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'landslide'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-950/60'
              : 'bg-[#141414] text-gray-400 hover:text-white border border-[#222222]'
          }`}
        >
          <span>⛰️</span>
          <span>{tr('risk.landslide')}</span>
        </button>
      </div>

      {/* Two Column Layout: Parameters & Assessment Result */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Form Inputs Card */}
        <div className="bg-[#141414] rounded-xl border border-[#222222] p-6 shadow-lg space-y-5">
          <div className="flex items-center justify-between border-b border-[#222222] pb-3">
            <h2 className="text-white font-bold text-base flex items-center gap-2">
              <span>🎛️</span>
              <span>{activeTab === 'flood' ? 'Flood Hydrological Parameters' : 'Landslide Geological Parameters'}</span>
            </h2>
            <span className="text-gray-400 text-xs">Simulate environmental inputs</span>
          </div>

          {activeTab === 'flood' ? (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-gray-300">{tr('risk.rainfall')}</span>
                  <span className="text-red-400 font-mono text-sm">{floodForm.rainfall_mm} mm</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="300"
                  step="5"
                  value={floodForm.rainfall_mm}
                  onChange={(e) => setFloodForm({ ...floodForm, rainfall_mm: parseFloat(e.target.value) })}
                  className="w-full accent-red-600 bg-[#222222] h-2 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
                  <span>0 mm (Drizzle)</span>
                  <span>100 mm (Heavy)</span>
                  <span>300 mm (Cloudburst level)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-gray-300">{tr('risk.waterLevel')}</span>
                  <span className="text-red-400 font-mono text-sm">{floodForm.water_level_m} m</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="0.5"
                  value={floodForm.water_level_m}
                  onChange={(e) => setFloodForm({ ...floodForm, water_level_m: parseFloat(e.target.value) })}
                  className="w-full accent-red-600 bg-[#222222] h-2 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
                  <span>0 m (Normal)</span>
                  <span>5 m (Warning level)</span>
                  <span>15 m (Extreme crest)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-gray-300">{tr('risk.soilSaturation')}</span>
                  <span className="text-red-400 font-mono text-sm">{floodForm.soil_saturation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={floodForm.soil_saturation}
                  onChange={(e) => setFloodForm({ ...floodForm, soil_saturation: parseFloat(e.target.value) })}
                  className="w-full accent-red-600 bg-[#222222] h-2 rounded-lg cursor-pointer"
                />
              </div>

              <div className="p-3 bg-[#1b1b1b] rounded-lg border border-[#2a2a2a] flex items-center justify-between">
                <div>
                  <span className="text-white text-xs font-semibold block">{tr('risk.previousFlooding')}</span>
                  <span className="text-gray-400 text-[11px]">Area has recurrent drainage or inundation records</span>
                </div>
                <input
                  type="checkbox"
                  checked={floodForm.previous_flooding}
                  onChange={(e) => setFloodForm({ ...floodForm, previous_flooding: e.target.checked })}
                  className="w-5 h-5 accent-red-600 cursor-pointer"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-gray-300">{tr('risk.rainfallIntensity')}</span>
                  <span className="text-amber-400 font-mono text-sm">{landslideForm.rainfall_intensity} mm/hr</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={landslideForm.rainfall_intensity}
                  onChange={(e) =>
                    setLandslideForm({ ...landslideForm, rainfall_intensity: parseFloat(e.target.value) })
                  }
                  className="w-full accent-amber-600 bg-[#222222] h-2 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-gray-300">{tr('risk.soilMoisture')}</span>
                  <span className="text-amber-400 font-mono text-sm">{landslideForm.soil_moisture}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={landslideForm.soil_moisture}
                  onChange={(e) =>
                    setLandslideForm({ ...landslideForm, soil_moisture: parseFloat(e.target.value) })
                  }
                  className="w-full accent-amber-600 bg-[#222222] h-2 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-gray-300">{tr('risk.slopeAngle')}</span>
                  <span className="text-amber-400 font-mono text-sm">{landslideForm.slope_angle}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80"
                  step="5"
                  value={landslideForm.slope_angle}
                  onChange={(e) =>
                    setLandslideForm({ ...landslideForm, slope_angle: parseFloat(e.target.value) })
                  }
                  className="w-full accent-amber-600 bg-[#222222] h-2 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
                  <span>0° (Gentle)</span>
                  <span>30° (Critical slip threshold)</span>
                  <span>80° (Sheer cliff)</span>
                </div>
              </div>

              <div>
                <label className="text-gray-300 text-xs font-semibold block mb-1.5">
                  {tr('risk.vegetationCover')}
                </label>
                <select
                  value={landslideForm.vegetation_cover}
                  onChange={(e) => setLandslideForm({ ...landslideForm, vegetation_cover: e.target.value })}
                  className="w-full bg-[#1c1c1c] border border-[#333333] text-white rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none"
                >
                  <option value="dense">Dense Root Forest (High Stabilization)</option>
                  <option value="moderate">Moderate Grass & Shrub Cover</option>
                  <option value="sparse">Sparse / Bare Deforested Soil (High Vulnerability)</option>
                </select>
              </div>

              <div className="p-3 bg-[#1b1b1b] rounded-lg border border-[#2a2a2a] flex items-center justify-between">
                <div>
                  <span className="text-white text-xs font-semibold block">{tr('risk.historicalLandslides')}</span>
                  <span className="text-gray-400 text-[11px]">Known geological fracture or historical slip zone</span>
                </div>
                <input
                  type="checkbox"
                  checked={landslideForm.historical_landslides}
                  onChange={(e) =>
                    setLandslideForm({ ...landslideForm, historical_landslides: e.target.checked })
                  }
                  className="w-5 h-5 accent-amber-600 cursor-pointer"
                />
              </div>
            </div>
          )}

          <button
            onClick={assess}
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide text-white transition-all shadow-lg flex items-center justify-center gap-2 ${
              activeTab === 'flood'
                ? 'bg-gradient-to-r from-blue-700 to-red-600 hover:from-blue-600 hover:to-red-500'
                : 'bg-gradient-to-r from-amber-700 to-red-600 hover:from-amber-600 hover:to-red-500'
            } disabled:opacity-50`}
          >
            {loading ? (
              <>
                <span className="animate-spin">⚙️</span>
                <span>Executing Explainable AI Triage Model...</span>
              </>
            ) : (
              <>
                <span>🔬</span>
                <span>{tr('risk.assess')}</span>
              </>
            )}
          </button>
        </div>

        {/* Assessment Evaluation Card */}
        <div className="space-y-5">
          {error && (
            <div className="p-4 bg-red-950/60 border border-red-800 rounded-xl text-red-300 text-sm">
              ⚠️ {error}
            </div>
          )}

          {!result && !error && (
            <div className="bg-[#141414] rounded-xl border border-[#222222] p-10 text-center flex flex-col items-center justify-center min-h-[360px]">
              <span className="text-5xl mb-3 opacity-60">🔬</span>
              <h3 className="text-white font-bold text-base">Model Awaiting Execution</h3>
              <p className="text-gray-400 text-xs max-w-sm mt-1.5 leading-relaxed">
                Adjust input parameters on the left and click "{tr('risk.assess')}" to calculate risk score, factor breakdown, and safety precautions.
              </p>
            </div>
          )}

          {result && theme && (
            <div className="space-y-4">
              {/* Score Header */}
              <div className={`p-6 rounded-xl border ${theme.bg}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-xs uppercase tracking-wider font-bold opacity-80 block">
                      {tr('risk.riskLevel')}
                    </span>
                    <span className={`text-3xl sm:text-4xl font-black ${theme.title}`}>
                      {result.risk_level.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs uppercase tracking-wider font-bold opacity-80 block">
                      {tr('risk.score')}
                    </span>
                    <span className="text-3xl font-mono font-extrabold text-white">
                      {result.score}
                      <span className="text-sm text-gray-400 font-normal"> / {result.max_score}</span>
                    </span>
                  </div>
                </div>

                <div className="w-full bg-black/60 rounded-full h-3 overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${theme.bar}`}
                    style={{ width: `${Math.min(100, (result.score / result.max_score) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Factors Breakdown */}
              <div className="bg-[#141414] rounded-xl border border-[#222222] p-5 shadow-lg space-y-3">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <span>📊</span>
                  <span>{tr('risk.factors')}</span>
                </h3>

                <div className="space-y-2.5">
                  {result.factors.map((f, i) => (
                    <div key={i} className="p-2.5 bg-[#1a1a1a] rounded-lg border border-[#262626]">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-300 font-medium">
                          {f.name}: <strong className="text-white font-mono">{f.value}</strong>
                        </span>
                        <span
                          className={`font-bold font-mono px-1.5 py-0.5 rounded text-[11px] ${
                            f.category === 'high'
                              ? 'text-red-400 bg-red-950/60'
                              : f.category === 'medium'
                              ? 'text-yellow-400 bg-yellow-950/60'
                              : 'text-green-400 bg-green-950/60'
                          }`}
                        >
                          +{f.impact} pts ({f.category})
                        </span>
                      </div>
                      <div className="w-full bg-[#262626] rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            f.category === 'high'
                              ? 'bg-red-500'
                              : f.category === 'medium'
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(100, (f.impact / 40) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Explanation Card */}
              <div className="bg-[#141414] rounded-xl border border-[#222222] p-5 shadow-lg space-y-2">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <span>🧠</span>
                  <span>{tr('risk.explanation')}</span>
                </h3>
                <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                  {result.explanation}
                </p>
              </div>

              {/* Precautions Card */}
              <div className="bg-[#141414] rounded-xl border border-[#222222] p-5 shadow-lg space-y-3">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <span>🛡️</span>
                  <span>{tr('risk.precautions')}</span>
                </h3>

                <ul className="space-y-2">
                  {result.precautions.map((p, i) => (
                    <li
                      key={i}
                      className="p-2.5 bg-emerald-950/30 border border-emerald-900/50 rounded-lg text-emerald-300 text-xs flex items-start gap-2"
                    >
                      <span className="font-bold text-emerald-400">✓</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
