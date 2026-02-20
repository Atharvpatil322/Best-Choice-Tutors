import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAllTutors } from '@/services/tutorService';
import TutorCard from '@/components/tutor/TutorCard';
import { LayoutGrid, Map as MapIcon } from 'lucide-react';
import NearbyTutorsMap from '../../utils/NearbyTutorsMap';

const DEFAULT_DISTANCE_KM = 10;

function BrowseTutors() {
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [userLocation, setUserLocation] = useState(null);
  const locationRequested = useRef(false);

  const requestLocation = () => {
    if (locationRequested.current || !navigator.geolocation) return;
    locationRequested.current = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setUserLocation(null);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }

  useEffect(() => {
    requestLocation();
  }, []);

  useEffect(() => {
    const fetchTutors = async () => {
      try {
        setLoading(true);
        const filters = userLocation
          ? { lat: userLocation.lat, lng: userLocation.lng, distance: DEFAULT_DISTANCE_KM }
          : {};
        const data = await getAllTutors(filters);
        setTutors(data.tutors || []);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to load tutors');
      } finally {
        setLoading(false);
      }
    };
    fetchTutors();
  }, [userLocation]);

  // ... (keep your loading and error states as they are)

  return (
    <div className="space-y-6 pb-12">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1A365D]">Browse Tutors</h1>
          <p className="mt-2 text-slate-500">
            Discover our tutors and find the perfect match for your learning needs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="gap-2"
            >
              <LayoutGrid size={16} /> Grid
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                if (viewMode !== 'map') requestLocation();
                setViewMode('map');
              }}
              className="gap-2"
            >
              <MapIcon size={16} /> Map
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <Card className="border-slate-100 rounded-2xl">
          <CardContent className="p-12 text-center text-slate-500">
            Loading tutors…
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-slate-100 rounded-2xl">
          <CardContent className="p-12 text-center text-destructive">
            {error}
          </CardContent>
        </Card>
      ) : tutors.length === 0 ? (
        <Card className="border-slate-100 rounded-2xl">
          <CardContent className="p-12 text-center text-slate-500">
            No tutors available at the moment.
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="space-y-6">
          {tutors.map((tutor) => (
            <TutorCard key={tutor.id} tutor={tutor} />
          ))}
        </div>
      ) : (
        <div className="animate-in fade-in duration-500">
          <NearbyTutorsMap tutorsData={tutors} userLocation={userLocation} />
        </div>
      )}
    </div>
  );
}

export default BrowseTutors;