import { useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Upload, PencilLine, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadService } from '../../services/uploadService';
import { useUiStore } from '../../store/uiStore';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { DropZone } from './DropZone';
import { FilePreview } from './FilePreview';
import { ModalShell } from '../shared/ModalShell';
import { DropdownField } from '../shared/DropdownField';
import { KanbanActionsMenu } from '../kanban/KanbanActionsMenu';

export function DocumentList({ projectId, employeeId, category = 'all' }) {
  const queryClient = useQueryClient();
  const openConfirm = useUiStore((state) => state.openConfirm);
  const [uploading, setUploading] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);

  const queryKey = ['documents', projectId || employeeId];
  const documentsQuery = useQuery({
    queryKey,
    enabled: Boolean(projectId || employeeId),
    queryFn: async () => {
      if (projectId) return uploadService.getProjectDocuments(projectId);
      if (employeeId) return uploadService.getEmployeeDocuments(employeeId);
      return [];
    },
  });

  const documents = useMemo(() => {
    const rows = documentsQuery.data || [];
    if (category === 'all') return rows;
    return rows.filter((doc) => String(doc.category || 'other').toLowerCase() === String(category).toLowerCase());
  }, [documentsQuery.data, category]);

  async function handleUpload(files) {
    const file = files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      await uploadService.uploadDocument({
        file,
        projectId,
        employeeId,
        category: category === 'all' ? 'other' : category,
      });
      toast.success('File uploaded');
      queryClient.invalidateQueries({ queryKey });
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveDocument(values) {
    if (!editingDocument) return;
    try {
      await uploadService.updateDocument(editingDocument.publicId, values);
      toast.success('Document updated');
      setEditingDocument(null);
      queryClient.invalidateQueries({ queryKey });
    } catch {
      toast.error('Update failed');
    }
  }

  return (
    <div className="space-y-4">
      <DropZone onDrop={handleUpload} className="flex min-h-32 items-center justify-center">
        <div className="space-y-1">
          <Upload className="mx-auto h-8 w-8 text-sky-400" />
          <div className="text-sm font-semibold text-[rgb(var(--text))]">{uploading ? 'Uploading...' : 'Drop files or click to upload'}</div>
          <div className="text-xs text-slate-500">Images, PDFs, Word and Excel files up to 10MB</div>
        </div>
      </DropZone>

      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-[rgb(var(--text))]">Documents</div>
        <Badge tone="slate">{documents.length} items</Badge>
      </div>

      <div className="scrollbar-none max-h-[calc(100vh-34rem)] space-y-4 overflow-y-auto pr-1">
        {documents.map((document) => (
          <div key={document.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-sky-400" />
                  <div className="truncate font-semibold text-[rgb(var(--text))]">{document.originalName}</div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone="blue">{String(document.category || 'other')}</Badge>
                  <Badge tone="slate">{String(document.fileType || 'other')}</Badge>
                </div>
              </div>
              <KanbanActionsMenu
                align="right"
                triggerClassName="h-8 w-8 rounded-xl"
                items={[
                  { key: 'edit', label: 'Edit details', icon: PencilLine, onClick: () => setEditingDocument(document) },
                  {
                    key: 'delete',
                    label: 'Delete document',
                    icon: Trash2,
                    tone: 'danger',
                    onClick: () =>
                      openConfirm({
                        title: 'Delete document',
                        message: `Delete ${document.originalName}?`,
                        confirmLabel: 'Delete',
                        tone: 'rose',
                        onConfirm: async () => {
                          await uploadService.deleteDocument(document.publicId);
                          toast.success('Document deleted');
                          queryClient.invalidateQueries({ queryKey });
                        },
                      }),
                  },
                ]}
              />
            </div>
            <div className="mt-4">
              <FilePreview file={document} />
            </div>
          </div>
        ))}

        {!documents.length ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-10 text-center text-sm text-slate-400">
            No documents found.
          </div>
        ) : null}
      </div>

      {editingDocument ? (
        <ModalShell
          title="Edit Document"
          description="Update document name and category."
          onClose={() => setEditingDocument(null)}
          widthClassName="max-w-xl"
        >
          <DocumentEditForm
            document={editingDocument}
            onCancel={() => setEditingDocument(null)}
            onSubmit={handleSaveDocument}
          />
        </ModalShell>
      ) : null}
    </div>
  );
}

function DocumentEditForm({ document, onSubmit, onCancel }) {
  const [originalName, setOriginalName] = useState(document.originalName || '');
  const [category, setCategory] = useState(document.category || 'other');
  const [replacementFile, setReplacementFile] = useState(null);
  const fileInputRef = useRef(null);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="sm:col-span-2 block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Document Name</span>
        <input className="input" value={originalName} onChange={(event) => setOriginalName(event.target.value)} />
      </label>
      <DropdownField
        label="Category"
        value={category}
        onChange={setCategory}
        placeholder="Select category"
        selectedLabel={category}
        options={[
          { value: 'drawing', label: 'Drawing' },
          { value: 'report', label: 'Report' },
          { value: 'approval', label: 'Approval' },
          { value: 'resume', label: 'Resume' },
          { value: 'id', label: 'ID' },
          { value: 'certificate', label: 'Certificate' },
          { value: 'other', label: 'Other' },
        ]}
      />
      <div className="sm:col-span-2 rounded-2xl border border-[rgb(var(--line)/0.14)] bg-white/60 p-4">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Replace File</div>
        <div className="mt-2 text-sm text-slate-500">
          Upload a new image or file to replace the current document. Leave empty to keep the existing file.
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => fileInputRef.current?.click?.()}
          >
            <Upload className="h-4 w-4" />
            Choose File
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(event) => setReplacementFile(event.target.files?.[0] || null)}
          />
          <div className="text-sm text-slate-600">
            {replacementFile ? replacementFile.name : 'No replacement selected'}
          </div>
        </div>
        {replacementFile ? (
          <button
            type="button"
            className="mt-3 text-xs font-semibold text-rose-500"
            onClick={() => {
              setReplacementFile(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
          >
            Clear selected file
          </button>
        ) : null}
      </div>
      <div className="sm:col-span-2 flex justify-end gap-3 border-t border-[rgb(var(--line)/0.16)] pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button
          type="button"
          onClick={() => onSubmit({ originalName, category, file: replacementFile })}
        >
          Save Document
        </Button>
      </div>
    </div>
  );
}
