/**
 * Admin Tutor Verification
 * List unverified tutors with certificates. Preview images, download PDFs. Approve / Reject actions.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, UserCheck, UserX, Download, Eye } from 'lucide-react';
import { DocumentPreviewModal } from '@/components/DocumentPreviewModal';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCurrentRole, getStoredUser } from '@/services/authService';
import {
  getTutorVerificationTutors,
  getTutorDocuments,
  approveTutor as apiApproveTutor,
  rejectTutor as apiRejectTutor,
} from '@/services/adminService';
import '../../styles/Profile.css';

function formatDocDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function verificationStatusBadge(tutor) {
  if (tutor.isVerified) {
    return (
      <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
        Approved
      </span>
    );
  }
  if (tutor.verificationRejectedAt) {
    return (
      <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
      Pending
    </span>
  );
}

function TutorDocumentsList({ documents, onPreview }) {
  if (!documents?.length) {
    return <p className="text-sm text-muted-foreground">No documents uploaded.</p>;
  }
  return (
    <ul className="mt-2 space-y-3">
      {documents.map((doc) => (
        <li key={doc.id} className="rounded-md border border-input bg-muted/30 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium truncate" title={doc.fileName}>
              {doc.fileName || '—'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {doc.fileType ?? '—'} · {formatDocDate(doc.uploadedAt)}
              </span>
              {doc.fileUrl && (doc.fileType === 'IMAGE' || doc.fileType === 'PDF') && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => onPreview(doc)}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </Button>
              )}
            </div>
          </div>
          {doc.fileType === 'IMAGE' && doc.fileUrl && (
            <div className="mt-2">
              <img
                src={doc.fileUrl}
                alt={doc.fileName || 'Certificate'}
                className="max-h-40 w-auto max-w-full rounded object-contain"
              />
            </div>
          )}
          {doc.fileType === 'PDF' && doc.fileUrl && (
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1 text-xs"
                onClick={() => onPreview(doc)}
              >
                <Eye className="h-3.5 w-3.5" />
                Preview PDF
              </Button>
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Download className="h-4 w-4" />
                Download
              </a>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function AdminTutorVerification() {
  const navigate = useNavigate();
  const role = getCurrentRole();
  const isAdmin = typeof role === 'string' && role === 'Admin';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tutors, setTutors] = useState([]);
  const [documentsByTutorId, setDocumentsByTutorId] = useState({});
  const [actingId, setActingId] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  const fetchTutors = async () => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getTutorVerificationTutors();
      const list = data.tutors || [];
      setTutors(list);
      return list;
    } catch (err) {
      setError(err.message || 'Failed to load tutors');
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
    let cancelled = false;
    fetchTutors().then((list) => {
      if (cancelled || !list?.length) return;
      Promise.allSettled(list.map((t) => getTutorDocuments(t.id))).then((results) => {
        if (cancelled) return;
        const map = {};
        list.forEach((t, i) => {
          const res = results[i];
          const docs = res.status === 'fulfilled' ? (res.value?.documents ?? []) : [];
          map[t.id] = docs;
        });
        setDocumentsByTutorId(map);
      });
    });
    return () => { cancelled = true; };
  }, [isAdmin]);

  const fetchDocumentsForTutors = async (tutorList) => {
    if (!tutorList?.length) {
      setDocumentsByTutorId({});
      return;
    }
    const results = await Promise.allSettled(
      tutorList.map((t) => getTutorDocuments(t.id))
    );
    const map = {};
    tutorList.forEach((t, i) => {
      const res = results[i];
      const docs = res.status === 'fulfilled' ? (res.value?.documents ?? []) : [];
      map[t.id] = docs;
    });
    setDocumentsByTutorId(map);
  };

  const refetchTutorsSilent = async () => {
    const data = await getTutorVerificationTutors();
    const list = data.tutors || [];
    setTutors(list);
    await fetchDocumentsForTutors(list);
  };

  const handleApprove = async (tutorId) => {
    setActingId(tutorId);
    try {
      await apiApproveTutor(tutorId);
      await refetchTutorsSilent();
    } catch (err) {
      setError(err.message || 'Failed to approve tutor');
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (tutorId) => {
    setActingId(tutorId);
    try {
      await apiRejectTutor(tutorId);
      await refetchTutorsSilent();
    } catch (err) {
      setError(err.message || 'Failed to reject tutor');
    } finally {
      setActingId(null);
    }
  };

  const isPending = (t) => !t.isVerified && !t.verificationRejectedAt;

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

  if (loading && tutors.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Loading tutors…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="profile-page-content">
      <div className="profile-intro">
        <h1 className="text-2xl font-bold text-[#1A365D] flex items-center gap-2">
          <GraduationCap className="h-7 w-7" />
          Tutor Verification
        </h1>
        <p className="text-sm text-slate-500 mt-1">Tutors who submitted verification documents. You can view documents anytime, including after approve/reject.</p>
      </div>

      <Card className="rounded-2xl border-gray-100 shadow-sm mt-6">
        <CardHeader>
          <CardTitle className="text-[#1A365D]">Tutors with verification documents</CardTitle>
          <CardDescription>
            Review documents and approve or reject. Approved and rejected tutors remain in the list so you can view their documents later.
          </CardDescription>
        </CardHeader>
          <CardContent>
            {error && (
              <p className="mb-4 text-sm text-destructive">{error}</p>
            )}
            {tutors.length === 0 ? (
              <div className="text-muted-foreground space-y-1">
                <p className="font-medium">No tutors with verification documents yet.</p>
                <p className="text-sm">Tutors who upload verification documents will appear here. You can view their documents even after approving or rejecting.</p>
              </div>
            ) : (
              <ul className="space-y-6">
                {tutors.map((t) => {
                  const busy = actingId === t.id;
                  const documents = documentsByTutorId[t.id] ?? [];
                  return (
                    <li
                      key={t.id}
                      className="flex flex-col gap-4 rounded-lg border border-input bg-card p-4"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{t.fullName || '—'}</p>
                            {verificationStatusBadge(t)}
                          </div>
                          <p className="text-sm text-muted-foreground">{t.email || '—'}</p>
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                            {t.subjects?.length > 0 && (
                              <span>Subjects: {t.subjects.join(', ')}</span>
                            )}
                            {t.experienceYears != null && (
                              <span>{t.experienceYears} yr exp</span>
                            )}
                            {t.hourlyRate != null && (
                              <span>£{t.hourlyRate}/hr</span>
                            )}
                            {t.mode && <span>{t.mode}</span>}
                            {t.location && (
                              <span>
                                {typeof t.location === 'string'
                                  ? t.location
                                  : t.location?.address ?? '—'}
                              </span>
                            )}
                          </div>
                        </div>
                        {isPending(t) && (
                        <div className="flex shrink-0 gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            disabled={busy || documents.length === 0}
                            onClick={() => handleApprove(t.id)}
                            className="gap-1"
                            title={documents.length === 0 ? 'Upload at least one certificate to approve' : undefined}
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => handleReject(t.id)}
                            className="gap-1 text-red-600 hover:text-red-700"
                          >
                            <UserX className="h-3.5 w-3.5" />
                            Reject
                          </Button>
                        </div>
                        )}
                      </div>
                      <div className="border-t border-input pt-3">
                        <p className="text-sm font-medium text-muted-foreground">Certificates</p>
                        <TutorDocumentsList
                          documents={documents}
                          onPreview={(doc) => setPreviewDoc({ fileUrl: doc.fileUrl, fileType: doc.fileType, fileName: doc.fileName })}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

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

export default AdminTutorVerification;
