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
import { SubjectSelector } from '@/components/SubjectSelector';
import { Plus, ChevronRight, PoundSterling, Video, MessageSquare } from 'lucide-react';

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
    subjects: [],
    budget: '',
    mode: '',
    description: '',
  });

  const validate = () => {
    const next = {};
    if (!Array.isArray(formData.subjects) || formData.subjects.length === 0) {
      next.subjects = 'Select at least one subject';
    }
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
        subjects: formData.subjects,
        budget: Number(formData.budget),
        mode: formData.mode,
        description: formData.description.trim(),
      });
      toast.success('Tuition request has been created.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Could not create request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="rounded-[32px] border-slate-100 shadow-lg p-10 bg-white">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1A365D] mb-2">Create a tuition request</h1>
          <p className="text-slate-500 text-sm">Describe what you need. Verified tutors will see your request and can express interest.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[#1A365D] font-bold text-sm">Subjects</Label>
            <p className="text-xs text-slate-500 mb-2">Select all that apply (at least one)</p>
            <SubjectSelector
              value={formData.subjects}
              onChange={(subjects) => {
                setFormData((prev) => ({ ...prev, subjects }));
                if (errors.subjects) setErrors((prev) => ({ ...prev, subjects: undefined }));
              }}
              chipClassName="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              chipSelectedClassName="bg-[#1A365D] text-white"
              chipUnselectedClassName="bg-slate-100 text-slate-600 hover:bg-slate-200"
            />
            {errors.subjects && (
              <p className="text-sm text-red-600 mt-1">{errors.subjects}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-[#1A365D] font-bold text-sm">Budget (£ per hour)</Label>
            <Input
              type="number"
              placeholder="e.g. 30"
              value={formData.budget}
              onChange={(e) => handleChange('budget', e.target.value)}
              className="h-12 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-[#1A365D]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[#1A365D] font-bold text-sm">Mode</Label>
            <Select value={formData.mode} onValueChange={(v) => handleChange('mode', v)}>
              <SelectTrigger className="h-12 bg-slate-50 border-none rounded-xl">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                {MODE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[#1A365D] font-bold text-sm">Description</Label>
            <textarea
              rows={5}
              placeholder="What do you need help with? Grade level, topics, frequency..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-[#1A365D] outline-none"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={submitting} className="flex-1 bg-[#3B82F6] hover:bg-blue-600 text-white h-12 rounded-xl font-bold">
              {submitting ? 'Creating…' : 'Create request'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1 h-12 rounded-xl border-slate-200 text-[#1A365D]">
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default CreateTuitionRequest;
