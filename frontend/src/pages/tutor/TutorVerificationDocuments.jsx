/**
 * Tutor Verification Documents
 * Qualification certificates and DBS verification.
 * Upload documents; show lists with status. No delete or edit after upload.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Image, ExternalLink, Upload, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  getMyVerificationDocuments,
  uploadVerificationDocument,
} from '@/services/tutorVerificationDocumentService';
import {
  getMyDbsDocuments,
  uploadDbsDocument,
} from '@/services/dbsVerificationDocumentService';

const ACCEPT = 'application/pdf,image/*';
const MAX_FILES_HINT = 'PDF or image (e.g. JPG, PNG). Multiple files allowed.';
const DBS_HINT = 'PDF or image (e.g. JPG, PNG). Max 5 MB. Documents cannot be edited or deleted after upload.';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusBadgeClass(status) {
  if (status === 'APPROVED')
    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
  if (status === 'REJECTED')
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  return 'bg-muted text-muted-foreground';
}

function statusLabel(status) {
  if (status === 'APPROVED') return 'Approved';
  if (status === 'REJECTED') return 'Rejected';
  return 'Pending';
}

function TutorVerificationDocuments() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const dbsFileInputRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dbsDocuments, setDbsDocuments] = useState([]);
  const [dbsLoading, setDbsLoading] = useState(true);
  const [dbsUploading, setDbsUploading] = useState(false);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyVerificationDocuments();
      setDocuments(data.documents ?? []);
    } catch (err) {
      setDocuments([]);
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchDbsDocuments = async () => {
    try {
      setDbsLoading(true);
      const data = await getMyDbsDocuments();
      setDbsDocuments(data.documents ?? []);
    } catch (err) {
      setDbsDocuments([]);
    } finally {
      setDbsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchDbsDocuments();
  }, []);

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    const fileList = Array.from(files);
    const allowed = fileList.filter(
      (f) => f.type === 'application/pdf' || f.type.startsWith('image/')
    );
    if (allowed.length === 0) {
      toast.error('Please upload only PDF or image files.');
      e.target.value = '';
      return;
    }
    if (allowed.length < fileList.length) {
      toast.warning('Some files were skipped. Only PDF and image files are accepted.');
    }
    setUploading(true);
    let success = 0;
    for (const file of allowed) {
      try {
        await uploadVerificationDocument(file);
        success += 1;
        toast.success(`${file.name} uploaded successfully.`);
      } catch (err) {
        toast.error(`${file.name}: ${err.message || 'Upload failed.'}`);
      }
    }
    setUploading(false);
    e.target.value = '';
    if (success > 0) fetchDocuments();
  };

  const handleDbsFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!(file.type === 'application/pdf' || file.type.startsWith('image/'))) {
      toast.error('Please upload only PDF or image files.');
      e.target.value = '';
      return;
    }
    setDbsUploading(true);
    try {
      await uploadDbsDocument(file);
      toast.success(`${file.name} uploaded successfully.`);
      fetchDbsDocuments();
    } catch (err) {
      toast.error(err.message || 'Could not upload file. Please try again.');
    }
    setDbsUploading(false);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="container mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Verification Documents</h1>
          <Button variant="outline" onClick={() => navigate('/tutor')}>
            Back to dashboard
          </Button>
        </div>

        {error && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Create a tutor profile first to upload documents.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate('/tutor/create')}
              >
                Create tutor profile
              </Button>
            </CardContent>
          </Card>
        )}

        {!error && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Qualification certificates</CardTitle>
                <CardDescription>{MAX_FILES_HINT}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-end gap-4">
                  <div className="flex-1 min-w-[200px] space-y-2">
                    <Label htmlFor="cert-files">Select files</Label>
                    <Input
                      id="cert-files"
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPT}
                      multiple
                      disabled={uploading}
                      onChange={handleFileChange}
                      className="cursor-pointer"
                    />
                  </div>
                  <Button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {uploading ? 'Uploading…' : 'Choose files'}
                  </Button>
                </div>
                {uploading && (
                  <p className="text-sm text-muted-foreground">Uploading… Please wait.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Uploaded qualification documents</CardTitle>
                <CardDescription>
                  Documents cannot be edited or deleted after upload.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground">Loading…</p>
                ) : documents.length === 0 ? (
                  <p className="text-muted-foreground">No documents uploaded yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {documents.map((doc) => (
                      <li
                        key={doc.id}
                        className="flex flex-col gap-2 rounded-lg border border-input bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          {doc.fileType === 'PDF' ? (
                            <FileText className="h-8 w-8 shrink-0 text-red-600" />
                          ) : (
                            <Image className="h-8 w-8 shrink-0 text-blue-600" />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium truncate" title={doc.fileName}>
                              {doc.fileName || '—'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {doc.fileType ?? '—'} · {formatDate(doc.uploadedAt)}
                            </p>
                          </div>
                        </div>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex shrink-0 items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  DBS Verification
                </CardTitle>
                <CardDescription>{DBS_HINT}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-end gap-4">
                  <div className="flex-1 min-w-[200px] space-y-2">
                    <Label htmlFor="dbs-file">Upload DBS certificate</Label>
                    <Input
                      id="dbs-file"
                      ref={dbsFileInputRef}
                      type="file"
                      accept={ACCEPT}
                      disabled={dbsUploading}
                      onChange={handleDbsFileChange}
                      className="cursor-pointer"
                    />
                  </div>
                  <Button
                    type="button"
                    disabled={dbsUploading}
                    onClick={() => dbsFileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {dbsUploading ? 'Uploading…' : 'Choose file'}
                  </Button>
                </div>
                {dbsUploading && (
                  <p className="text-sm text-muted-foreground">Uploading… Please wait.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Uploaded DBS documents</CardTitle>
                <CardDescription>
                  Status is set by an administrator. Documents cannot be edited or deleted after upload.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dbsLoading ? (
                  <p className="text-muted-foreground">Loading…</p>
                ) : dbsDocuments.length === 0 ? (
                  <p className="text-muted-foreground">No DBS documents uploaded yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {dbsDocuments.map((doc) => (
                      <li
                        key={doc.id}
                        className="flex flex-col gap-2 rounded-lg border border-input bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          {doc.fileType === 'PDF' ? (
                            <FileText className="h-8 w-8 shrink-0 text-red-600" />
                          ) : (
                            <Image className="h-8 w-8 shrink-0 text-blue-600" />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium truncate" title={doc.fileName}>
                              {doc.fileName || '—'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {doc.fileType ?? '—'} · {formatDate(doc.uploadedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(doc.status)}`}
                          >
                            {statusLabel(doc.status)}
                          </span>
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Open
                          </a>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

export default TutorVerificationDocuments;
