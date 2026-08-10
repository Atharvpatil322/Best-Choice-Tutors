/**
 * Admin Benefit Manager
 * CRUD interface for managing "Why Choose Us" benefits.
 * SEO team can add, edit, delete, and reorder benefits from here.
 * Max of 6 active benefits allowed (enforced on backend too).
 */

import { useEffect, useState } from "react";
import {
  getAllBenefitsAdmin,
  createBenefitAdmin,
  updateBenefitAdmin,
  deleteBenefitAdmin,
} from "@/services/benefitService";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  Save,
  X,
  AlertCircle,
  Loader2,
  Sparkles,
  BadgeCheck,
  Shield,
  Users,
  Clock,
  GraduationCap,
  MessageSquare,
  Star,
  HeartHandshake,
  Globe,
  Lock,
  Headphones,
  Award,
} from "lucide-react";
import { toast } from "sonner";

const MAX_WORDS = 300;

const ICON_OPTIONS = [
  { name: "BadgeCheck", icon: BadgeCheck },
  { name: "Shield", icon: Shield },
  { name: "Users", icon: Users },
  { name: "Clock", icon: Clock },
  { name: "GraduationCap", icon: GraduationCap },
  { name: "MessageSquare", icon: MessageSquare },
  { name: "Sparkles", icon: Sparkles },
  { name: "Star", icon: Star },
  { name: "HeartHandshake", icon: HeartHandshake },
  { name: "Globe", icon: Globe },
  { name: "Lock", icon: Lock },
  { name: "Headphones", icon: Headphones },
  { name: "Award", icon: Award },
];

