import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Clock, ChevronRight, MapPin, Globe, CheckCircle, ShieldCheck } from 'lucide-react';

const DEFAULT_CENTER = [19.076, 72.877];

function formatHourlyRate(rate) {
  if (rate == null || rate === '' || !Number.isFinite(Number(rate))) return '—';
  return `£${parseFloat(rate).toFixed(2)}`;
}

const NearbyTutorsMap = ({ tutorsData, userLocation = null }) => {
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

  // Enhanced Custom Icon with Hover Animation
  const createCustomIcon = (tutor) => {
    const rateText = formatHourlyRate(tutor.hourlyRate);
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
    <div className="relative w-full h-[650px] rounded-3xl overflow-hidden border border-slate-200 shadow-2xl bg-slate-50">
      {/* Floating Info Badge */}
      <div className="absolute top-6 left-6 z-[1000] bg-white/80 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-xl">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <MapPin size={16} className="text-blue-600" />
          Tutors in this Area
        </h3>
        <p className="text-[11px] text-slate-500 mt-1">
          Showing <span className="text-blue-600 font-bold">{tutorsData.length}</span> verified instructors
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
          .map((tutor) => (
          <Marker 
            key={tutor.id} 
            position={[tutor.location.lat, tutor.location.lng]}
            icon={createCustomIcon(tutor)}
          >
           <Popup className="custom-premium-popup" maxWidth={400} minWidth={340}>
  <div className="w-full bg-white p-2">
    {/* Header – name, badges, rating */}
    <div className="mb-4">
      <div className="flex items-center gap-2 flex-wrap">
        <h4 className="font-extrabold text-slate-900 text-xl leading-tight tracking-tight">
          {tutor.fullName}
        </h4>
        {tutor.isVerified && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700" title="Document verified">
            <CheckCircle size={12} className="shrink-0" />
            Verified
          </span>
        )}
        {tutor.isDbsVerified && (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700" title="DBS verified">
            <ShieldCheck size={12} className="shrink-0" />
            DBS
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 text-sm mt-1.5 font-bold text-slate-500">
        <span className="flex items-center gap-1 text-amber-500 bg-amber-50 px-2 py-0.5 rounded-lg">
          {tutor.averageRating || 'New'}
        </span>
        <span className="text-slate-300">|</span>
        <span>{tutor.reviewCount || 0} reviews</span>
      </div>
    </div>

    {/* Info Grid - Spaced out more with better width */}
    <div className="grid grid-cols-2 gap-3 mb-5">
       <div className="bg-slate-50 p-3 rounded-2xl flex items-center gap-3 border border-slate-100">
          <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600">
            <Clock size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-slate-400 font-black">Experience</span>
            <span className="text-xs font-black text-slate-700">{tutor.experienceYears} Years</span>
          </div>
       </div>
       <div className="bg-slate-50 p-3 rounded-2xl flex items-center gap-3 border border-slate-100">
          <div className="bg-indigo-100 p-1.5 rounded-lg text-indigo-600">
            <Globe size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-slate-400 font-black">Method</span>
            <span className="text-xs font-black text-slate-700 truncate">{tutor.mode}</span>
          </div>
       </div>
    </div>

    {/* Subjects - More padding and clearer separation */}
    <div className="space-y-2 mb-6">
      <p className="text-[10px] uppercase text-slate-400 font-black ml-1">Specializations</p>
      <div className="flex flex-wrap gap-2">
        {tutor.subjects?.slice(0, 5).map(s => (
          <span key={s} className="bg-white border border-blue-100 text-blue-600 text-[11px] px-3 py-1.5 rounded-xl font-extrabold shadow-sm hover:bg-blue-50 transition-colors">
            {s}
          </span>
        ))}
      </div>
    </div>

    {/* Price & Action Footer */}
    <div className="flex items-center gap-3 pt-2">
      <div className="flex flex-col shrink-0 px-1">
         <span className="text-[10px] uppercase text-slate-400 font-black">Hourly Rate</span>
         <span className="text-xl font-black text-slate-900">{formatHourlyRate(tutor.hourlyRate)}/hr</span>
      </div>
      <button 
        type="button"
        onClick={() => navigate(`/dashboard/tutors/${tutor.id}`)}
        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-100 active:scale-95"
      >
        View Full Profile
        <ChevronRight size={18} />
      </button>
    </div>
  </div>
</Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Modern Styles for Animations and Layout */}
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
          border-radius: 20px;
          padding: 12px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
          border: 1px solid #f1f5f9;
        }
        
        .custom-premium-popup .leaflet-popup-tip {
          background: white;
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