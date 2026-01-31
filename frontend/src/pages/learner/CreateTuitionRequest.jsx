/**
 * Create Tuition Request Page
 * Phase 9: Reverse Discovery – learners post a tutoring need
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
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
import { createTuitionRequest } from '@/services/tuitionRequestService';
import { toast } from 'sonner';

const MODE_OPTIONS = [
  { value: 'ONLINE', label: 'Online' },
  { value: 'IN_PERSON', label: 'In-Person' },
  { value: 'EITHER', label: 'Either' },
];

function CreateTuitionRequest() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    subject: '',
    budget: '',
    mode: '',
    description: '',
  });

  const validate = () => {
    const next = {};
    if (!formData.subject?.trim()) next.subject = 'Subject is required';
    if (formData.budget === '' || formData.budget == null) next.budget = 'Budget is required';
    else if (Number(formData.budget) < 0 || isNaN(Number(formData.budget))) next.budget = 'Budget must be 0 or more';
    if (!formData.mode) next.mode = 'Mode is required';
    if (!formData.description?.trim()) next.description = 'Description is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const result = await createTuitionRequest({
        subject: formData.subject.trim(),
        budget: Number(formData.budget),
        mode: formData.mode,
        description: formData.description.trim(),
      });
      toast.success('Tuition request created');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Failed to create request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="container mx-auto max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>Create a tuition request</CardTitle>
            <CardDescription>
              Describe what you need. Verified tutors will see your request and can express interest.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="e.g. Mathematics, Physics"
                  value={formData.subject}
                  onChange={(e) => handleChange('subject', e.target.value)}
                  className={errors.subject ? 'border-destructive' : ''}
                />
                {errors.subject && (
                  <p className="text-sm text-destructive">{errors.subject}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">Budget (per hour)</Label>
                <Input
                  id="budget"
                  type="number"
                  min={0}
                  step={1}
                  placeholder="e.g. 30"
                  value={formData.budget}
                  onChange={(e) => handleChange('budget', e.target.value)}
                  className={errors.budget ? 'border-destructive' : ''}
                />
                {errors.budget && (
                  <p className="text-sm text-destructive">{errors.budget}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mode">Mode</Label>
                <Select
                  value={formData.mode}
                  onValueChange={(value) => handleChange('mode', value)}
                >
                  <SelectTrigger id="mode" className={errors.mode ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.mode && (
                  <p className="text-sm text-destructive">{errors.mode}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  rows={4}
                  placeholder="What do you need help with? Grade level, topics, frequency..."
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px] resize-y"
                  style={{ resize: 'vertical' }}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description}</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Creating…' : 'Create request'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default CreateTuitionRequest;