function countWords(text) {
  const trimmed = (text || "").trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function BenefitForm({ benefit, onSave, onCancel, saving, maxActive, activeCount }) {
  const [title, setTitle] = useState(benefit?.title || "");
  const [description, setDescription] = useState(benefit?.description || "");
  const [icon, setIcon] = useState(benefit?.icon || "BadgeCheck");
  const [order, setOrder] = useState(benefit?.order ?? 0);
  const [isActive, setIsActive] = useState(benefit?.isActive ?? true);
  const [error, setError] = useState(null);

  const wordCount = countWords(description);
  const isNew = !benefit;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!description.trim()) {
      setError("Description is required");
      return;
    }
    if (wordCount > MAX_WORDS) {
      setError(`Description cannot exceed ${MAX_WORDS} words (currently ${wordCount})`);
      return;
    }
    if (isActive && isNew && activeCount >= maxActive) {
      setError(`Maximum of ${maxActive} active benefits allowed. Please deactivate another benefit first.`);
      return;
    }

    try {
      await onSave({ title: title.trim(), description: description.trim(), icon, order, isActive });
    } catch (err) {
      setError(err.message || "Failed to save benefit");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Verified Tutors"
          maxLength={120}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe this benefit..."
          rows={5}
          required
        />
        <p className={`text-xs mt-1 ${wordCount > MAX_WORDS ? "text-red-600 font-semibold" : "text-slate-400"}`}>
          {wordCount}/{MAX_WORDS} words
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Icon</label>
        <div className="flex flex-wrap gap-2">
          {ICON_OPTIONS.map((opt) => {
            const IconComp = opt.icon;
            return (
              <button
                type="button"
                key={opt.name}
                onClick={() => setIcon(opt.name)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                  icon === opt.name
                    ? "border-[#4FD1C5] bg-[#4FD1C5]/10 text-[#1A365D]"
                    : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300"
                }`}
                title={opt.name}
              >
                <IconComp size={18} />
                {opt.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Display Order
          </label>
          <Input
            type="number"
            min={0}
            max={999}
            value={order}
            onChange={(e) => setOrder(parseInt(e.target.value, 10) || 0)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
          <div className="flex items-center gap-3 h-10">
            <button
              type="button"
              onClick={() => setIsActive(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-green-100 text-green-700 border border-green-300"
                  : "bg-slate-100 text-slate-500 border border-transparent"
              }`}
            >
              <Eye size={16} />
              Active
            </button>
            <button
              type="button"
              onClick={() => setIsActive(false)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !isActive
                  ? "bg-slate-200 text-slate-600 border border-slate-300"
                  : "bg-slate-100 text-slate-500 border border-transparent"
              }`}
            >
              <EyeOff size={16} />
              Inactive
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          <X size={16} className="mr-1" />
          Cancel
        </Button>
        <Button type="submit" disabled={saving} className="bg-[#4FD1C5] hover:bg-[#38B2AC] text-white">
          {saving ? (
            <><Loader2 size={16} className="animate-spin mr-1" /> Saving...</>
          ) : (
            <><Save size={16} className="mr-1" /> {benefit ? "Update" : "Create"} Benefit</>
          )}
        </Button>
      </div>
    </form>
  );
}

export default function AdminBenefitManager() {
  const [benefits, setBenefits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBenefit, setEditingBenefit] = useState(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [maxActive, setMaxActive] = useState(6);

  const fetchBenefits = async () => {
    try {
      setLoading(true);
      const data = await getAllBenefitsAdmin({ limit: 100 });
      setBenefits(data.benefits || []);
      if (data.maxActive) setMaxActive(data.maxActive);
    } catch (err) {
      toast.error(err.message || "Failed to load benefits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBenefits();
  }, []);

  const activeCount = benefits.filter((b) => b.isActive).length;

  const getIconComponent = (iconName) => {
    const found = ICON_OPTIONS.find((opt) => opt.name === iconName);
    return found ? found.icon : BadgeCheck;
  };

  const handleCreate = async (benefitData) => {
    setSaving(true);
    try {
      await createBenefitAdmin(benefitData);
      toast.success("Benefit created successfully");
      setCreating(false);
      await fetchBenefits();
    } catch (err) {
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (benefitData) => {
    if (!editingBenefit) return;
    setSaving(true);
    try {
      await updateBenefitAdmin(editingBenefit._id, benefitData);
      toast.success("Benefit updated successfully");
      setEditingBenefit(null);
      await fetchBenefits();
    } catch (err) {
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this benefit? This action cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteBenefitAdmin(id);
      toast.success("Benefit deleted successfully");
      await fetchBenefits();
    } catch (err) {
      toast.error(err.message || "Failed to delete benefit");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (benefit) => {
    try {
      await updateBenefitAdmin(benefit._id, { isActive: !benefit.isActive });
      toast.success(`Benefit ${benefit.isActive ? "deactivated" : "activated"} successfully`);
      await fetchBenefits();
    } catch (err) {
      toast.error(err.message || "Failed to update benefit status");
    }
  };

  const handleReorder = async (id, newOrder) => {
    try {
      await updateBenefitAdmin(id, { order: newOrder });
      await fetchBenefits();
    } catch (err) {
      toast.error(err.message || "Failed to reorder benefit");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A365D] flex items-center gap-2">
            <Sparkles className="h-7 w-7" />
            Why Choose Us Manager
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage the "Why Choose Us" section. Maximum of {maxActive} active benefits shown on the website.
          </p>
        </div>
        <Button
          onClick={() => { setCreating(true); setEditingBenefit(null); }}
          disabled={creating}
          className="bg-[#4FD1C5] hover:bg-[#38B2AC] text-white"
        >
          <Plus size={18} className="mr-1" />
          Add Benefit
        </Button>
      </div>

      <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
        <AlertCircle size={16} />
        Active benefits: {activeCount}/{maxActive}
      </div>

      {/* Create Form */}
      {creating && (
        <Card className="border-emerald-200 bg-emerald-50/30 rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#1A365D]">New Benefit</CardTitle>
            <CardDescription>Add a new benefit for the Why Choose Us section.</CardDescription>
          </CardHeader>
          <CardContent>
            <BenefitForm
              onSave={handleCreate}
              onCancel={() => setCreating(false)}
              saving={saving}
              maxActive={maxActive}
              activeCount={activeCount}
            />
          </CardContent>
        </Card>
      )}

      {/* Edit Form */}
      {editingBenefit && (
        <Card className="border-amber-200 bg-amber-50/30 rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#1A365D]">Edit Benefit</CardTitle>
            <CardDescription>Update the benefit details below.</CardDescription>
          </CardHeader>
          <CardContent>
            <BenefitForm
              benefit={editingBenefit}
              onSave={handleUpdate}
              onCancel={() => setEditingBenefit(null)}
              saving={saving}
              maxActive={maxActive}
              activeCount={activeCount}
            />
          </CardContent>
        </Card>
      )}

      {/* Benefit List */}
      <Card className="rounded-2xl border-gray-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#1A365D]">
            All Benefits ({benefits.length})
          </CardTitle>
          <CardDescription>
            Drag to reorder. Toggle visibility to show/hide on the website.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#4FD1C5]" />
            </div>
          ) : benefits.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Sparkles size={48} className="mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No benefits yet</p>
              <p className="text-sm mt-1">Click "Add Benefit" to create your first one.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {benefits.map((benefit, index) => {
                const IconComp = getIconComponent(benefit.icon);
                return (
                  <div
                    key={benefit._id}
                    className={`rounded-xl border p-4 transition-colors ${
                      benefit.isActive
                        ? "border-slate-200 bg-white"
                        : "border-slate-200 bg-slate-50 opacity-70"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2 text-slate-400 pt-0.5">
                        <GripVertical size={18} className="cursor-grab" />
                        <span className="text-xs font-mono w-5 text-right">{index + 1}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex items-start gap-3">
                            <div className="h-10 w-10 rounded-full bg-[#4FD1C5]/10 flex items-center justify-center shrink-0">
                              <IconComp className="h-5 w-5 text-[#4FD1C5]" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-medium text-slate-900 truncate">{benefit.title}</h3>
                              <p className="text-sm text-slate-500 mt-1 line-clamp-2">{benefit.description}</p>
                              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                {countWords(benefit.description)} words · Icon: {benefit.icon}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={benefit.isActive ? "default" : "secondary"}
                            className={`shrink-0 mt-0.5 ${
                              benefit.isActive
                                ? "bg-green-100 text-green-700 hover:bg-green-100"
                                : "bg-slate-200 text-slate-500 hover:bg-slate-200"
                            }`}
                          >
                            {benefit.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(benefit)}
                            className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                            title={benefit.isActive ? "Deactivate" : "Activate"}
                          >
                            {benefit.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                            {benefit.isActive ? "Hide" : "Show"}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingBenefit(benefit);
                              setCreating(false);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <Pencil size={14} />
                            Edit
                          </button>

                          <div className="flex items-center gap-2 ml-auto">
                            {index > 0 && (
                              <button
                                type="button"
                                onClick={() => handleReorder(benefit._id, benefit.order - 1)}
                                className="text-xs text-slate-400 hover:text-slate-600"
                                title="Move up"
                              >
                                ↑
                              </button>
                            )}
                            {index < benefits.length - 1 && (
                              <button
                                type="button"
                                onClick={() => handleReorder(benefit._id, benefit.order + 1)}
                                className="text-xs text-slate-400 hover:text-slate-600"
                                title="Move down"
                              >
                                ↓
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDelete(benefit._id)}
                            disabled={deletingId === benefit._id}
                            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                          >
                            {deletingId === benefit._id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
