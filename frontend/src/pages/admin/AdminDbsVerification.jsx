/**
 * Admin DBS Verification
 * List tutors with DBS submissions; on select show tutor name and DBS documents.
 * Image preview for images, download for PDFs. Approve / Reject per document.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Download, UserCheck, UserX, Eye } from 'lucide-react';
import { DocumentPreviewModal } from '@/components/DocumentPreviewModal';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCurrentRole, getStoredUser } from '@/services/authService';
import {
  getDbsPendingTutors,
  getTutorDbsDocuments,
  approveDbsDocument,
  rejectDbsDocument,
} from '@/services/adminService';
import { toast } from 'sonner';
import '../../styles/Profile.css';

function formatDocDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function statusBadge(status) {
  if (status === 'APPROVED')
    return (
      <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
        Approved
      </span>
    );
  if (status === 'REJECTED')
    return (
      <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
        Rejected
      </span>
    );
  return (
    <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      Pending
    </span>
  );
}

function DbsDocumentCard({ doc, onApprove, onReject, onPreview, actingId }) {
  const busy = actingId === doc.id;
  const canAct = doc.status === 'PENDING';

  return (
    <li className="rounded-lg border border-input bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium truncate" title={doc.fileName}>
              {doc.fileName || '—'}
            </span>
            {statusBadge(doc.status)}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {doc.fileType ?? '—'} · {formatDocDate(doc.uploadedAt)}
          </p>
        </div>
        {canAct && (
          <div className="flex shrink-0 gap-2">
            <Button
              size="sm"
              variant="default"
              disabled={busy}
              onClick={() => onApprove(doc.id)}
              className="gap-1"
            >
              <UserCheck className="h-3.5 w-3.5" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => onReject(doc.id)}
              className="gap-1 text-red-600 hover:text-red-700"
            >
              <UserX className="h-3.5 w-3.5" />
              Reject
            </Button>
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {doc.fileUrl && (doc.fileType === 'IMAGE' || doc.fileType === 'PDF') && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => onPreview(doc)}
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </Button>
        )}
        {doc.fileType === 'IMAGE' && doc.fileUrl && (
          <div className="flex-1">
            <img
              src={doc.fileUrl}
              alt={doc.fileName || 'DBS document'}
              className="max-h-48 w-auto max-w-full rounded border border-input object-contain"
            />
          </div>
        )}
        {doc.fileType === 'PDF' && doc.fileUrl && (
          <a
            href={doc.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </a>
        )}
      </div>
    </li>
  );
}

function AdminDbsVerification() {
  const navigate = useNavigate();
  const role = getCurrentRole();
  const isAdmin = typeof role === 'string' && role === 'Admin';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tutors, setTutors] = useState([]);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [actingDocId, setActingDocId] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  const fetchTutors = async () => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getDbsPendingTutors();
      setTutors(data.tutors || []);
      if (!selectedTutor && (data.tutors || []).length > 0) {
        setSelectedTutor(data.tutors[0]);
      }
      return data.tutors || [];
    } catch (err) {
      setError(err.message || 'Failed to load tutors with DBS submissions');
      setTutors([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    fetchTutors();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin || !selectedTutor?.id) {
      setDocuments([]);
      return;
    }
    let cancelled = false;
    setDocumentsLoading(true);
    getTutorDbsDocuments(selectedTutor.id)
      .then((data) => {
        if (!cancelled) setDocuments(data.documents ?? []);
      })
      .catch(() => {
        if (!cancelled) setDocuments([]);
      })
      .finally(() => {
        if (!cancelled) setDocumentsLoading(false);
      });
    return () => { cancelled = true; };
  }, [isAdmin, selectedTutor?.id]);

  const handleSelectTutor = (tutor) => {
    setSelectedTutor(tutor);
  };

  const handleApprove = async (documentId) => {
    setActingDocId(documentId);
    try {
      await approveDbsDocument(documentId);
      toast.success('DBS document approved. Tutor is now DBS verified.');
      if (selectedTutor?.id) {
        const data = await getTutorDbsDocuments(selectedTutor.id);
        setDocuments(data.documents ?? []);
      }
      await fetchTutors();
    } catch (err) {
      toast.error(err.message || 'Could not approve document.');
    } finally {
      setActingDocId(null);
    }
  };

  const handleReject = async (documentId) => {
    setActingDocId(documentId);
    try {
      await rejectDbsDocument(documentId);
      toast.success('DBS document has been rejected.');
      if (selectedTutor?.id) {
        const data = await getTutorDbsDocuments(selectedTutor.id);
        setDocuments(data.documents ?? []);
      }
      await fetchTutors();
    } catch (err) {
      toast.error(err.message || 'Could not reject document.');
    } finally {
      setActingDocId(null);
    }
  };

  if (!getStoredUser()) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardContent className="p-6">
            <p className="text-center text-destructive font-medium">Access denied. Admin only.</p>
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={() => navigate(-1)} className="rounded-lg">
                Go back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="profile-page-content">
      <div className="profile-intro">
        <h1 className="text-2xl font-bold text-[#1A365D] flex items-center gap-2">
          <ShieldCheck className="h-7 w-7" />
          DBS Verification
        </h1>
        <p className="text-sm text-slate-500 mt-1">Review DBS documents and approve or reject per document.</p>
      </div>

      {error && (
        <Card className="mt-6 rounded-2xl border-red-200 bg-red-50 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-destructive font-medium">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr] mt-6">
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-[#1A365D]">Tutors with DBS submissions</CardTitle>
            <CardDescription>Select a tutor to view and review their DBS documents.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : tutors.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tutors with DBS submissions.</p>
            ) : (
              <ul className="space-y-1">
                {tutors.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectTutor(t)}
                      className={`w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                        selectedTutor?.id === t.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <span className="block truncate">{t.fullName || '—'}</span>
                      <span className="block truncate text-xs opacity-80">{t.email || ''}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#1A365D]">
              {selectedTutor ? selectedTutor.fullName || 'Tutor' : 'Select a tutor'}
            </CardTitle>
            <CardDescription>
              {selectedTutor
                ? 'DBS documents submitted by this tutor. Approve or reject per document.'
                : 'Choose a tutor from the list to view their DBS documents.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedTutor ? (
              <p className="text-sm text-muted-foreground">No tutor selected.</p>
            ) : documentsLoading ? (
              <p className="text-sm text-muted-foreground">Loading documents…</p>
            ) : documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No DBS documents for this tutor.</p>
            ) : (
              <ul className="space-y-4">
                {documents.map((doc) => (
                  <DbsDocumentCard
                    key={doc.id}
                    doc={doc}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onPreview={(d) => setPreviewDoc({ fileUrl: d.fileUrl, fileType: d.fileType, fileName: d.fileName })}
                    actingId={actingDocId}
                  />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <DocumentPreviewModal
        open={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        fileUrl={previewDoc?.fileUrl}
        fileType={previewDoc?.fileType}
        fileName={previewDoc?.fileName}
      />
    </div>
  );
}

export default AdminDbsVerification;
