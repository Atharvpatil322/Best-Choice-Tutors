import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Clock, ChevronRight, MapPin, Globe, CheckCircle, ShieldCheck } from 'lucide-react';

const DEFAULT_CENTER = [19.076, 72.877];

function getRates(rate, firstSessionDiscountAvailable) {
  const numeric = Number(rate);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return { base: null, discounted: null };
  }
  if (firstSessionDiscountAvailable) {
    return { base: numeric, discounted: numeric * 0.8 };
  }
  return { base: numeric, discounted: null };
}

function formatHourlyRate(rate) {
  if (rate == null || rate === '' || !Number.isFinite(Number(rate))) return '—';
  return `£${parseFloat(rate).toFixed(2)}`;
}

const NearbyTutorsMap = ({ tutorsData, userLocation = null, firstSessionDiscountAvailable = false }) => {
  const navigate = useNavigate();
  const nearestTutor = tutorsData.length > 0 && tutorsData[0].location?.lat != null && tutorsData[0].location?.lng != null
    ? tutorsData[0]
    : null;
  const defaultCenter =
    userLocation && nearestTutor
      ? [nearestTutor.location.lat, nearestTutor.location.lng]
      : userLocation
        ? [userLocation.lat, userLocation.lng]
        : nearestTutor
          ? [nearestTutor.location.lat, nearestTutor.location.lng]
          : DEFAULT_CENTER;

  // Custom Icon with rate label (uses discounted rate when available)
  const createCustomIcon = (tutor) => {
    const { discounted, base } = getRates(tutor.hourlyRate, firstSessionDiscountAvailable);
    const rateValue = discounted ?? base;
    const rateText = rateValue != null ? `£${rateValue.toFixed(2)}` : '£—';
    return L.divIcon({
      html: `
        <div class="marker-container">
          <div class="marker-pin shadow-lg">
            <span class="price-text">${rateText}</span>
          </div>
          <div class="marker-arrow"></div>
        </div>
      `,
      className: 'custom-div-icon',
      iconSize: [50, 40],
      iconAnchor: [25, 40],
      popupAnchor: [0, -40]
    });
  };

  return (
    <div className="relative isolate w-full min-h-[260px] h-[52vh] max-h-[650px] sm:h-[58vh] md:h-[62vh] lg:h-[650px] rounded-3xl overflow-hidden border border-slate-200 bg-slate-50">
      {/* Simple info badge — z within isolated map stack only */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-[1000] max-w-[calc(100%-1.5rem)] bg-white/90 backdrop-blur border border-slate-200 px-3 py-2 rounded-xl shadow-sm">
        <p className="text-xs font-medium text-slate-700 flex items-center gap-1">
          <MapPin size={14} className="text-blue-600" />
          {tutorsData.length} tutor{tutorsData.length === 1 ? '' : 's'} in this area
        </p>
      </div>
      <MapContainer 
        center={defaultCenter} 
        zoom={12} 
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; CARTO'
        />
        <ZoomControl position="bottomright" />

        {tutorsData
          .filter((t) => t.location?.lat != null && t.location?.lng != null)
          .map((tutor) => {
            const { base, discounted } = getRates(
              tutor.hourlyRate,
              firstSessionDiscountAvailable
            );
            const hasRate = base != null;

            return (
              <Marker 
                key={tutor.id} 
                position={[tutor.location.lat, tutor.location.lng]}
                icon={createCustomIcon(tutor)}
              >
                <Popup className="custom-premium-popup" maxWidth={360} minWidth={260}>
                  <div className="w-full bg-white p-3">
                    {/* Header – name, badges, rating */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-slate-900 text-base leading-snug">
                          {tutor.fullName}
                        </h4>
                        {tutor.isVerified && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
                            title="Document verified"
                          >
                            <CheckCircle size={12} className="shrink-0" />
                            Verified
                          </span>
                        )}
                        {tutor.isDbsVerified && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700"
                            title="DBS verified"
                          >
                            <ShieldCheck size={12} className="shrink-0" />
                            DBS
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs mt-1 text-slate-500">
                        <span className="flex items-center gap-1 text-amber-500">
                          {tutor.averageRating || 'New'}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span>{tutor.reviewCount || 0} reviews</span>
                      </div>
                    </div>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-3 mb-3 text-xs text-slate-600">
                      {typeof tutor.experienceYears === 'number' && (
                        <span className="flex items-center gap-1">
                          <Clock size={14} className="text-slate-400" />
                          {tutor.experienceYears} yr experience
                        </span>
                      )}
                      {tutor.mode && (
                        <span className="flex items-center gap-1">
                          <Globe size={14} className="text-slate-400" />
                          {tutor.mode}
                        </span>
                      )}
                    </div>

                    {/* Subjects (compact) */}
                    {Array.isArray(tutor.subjects) && tutor.subjects.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1.5">
                          {tutor.subjects.slice(0, 3).map((s) => (
                            <span
                              key={s}
                              className="bg-slate-50 border border-slate-200 text-[11px] px-2 py-0.5 rounded-full text-slate-700"
                            >
                              {s}
                            </span>
                          ))}
                          {tutor.subjects.length > 3 && (
                            <span className="text-[11px] text-slate-500">
                              +{tutor.subjects.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Price & Action */}
                    <div className="flex items-center gap-3 pt-1">
                      {hasRate && (
                        <div className="flex flex-col shrink-0">
                          {discounted ? (
                            <>
                              <span className="text-[11px] text-slate-500 line-through">
                                £{base.toFixed(2)}/hr
                              </span>
                              <span className="text-sm font-semibold text-[#1A365D]">
                                £{discounted.toFixed(2)}/hr
                              </span>
                              <span className="text-[11px] text-emerald-700">
                                20% off your first session
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-[11px] text-slate-500">Hourly rate</span>
                              <span className="text-sm font-semibold text-[#1A365D]">
                                {formatHourlyRate(base)}/hr
                              </span>
                            </>
                          )}
                        </div>
                      )}
                      <button 
                        type="button"
                        onClick={() => navigate(`/dashboard/tutors/${tutor.id}`)}
                        className="flex-1 bg-[#1A365D] hover:bg-[#1A365D]/90 text-white font-medium py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        View profile
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>

      {/* Marker and popup styles */}
      <style>{`
        /* Marker Styling */
        .marker-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .marker-pin {
          background: #2563eb;
          color: white;
          padding: 6px 12px;
          border-radius: 12px;
          font-weight: 800;
          font-size: 14px;
          border: 2px solid white;
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        .marker-arrow {
          width: 0; 
          height: 0; 
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 8px solid #2563eb;
          margin-top: -1px;
        }

        /* Hover Behavior */
        .marker-container:hover {
          transform: translateY(-5px) scale(1.15);
          z-index: 1000 !important;
        }

        .marker-container:hover .marker-pin {
          background: #1e40af;
          box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.4);
        }

        .marker-container:hover .marker-arrow {
          border-top-color: #1e40af;
        }

        /* Popup Cleanup */
        .custom-premium-popup .leaflet-popup-content-wrapper {
          border-radius: 14px;
          padding: 4px;
          box-shadow: 0 12px 30px -12px rgba(15, 23, 42, 0.25);
          border: 1px solid #e2e8f0;
        }

        .custom-premium-popup .leaflet-popup-tip {
          background: #ffffff;
        }

        .custom-div-icon {
          background: none !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
};

export default NearbyTutorsMap;