/**
 * Admin Popular Search Manager
 * CRUD interface for managing popular search keywords shown in the footer.
 * SEO team can add, edit, delete, and reorder popular searches from here.
 */

import { useEffect, useRef, useState } from "react";
import {
  getAllPopularSearchesAdmin,
  createPopularSearchAdmin,
  updatePopularSearchAdmin,
  deletePopularSearchAdmin,
} from "@/services/popularSearchService";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Search,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Controlled form for creating or editing a single popular-search entry.
 * Field state is seeded from `searchItem` on mount only, so callers must pass a
 * `key` tied to the record id to force a remount when the selection changes.
 *
 * @param {Object|null} searchItem - Existing entry to edit, or null when creating a new one.
 * @param {(values: Object) => Promise<void>} onSave - Persists the submitted values; may throw to surface an error.
 * @param {() => void} onCancel - Dismisses the form without saving.
 * @param {boolean} saving - True while a save is in flight; disables the action buttons.
 */
function SearchForm({ searchItem, onSave, onCancel, saving }) {
  const [label, setLabel] = useState(searchItem?.label || "");
  const [query, setQuery] = useState(searchItem?.query || "");
  const [order, setOrder] = useState(searchItem?.order ?? 0);
  const [isActive, setIsActive] = useState(searchItem?.isActive ?? true);
  const [error, setError] = useState(null);

  /**
   * Validate the form and hand the trimmed values to the parent save handler.
   * Validation failures and save errors are shown inline rather than thrown.
   *
   * @param {React.FormEvent} event - Submit event from the form element.
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!label.trim()) {
      setError("Label is required");
      return;
    }
    if (!query.trim()) {
      setError("Query is required");
      return;
    }

    try {
      await onSave({ label: label.trim(), query: query.trim(), order, isActive });
    } catch (err) {
      setError(err.message || "Failed to save popular search");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Label</label>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Maths Tutor"
          maxLength={120}
          required
        />
        <p className="text-xs text-slate-400 mt-1">The text shown to users.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Query</label>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Mathematics"
          maxLength={120}
          required
        />
        <p className="text-xs text-slate-400 mt-1">
          The subject keyword used for filtering (links to /?subject=QUERY).
        </p>
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
            <><Save size={16} className="mr-1" /> {searchItem ? "Update" : "Create"} Search</>
          )}
        </Button>
      </div>
    </form>
  );
}

/**
 * Admin screen for managing the popular-search shortcuts shown on the landing page.
 * Supports creating, editing, reordering, activating and deleting entries,
 * reloading from the server after each successful change.
 */
export default function AdminPopularSearchManager() {
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSearch, setEditingSearch] = useState(null);
  const editFormRef = useRef(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  /** Load every popular-search entry (active and inactive) for the list view. */
  const fetchSearches = async () => {
    try {
      setLoading(true);
      const data = await getAllPopularSearchesAdmin({ limit: 100 });
      setSearches(data.popularSearches || []);
    } catch (err) {
      toast.error(err.message || "Failed to load popular searches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSearches();
  }, []);

  /**
   * Bring the edit form into view whenever a different popular search is selected.
   * The form renders above the list, so without this it can open off-screen
   * when the user is scrolled further down the page.
   */
  useEffect(() => {
    if (!editingSearch) return;
    editFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [editingSearch]);

  /**
   * Persist a new popular-search entry, then close the form and refresh the list.
   * Re-throws so the form can render the failure message inline.
   *
   * @param {Object} searchValues - Label, query, order and active flag.
   */
  const handleCreate = async (searchValues) => {
    setSaving(true);
    try {
      await createPopularSearchAdmin(searchValues);
      toast.success("Popular search created successfully");
      setCreating(false);
      await fetchSearches();
    } catch (err) {
      throw err;
    } finally {
      setSaving(false);
    }
  };

  /**
   * Persist edits to the selected popular-search entry, then refresh the list.
   * Re-throws so the form can render the failure message inline.
   *
   * @param {Object} searchValues - Label, query, order and active flag.
   */
  const handleUpdate = async (searchValues) => {
    if (!editingSearch) return;
    setSaving(true);
    try {
      await updatePopularSearchAdmin(editingSearch._id, searchValues);
      toast.success("Popular search updated successfully");
      setEditingSearch(null);
      await fetchSearches();
    } catch (err) {
      throw err;
    } finally {
      setSaving(false);
    }
  };

  /**
   * Remove a popular-search entry after user confirmation, then refresh the list.
   *
   * @param {string} searchId - Identifier of the entry to delete.
   */
  const handleDelete = async (searchId) => {
    if (!window.confirm("Delete this popular search? This action cannot be undone.")) return;
    setDeletingId(searchId);
    try {
      await deletePopularSearchAdmin(searchId);
      toast.success("Popular search deleted successfully");
      await fetchSearches();
    } catch (err) {
      toast.error(err.message || "Failed to delete popular search");
    } finally {
      setDeletingId(null);
    }
  };

  /**
   * Flip an entry between active and inactive so it shows or hides on the website.
   *
   * @param {Object} searchItem - The entry whose visibility is being toggled.
   */
  const handleToggleActive = async (searchItem) => {
    try {
      await updatePopularSearchAdmin(searchItem._id, { isActive: !searchItem.isActive });
      toast.success(`Popular search ${searchItem.isActive ? "deactivated" : "activated"} successfully`);
      await fetchSearches();
    } catch (err) {
      toast.error(err.message || "Failed to update popular search status");
    }
  };

  /**
   * Change an entry's display position and refresh so the new order is reflected.
   *
   * @param {string} searchId - Identifier of the entry being moved.
   * @param {number} nextOrder - Zero-based position to move the entry to.
   */
  const handleReorder = async (searchId, nextOrder) => {
    try {
      await updatePopularSearchAdmin(searchId, { order: nextOrder });
      await fetchSearches();
    } catch (err) {
      toast.error(err.message || "Failed to reorder popular search");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A365D] flex items-center gap-2">
            <Search className="h-7 w-7" />
            Popular Searches Manager
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage popular search keywords shown in the footer. Changes reflect immediately on the website.
          </p>
        </div>
        <Button
          onClick={() => { setCreating(true); setEditingSearch(null); }}
          disabled={creating}
          className="bg-[#4FD1C5] hover:bg-[#38B2AC] text-white"
        >
          <Plus size={18} className="mr-1" />
          Add Search
        </Button>
      </div>

      {/* Create Form */}
      {creating && (
        <Card className="border-emerald-200 bg-emerald-50/30 rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#1A365D]">New Popular Search</CardTitle>
            <CardDescription>Add a new popular search keyword for the footer section.</CardDescription>
          </CardHeader>
          <CardContent>
            <SearchForm onSave={handleCreate} onCancel={() => setCreating(false)} saving={saving} />
          </CardContent>
        </Card>
      )}

      {/* Edit Form */}
      {editingSearch && (
        <Card ref={editFormRef} className="border-amber-200 bg-amber-50/30 rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#1A365D]">Edit Popular Search</CardTitle>
            <CardDescription>Update the popular search details below.</CardDescription>
          </CardHeader>
          <CardContent>
            <SearchForm
              key={editingSearch._id}
              searchItem={editingSearch}
              onSave={handleUpdate}
              onCancel={() => setEditingSearch(null)}
              saving={saving}
            />
          </CardContent>
        </Card>
      )}

      {/* Search List */}
      <Card className="rounded-2xl border-gray-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#1A365D]">
            All Popular Searches ({searches.length})
          </CardTitle>
          <CardDescription>
            Drag to reorder. Toggle visibility to show/hide in the footer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#4FD1C5]" />
            </div>
          ) : searches.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Search size={48} className="mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No popular searches yet</p>
              <p className="text-sm mt-1">Click "Add Search" to create your first one.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {searches.map((searchItem, index) => (
                <div
                  key={searchItem._id}
                  className={`rounded-xl border p-4 transition-colors ${
                    searchItem.isActive
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
                          <h3 className="font-medium text-slate-900 truncate">{searchItem.label}</h3>
                          <p className="text-sm text-slate-500 mt-1">
                            Query: <span className="font-mono text-xs">{searchItem.query}</span>
                          </p>
                        </div>
                        <Badge
                          variant={searchItem.isActive ? "default" : "secondary"}
                          className={`shrink-0 mt-0.5 ${
                            searchItem.isActive
                              ? "bg-green-100 text-green-700 hover:bg-green-100"
                              : "bg-slate-200 text-slate-500 hover:bg-slate-200"
                          }`}
                        >
                          {searchItem.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(searchItem)}
                          className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                          title={searchItem.isActive ? "Deactivate" : "Activate"}
                        >
                          {searchItem.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                          {searchItem.isActive ? "Hide" : "Show"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingSearch(searchItem);
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
                              onClick={() => handleReorder(searchItem._id, searchItem.order - 1)}
                              className="text-xs text-slate-400 hover:text-slate-600"
                              title="Move up"
                            >
                              ↑
                            </button>
                          )}
                          {index < searches.length - 1 && (
                            <button
                              type="button"
                              onClick={() => handleReorder(searchItem._id, searchItem.order + 1)}
                              className="text-xs text-slate-400 hover:text-slate-600"
                              title="Move down"
                            >
                              ↓
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDelete(searchItem._id)}
                          disabled={deletingId === searchItem._id}
                          className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                        >
                          {deletingId === searchItem._id ? (
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
