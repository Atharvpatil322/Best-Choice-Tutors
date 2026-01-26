/**
 * Browse Tutors Page
 * UI task: Browse Tutors screen for learners
 * 
 * Features:
 * - Fetch tutors from GET /api/tutors
 * - Display tutor cards (name, subjects, mode, price)
 * - Empty state if no tutors
 * - Clicking a tutor navigates to tutor profile page
 * - Read-only, no booking logic
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAllTutors } from '@/services/tutorService';
import TutorCard from '@/components/tutor/TutorCard';

function BrowseTutors() {
  const navigate = useNavigate();
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Browse Tutors</h1>
            <p className="mt-2 text-muted-foreground">
              Discover our tutors and find the perfect match for your learning needs
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>

        {/* Tutor Cards Grid */}
        {tutors.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                No tutors available at the moment.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tutors.map((tutor) => (
              <TutorCard key={tutor.id} tutor={tutor} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BrowseTutors;
