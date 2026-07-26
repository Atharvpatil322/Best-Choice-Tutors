/**
 * Admin FAQ Manager
 * CRUD interface for managing frequently asked questions.
 * SEO team can add, edit, delete, and reorder FAQs from here.
 */

import { useEffect, useState } from "react";
import {
  getAllFaqsAdmin,
  createFaqAdmin,
  updateFaqAdmin,
  deleteFaqAdmin,
} from "@/services/faqService";
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
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";

function FaqForm({ faq, onSave, onCancel, saving }) {
  const [question, setQuestion] = useState(faq?.question || "");
  const [answer, setAnswer] = useState(faq?.answer || "");
  const [order, setOrder] = useState(faq?.order ?? 0);
  const [isActive, setIsActive] = useState(faq?.isActive ?? true);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!question.trim()) {
      setError("Question is required");
      return;
    }
    if (!answer.trim()) {
      setError("Answer is required");
      return;
    }
    if (answer.trim().length < 10) {
      setError("Answer must be at least 10 characters");
      return;
    }

    try {
      await onSave({ question: question.trim(), answer: answer.trim(), order, isActive });
    } catch (err) {
      setError(err.message || "Failed to save FAQ");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Question</label>
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. How do I book a tutor?"
          maxLength={500}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Answer</label>
        <Textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Provide a clear, helpful answer..."
          rows={4}
          maxLength={2000}
          required
        />
        <p className="text-xs text-slate-400 mt-1">{answer.length}/2000 characters</p>
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
            <><Save size={16} className="mr-1" /> {faq ? "Update" : "Create"} FAQ</>
          )}
        </Button>
      </div>
    </form>
  );
}

export default function AdminFaqManager() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingFaq, setEditingFaq] = useState(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const data = await getAllFaqsAdmin({ limit: 100 });
      setFaqs(data.faqs || []);
    } catch (err) {
      toast.error(err.message || "Failed to load FAQs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const handleCreate = async (faqData) => {
    setSaving(true);
    try {
      await createFaqAdmin(faqData);
      toast.success("FAQ created successfully");
      setCreating(false);
      await fetchFaqs();
    } catch (err) {
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (faqData) => {
    if (!editingFaq) return;
    setSaving(true);
    try {
      await updateFaqAdmin(editingFaq._id, faqData);
      toast.success("FAQ updated successfully");
      setEditingFaq(null);
      await fetchFaqs();
    } catch (err) {
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this FAQ entry? This action cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteFaqAdmin(id);
      toast.success("FAQ deleted successfully");
      await fetchFaqs();
    } catch (err) {
      toast.error(err.message || "Failed to delete FAQ");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (faq) => {
    try {
      await updateFaqAdmin(faq._id, { isActive: !faq.isActive });
      toast.success(`FAQ ${faq.isActive ? "deactivated" : "activated"} successfully`);
      await fetchFaqs();
    } catch (err) {
      toast.error(err.message || "Failed to update FAQ status");
    }
  };

  const handleReorder = async (id, newOrder) => {
    try {
      await updateFaqAdmin(id, { order: newOrder });
      await fetchFaqs();
    } catch (err) {
      toast.error(err.message || "Failed to reorder FAQ");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A365D] flex items-center gap-2">
            <HelpCircle className="h-7 w-7" />
            FAQ Manager
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage frequently asked questions for the public FAQ section. Changes reflect immediately on the website.
          </p>
        </div>
        <Button
          onClick={() => { setCreating(true); setEditingFaq(null); }}
          disabled={creating}
          className="bg-[#4FD1C5] hover:bg-[#38B2AC] text-white"
        >
          <Plus size={18} className="mr-1" />
          Add FAQ
        </Button>
      </div>

      {/* Create Form */}
      {creating && (
        <Card className="border-emerald-200 bg-emerald-50/30 rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#1A365D]">New FAQ Entry</CardTitle>
            <CardDescription>Add a new question and answer for the FAQ section.</CardDescription>
          </CardHeader>
          <CardContent>
            <FaqForm onSave={handleCreate} onCancel={() => setCreating(false)} saving={saving} />
          </CardContent>
        </Card>
      )}

      {/* Edit Form */}
      {editingFaq && (
        <Card className="border-amber-200 bg-amber-50/30 rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#1A365D]">Edit FAQ Entry</CardTitle>
            <CardDescription>Update the question or answer below.</CardDescription>
          </CardHeader>
          <CardContent>
            <FaqForm
              faq={editingFaq}
              onSave={handleUpdate}
              onCancel={() => setEditingFaq(null)}
              saving={saving}
            />
          </CardContent>
        </Card>
      )}

      {/* FAQ List */}
      <Card className="rounded-2xl border-gray-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#1A365D]">
            All FAQs ({faqs.length})
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
          ) : faqs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <HelpCircle size={48} className="mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No FAQs yet</p>
              <p className="text-sm mt-1">Click "Add FAQ" to create your first one.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div
                  key={faq._id}
                  className={`rounded-xl border p-4 transition-colors ${
                    faq.isActive
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
                        <div className="min-w-0">
                          <h3 className="font-medium text-slate-900 truncate">{faq.question}</h3>
                          <p className="text-sm text-slate-500 mt-1 line-clamp-2">{faq.answer}</p>
                        </div>
                        <Badge
                          variant={faq.isActive ? "default" : "secondary"}
                          className={`shrink-0 mt-0.5 ${
                            faq.isActive
                              ? "bg-green-100 text-green-700 hover:bg-green-100"
                              : "bg-slate-200 text-slate-500 hover:bg-slate-200"
                          }`}
                        >
                          {faq.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(faq)}
                          className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                          title={faq.isActive ? "Deactivate" : "Activate"}
                        >
                          {faq.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                          {faq.isActive ? "Hide" : "Show"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingFaq(faq);
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
                              onClick={() => handleReorder(faq._id, faq.order - 1)}
                              className="text-xs text-slate-400 hover:text-slate-600"
                              title="Move up"
                            >
                              ↑
                            </button>
                          )}
                          {index < faqs.length - 1 && (
                            <button
                              type="button"
                              onClick={() => handleReorder(faq._id, faq.order + 1)}
                              className="text-xs text-slate-400 hover:text-slate-600"
                              title="Move down"
                            >
                              ↓
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDelete(faq._id)}
                          disabled={deletingId === faq._id}
                          className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                        >
                          {deletingId === faq._id ? (
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

