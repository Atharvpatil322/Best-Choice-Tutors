import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAllTutors } from '@/services/tutorService';
import TutorCard from '@/components/tutor/TutorCard';
import { LayoutGrid, Map as MapIcon } from 'lucide-react';
import NearbyTutorsMap from '../../utils/NearbyTutorsMap';
import { getMe } from '@/services/authService';
import Seo from '@/components/Seo';

const DEFAULT_DISTANCE_KM = 10;

function BrowseTutors() {
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [userLocation, setUserLocation] = useState(null);
  const [firstSessionDiscountAvailable, setFirstSessionDiscountAvailable] = useState(false);
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

  // Fetch first-session discount eligibility once for the browsing learner.
  useEffect(() => {
    let cancelled = false;
    const loadEligibility = async () => {
      try {
        const data = await getMe();
        if (cancelled) return;
        setFirstSessionDiscountAvailable(Boolean(data?.firstSessionDiscountAvailable));
      } catch {
        if (!cancelled) {
          setFirstSessionDiscountAvailable(false);
        }
      }
    };
    loadEligibility();
    return () => {
      cancelled = true;
    };
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
      <Seo
        title="Browse Tutors | Best Choice Tutors"
        description="Browse verified online and in-person tutors for Mathematics, Physics, English, Languages and more. Filter by subject, price, mode and location."
        keywords="browse tutors, find tutors near me, maths tutor, physics tutor, English tutor, language tutor directory"
        ogTitle="Browse Expert Tutors | Best Choice Tutors"
        ogDescription="Discover expert tutors for school, exams and university. Compare profiles and book sessions securely."
        ogType="website"
      />
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between min-w-0">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1A365D]">Browse Tutors</h1>
          <p className="mt-2 text-slate-500 text-sm sm:text-base">
            Discover our tutors and find the perfect match for your learning needs
          </p>
        </div>
        <div className="flex items-stretch sm:items-center gap-3 w-full sm:w-auto shrink-0">
          <div className="flex flex-1 sm:flex-initial bg-white border border-slate-200 rounded-xl p-1 shadow-sm min-w-0">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="gap-1.5 sm:gap-2 flex-1 sm:flex-initial px-3"
            >
              <LayoutGrid size={16} className="shrink-0" /> <span className="truncate">Grid</span>
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                if (viewMode !== 'map') requestLocation();
                setViewMode('map');
              }}
              className="gap-1.5 sm:gap-2 flex-1 sm:flex-initial px-3"
            >
              <MapIcon size={16} className="shrink-0" /> <span className="truncate">Map</span>
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
            <TutorCard
              key={tutor.id}
              tutor={tutor}
              firstSessionDiscountAvailable={firstSessionDiscountAvailable}
            />
          ))}
        </div>
      ) : (
        <div className="animate-in fade-in duration-500">
          <NearbyTutorsMap
            tutorsData={tutors}
            userLocation={userLocation}
            firstSessionDiscountAvailable={firstSessionDiscountAvailable}
          />
        </div>
      )}
    </div>
  );
}

export default BrowseTutors;