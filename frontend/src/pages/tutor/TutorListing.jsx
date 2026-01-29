/**
 * Tutor Listing Page
 * Phase 3.4: Display list of tutors with basic filters
 * 
 * Features:
 * - Fetch and display all tutors
 * - Basic filters: subject, mode, price range (UI only, client-side filtering)
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getAllTutors } from '@/services/tutorService';
import TutorCard from '@/components/tutor/TutorCard';

function TutorListing() {
  const navigate = useNavigate();
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [filters, setFilters] = useState({
    subject: '',
    mode: '',
    minPrice: '',
    maxPrice: '',
  });

  // Available subjects for filter (extracted from all tutors)
  const availableSubjects = useMemo(() => {
    const subjectsSet = new Set();
    tutors.forEach((tutor) => {
      if (tutor.subjects && Array.isArray(tutor.subjects)) {
        tutor.subjects.forEach((subject) => subjectsSet.add(subject));
      }
    });
    return Array.from(subjectsSet).sort();
  }, [tutors]);

  const SUBJECT_ALL = '__subject_all__'; // Radix Select disallows empty string for SelectItem value
  const MODE_ALL = '__mode_all__';
  const teachingModes = [
    { value: MODE_ALL, label: 'All Modes' },
    { value: 'Online', label: 'Online' },
    { value: 'In-Person', label: 'In-Person' },
    { value: 'Both', label: 'Both' },
  ];

  useEffect(() => {
    const fetchTutors = async () => {
      try {
        setLoading(true);
        const data = await getAllTutors();
        setTutors(data.tutors || []);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to load tutors');
      } finally {
        setLoading(false);
      }
    };

    fetchTutors();
  }, []);

  // Client-side filtering
  const filteredTutors = useMemo(() => {
    return tutors.filter((tutor) => {
      // Subject filter
      if (filters.subject) {
        const tutorSubjects = tutor.subjects || [];
        if (!tutorSubjects.includes(filters.subject)) {
          return false;
        }
      }

      // Mode filter
      if (filters.mode) {
        if (tutor.mode !== filters.mode) {
          return false;
        }
      }

      // Price range filter
      const tutorRate = parseFloat(tutor.hourlyRate) || 0;
      if (filters.minPrice) {
        const minPrice = parseFloat(filters.minPrice);
        if (tutorRate < minPrice) {
          return false;
        }
      }
      if (filters.maxPrice) {
        const maxPrice = parseFloat(filters.maxPrice);
        if (tutorRate > maxPrice) {
          return false;
        }
      }

      return true;
    });
  }, [tutors, filters]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      subject: '',
      mode: '',
      minPrice: '',
      maxPrice: '',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="container mx-auto max-w-7xl">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">Loading tutors...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="container mx-auto max-w-7xl">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-red-600">Error: {error}</p>
              <div className="mt-4 flex justify-center">
                <Button variant="outline" onClick={() => navigate('/')}>
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Find a Tutor</h1>
          <p className="mt-2 text-muted-foreground">
            Browse our tutors and find the perfect match for your learning needs
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {/* Subject Filter */}
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Select
                  value={filters.subject || SUBJECT_ALL}
                  onValueChange={(value) => handleFilterChange('subject', value === SUBJECT_ALL ? '' : value)}
                >
                  <SelectTrigger className="mt-1" id="subject">
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SUBJECT_ALL}>All Subjects</SelectItem>
                    {availableSubjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mode Filter */}
              <div>
                <Label htmlFor="mode">Teaching Mode</Label>
                <Select
                  value={filters.mode || MODE_ALL}
                  onValueChange={(value) => handleFilterChange('mode', value === MODE_ALL ? '' : value)}
                >
                  <SelectTrigger className="mt-1" id="mode">
                    <SelectValue placeholder="All Modes" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachingModes.map((mode) => (
                      <SelectItem key={mode.value} value={mode.value}>
                        {mode.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Min Price Filter */}
              <div>
                <Label htmlFor="minPrice">Min Price (£)</Label>
                <Input
                  id="minPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  className="mt-1"
                  placeholder="Min"
                />
              </div>

              {/* Max Price Filter */}
              <div>
                <Label htmlFor="maxPrice">Max Price (£)</Label>
                <Input
                  id="maxPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className="mt-1"
                  placeholder="Max"
                />
              </div>

              {/* Clear Filters Button */}
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-muted-foreground">
            Showing {filteredTutors.length} of {tutors.length} tutors
          </p>
        </div>

        {/* Tutor Cards Grid */}
        {filteredTutors.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                No tutors found matching your filters.
              </p>
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="mt-4"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTutors.map((tutor) => (
              <TutorCard key={tutor.id} tutor={tutor} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TutorListing;
