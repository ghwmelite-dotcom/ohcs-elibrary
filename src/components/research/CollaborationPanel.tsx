import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Plus,
  Edit3,
  Trash2,
  Pin,
  Clock,
  User,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Star,
  Download,
  Copy,
  Check,
  Loader2,
  BookOpen,
  Quote,
  Send,
  ThumbsUp,
  ThumbsDown,
  Heart,
  PartyPopper,
  Eye,
  X,
  ChevronDown,
  ChevronUp,
  History,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useResearchApi } from '@/hooks/useResearchApi';
import { ErrorAlert } from './ErrorAlert';
import type {
  ResearchNote,
  ResearchCitation,
  ResearchReview,
  ResearchDiscussion,
  ResearchDiscussionReply,
} from '@/types';

// Note Types with colors
const NOTE_TYPES = [
  { value: 'general', label: 'General', color: 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300' },
  { value: 'methodology', label: 'Methodology', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  { value: 'findings', label: 'Findings', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  { value: 'discussion', label: 'Discussion', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  { value: 'conclusion', label: 'Conclusion', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
  { value: 'appendix', label: 'Appendix', color: 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-400' },
];

// Citation Types
const CITATION_TYPES = [
  { value: 'article', label: 'Journal Article' },
  { value: 'book', label: 'Book' },
  { value: 'chapter', label: 'Book Chapter' },
  { value: 'conference', label: 'Conference Paper' },
  { value: 'thesis', label: 'Thesis/Dissertation' },
  { value: 'report', label: 'Report' },
  { value: 'website', label: 'Website' },
  { value: 'other', label: 'Other' },
];

interface CollaborationPanelProps {
  projectId: string;
  activeTab: 'notes' | 'citations' | 'reviews' | 'discussions';
  canEdit: boolean;
}

export function CollaborationPanel({ projectId, activeTab, canEdit }: CollaborationPanelProps) {
  const { authFetch, API_BASE } = useResearchApi();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      <AnimatePresence>
        {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
      </AnimatePresence>

      {activeTab === 'notes' && (
        <NotesTab projectId={projectId} canEdit={canEdit} authFetch={authFetch} onError={setError} />
      )}
      {activeTab === 'citations' && (
        <CitationsTab projectId={projectId} canEdit={canEdit} authFetch={authFetch} apiBase={API_BASE} onError={setError} />
      )}
      {activeTab === 'reviews' && (
        <ReviewsTab projectId={projectId} canEdit={canEdit} authFetch={authFetch} onError={setError} />
      )}
      {activeTab === 'discussions' && (
        <DiscussionsTab projectId={projectId} canEdit={canEdit} authFetch={authFetch} onError={setError} />
      )}
    </div>
  );
}

// ============================================================================
// Notes Tab
// ============================================================================

interface NotesTabProps {
  projectId: string;
  canEdit: boolean;
  authFetch: (path: string, options?: RequestInit) => Promise<Response>;
  onError: (msg: string | null) => void;
}

function NotesTab({ projectId, canEdit, authFetch, onError }: NotesTabProps) {
  const [notes, setNotes] = useState<ResearchNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingNote, setEditingNote] = useState<ResearchNote | null>(null);
  const [expandedNote, setExpandedNote] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noteType, setNoteType] = useState('general');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, [projectId]);

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const res = await authFetch(`/projects/${projectId}/notes`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setIsSaving(true);

    try {
      const url = editingNote
        ? `/projects/${projectId}/notes/${editingNote.id}`
        : `/projects/${projectId}/notes`;

      const res = await authFetch(url, {
        method: editingNote ? 'PUT' : 'POST',
        body: JSON.stringify({ title, content, noteType }),
      });

      if (res.ok) {
        await fetchNotes();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm('Delete this note?')) return;

    try {
      await authFetch(`/projects/${projectId}/notes/${noteId}`, {
        method: 'DELETE',
      });
      await fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handlePin = async (note: ResearchNote) => {
    try {
      await authFetch(`/projects/${projectId}/notes/${note.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isPinned: !note.isPinned }),
      });
      await fetchNotes();
    } catch (error) {
      console.error('Error pinning note:', error);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setNoteType('general');
    setEditingNote(null);
    setShowEditor(false);
  };

  const startEdit = (note: ResearchNote) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setNoteType(note.noteType);
    setShowEditor(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
            Research Notes ({notes.length})
          </h3>
          <p className="text-sm text-surface-500 dark:text-surface-400">Collaborative documents and findings</p>
        </div>
        {canEdit && !showEditor && (
          <button
            onClick={() => setShowEditor(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Note
          </button>
        )}
      </div>

      {/* Editor */}
      <AnimatePresence>
        {showEditor && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5"
          >
            <h4 className="font-medium text-surface-900 dark:text-surface-100 mb-4">
              {editingNote ? 'Edit Note' : 'New Note'}
            </h4>
            <div className="space-y-4">
              <div className="flex gap-4">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Note title..."
                  className="flex-1 px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100"
                />
                <select
                  value={noteType}
                  onChange={(e) => setNoteType(e.target.value)}
                  className="px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100"
                >
                  {NOTE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your note content here... (Markdown supported)"
                rows={8}
                className="w-full px-4 py-3 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 resize-y"
              />
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!title.trim() || isSaving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editingNote ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes List */}
      {notes.length === 0 ? (
        <div className="bg-white dark:bg-surface-800 rounded-xl p-12 text-center border border-surface-200 dark:border-surface-700">
          <FileText className="w-16 h-16 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-surface-900 dark:text-surface-100 mb-2">No notes yet</h4>
          <p className="text-surface-500 dark:text-surface-400 mb-4">Create collaborative notes to document your research process.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => {
            const typeInfo = NOTE_TYPES.find((t) => t.value === note.noteType) || NOTE_TYPES[0];
            const isExpanded = expandedNote === note.id;

            return (
              <div
                key={note.id}
                className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {note.isPinned && <Pin className="w-3.5 h-3.5 text-primary-500" />}
                        <span className={cn('px-2 py-0.5 text-xs rounded-full', typeInfo.color)}>
                          {typeInfo.label}
                        </span>
                        <span className="text-xs text-surface-400 dark:text-surface-500">v{note.version}</span>
                      </div>
                      <h4 className="font-medium text-surface-900 dark:text-surface-100">{note.title}</h4>
                      <div className="flex items-center gap-3 mt-1 text-xs text-surface-500 dark:text-surface-400">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {note.createdBy?.displayName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(note.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setExpandedNote(isExpanded ? null : note.id)}
                        className="p-1.5 text-surface-400 hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300 rounded transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {canEdit && (
                        <>
                          <button
                            onClick={() => handlePin(note)}
                            className={cn(
                              'p-1.5 rounded transition-colors',
                              note.isPinned ? 'text-primary-500' : 'text-surface-400 hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300'
                            )}
                          >
                            <Pin className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => startEdit(note)}
                            className="p-1.5 text-surface-400 hover:text-primary-500 dark:text-surface-500 rounded transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(note.id)}
                            className="p-1.5 text-surface-400 hover:text-red-500 dark:text-surface-500 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-2 border-t border-surface-100 dark:border-surface-700">
                        <pre className="whitespace-pre-wrap text-sm text-surface-700 dark:text-surface-300 font-sans">
                          {note.content || 'No content yet.'}
                        </pre>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Citations Tab
// ============================================================================

interface CitationsTabProps {
  projectId: string;
  canEdit: boolean;
  authFetch: (path: string, options?: RequestInit) => Promise<Response>;
  apiBase: string;
  onError: (msg: string | null) => void;
}

function CitationsTab({ projectId, canEdit, authFetch, apiBase, onError }: CitationsTabProps) {
  const [citations, setCitations] = useState<ResearchCitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<'apa' | 'mla' | 'chicago' | 'harvard'>('apa');

  // Form state
  const [formData, setFormData] = useState({
    citationKey: '',
    citationType: 'article',
    title: '',
    authors: '',
    year: '',
    journal: '',
    volume: '',
    pages: '',
    doi: '',
    url: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCitations();
  }, [projectId]);

  const fetchCitations = async () => {
    setIsLoading(true);
    try {
      const res = await authFetch(`/projects/${projectId}/citations`);
      if (res.ok) {
        const data = await res.json();
        setCitations(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching citations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.citationKey.trim()) return;
    setIsSaving(true);

    try {
      const res = await authFetch(`/projects/${projectId}/citations`, {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          year: formData.year ? parseInt(formData.year) : null,
        }),
      });

      if (res.ok) {
        await fetchCitations();
        setFormData({
          citationKey: '',
          citationType: 'article',
          title: '',
          authors: '',
          year: '',
          journal: '',
          volume: '',
          pages: '',
          doi: '',
          url: '',
        });
        setShowForm(false);
      }
    } catch (error) {
      console.error('Error saving citation:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (citationId: string) => {
    if (!confirm('Delete this citation?')) return;

    try {
      await authFetch(`/projects/${projectId}/citations/${citationId}`, {
        method: 'DELETE',
      });
      await fetchCitations();
    } catch (error) {
      console.error('Error deleting citation:', error);
    }
  };

  const handleCopy = async (citation: ResearchCitation) => {
    const formatted = citation.formatted[selectedFormat] || citation.title;
    await navigator.clipboard.writeText(formatted);
    setCopiedId(citation.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExport = async (format: string) => {
    window.open(`${apiBase}/api/v1/research/projects/${projectId}/citations/export?format=${format}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
            Citations ({citations.length})
          </h3>
          <p className="text-sm text-surface-500 dark:text-surface-400">Bibliography and reference management</p>
        </div>
        <div className="flex items-center gap-2">
          {citations.length > 0 && (
            <div className="relative group">
              <button className="inline-flex items-center gap-2 px-3 py-2 border border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors">
                <Download className="w-4 h-4" />
                Export
              </button>
              <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-surface-800 rounded-lg shadow-lg border border-surface-200 dark:border-surface-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                {['bibtex', 'apa', 'mla', 'chicago', 'harvard'].map((format) => (
                  <button
                    key={format}
                    onClick={() => handleExport(format)}
                    className="w-full px-4 py-2 text-left text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 first:rounded-t-lg last:rounded-b-lg"
                  >
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}
          {canEdit && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Citation
            </button>
          )}
        </div>
      </div>

      {/* Format Selector */}
      {citations.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-surface-500 dark:text-surface-400">Format:</span>
          {(['apa', 'mla', 'chicago', 'harvard'] as const).map((format) => (
            <button
              key={format}
              onClick={() => setSelectedFormat(format)}
              className={cn(
                'px-3 py-1 text-xs rounded-full transition-colors',
                selectedFormat === format
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                  : 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-600'
              )}
            >
              {format.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* Add Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5"
          >
            <h4 className="font-medium text-surface-900 dark:text-surface-100 mb-4">Add Citation</h4>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                value={formData.citationKey}
                onChange={(e) => setFormData({ ...formData, citationKey: e.target.value })}
                placeholder="Citation key (e.g., Smith2023)"
                className="px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100"
              />
              <select
                value={formData.citationType}
                onChange={(e) => setFormData({ ...formData, citationType: e.target.value })}
                className="px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100"
              >
                {CITATION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Title *"
                className="col-span-2 px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100"
              />
              <input
                type="text"
                value={formData.authors}
                onChange={(e) => setFormData({ ...formData, authors: e.target.value })}
                placeholder="Authors"
                className="px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100"
              />
              <input
                type="text"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                placeholder="Year"
                className="px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100"
              />
              <input
                type="text"
                value={formData.journal}
                onChange={(e) => setFormData({ ...formData, journal: e.target.value })}
                placeholder="Journal/Publisher"
                className="px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.volume}
                  onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                  placeholder="Volume"
                  className="flex-1 px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100"
                />
                <input
                  type="text"
                  value={formData.pages}
                  onChange={(e) => setFormData({ ...formData, pages: e.target.value })}
                  placeholder="Pages"
                  className="flex-1 px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100"
                />
              </div>
              <input
                type="text"
                value={formData.doi}
                onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
                placeholder="DOI"
                className="px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100"
              />
              <input
                type="text"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="URL"
                className="px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100"
              />
            </div>
            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.title.trim() || !formData.citationKey.trim() || isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Citation
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Citations List */}
      {citations.length === 0 ? (
        <div className="bg-white dark:bg-surface-800 rounded-xl p-12 text-center border border-surface-200 dark:border-surface-700">
          <BookOpen className="w-16 h-16 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-surface-900 dark:text-surface-100 mb-2">No citations yet</h4>
          <p className="text-surface-500 dark:text-surface-400 mb-4">Add citations to build your bibliography.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {citations.map((citation) => (
            <div
              key={citation.id}
              className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-surface-100 dark:bg-surface-700 rounded-lg">
                  <Quote className="w-4 h-4 text-surface-500 dark:text-surface-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs bg-surface-100 dark:bg-surface-700 px-2 py-0.5 rounded text-surface-700 dark:text-surface-300">
                      {citation.citationKey}
                    </span>
                    <span className="text-xs text-surface-400 dark:text-surface-500 capitalize">{citation.citationType}</span>
                  </div>
                  <p className="text-sm text-surface-700 dark:text-surface-300">
                    {citation.formatted[selectedFormat] || citation.title}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCopy(citation)}
                    className="p-1.5 text-surface-400 hover:text-primary-500 dark:text-surface-500 rounded transition-colors"
                    title="Copy citation"
                  >
                    {copiedId === citation.id ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  {canEdit && (
                    <button
                      onClick={() => handleDelete(citation.id)}
                      className="p-1.5 text-surface-400 hover:text-red-500 dark:text-surface-500 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Reviews Tab
// ============================================================================

interface ReviewsTabProps {
  projectId: string;
  canEdit: boolean;
  authFetch: (path: string, options?: RequestInit) => Promise<Response>;
  onError: (msg: string | null) => void;
}

function ReviewsTab({ projectId, canEdit, authFetch, onError }: ReviewsTabProps) {
  const [reviews, setReviews] = useState<ResearchReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedReview, setExpandedReview] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [projectId]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const res = await authFetch(`/projects/${projectId}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'changes_requested':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
            Peer Reviews ({reviews.length})
          </h3>
          <p className="text-sm text-surface-500 dark:text-surface-400">Review feedback and approvals</p>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white dark:bg-surface-800 rounded-xl p-12 text-center border border-surface-200 dark:border-surface-700">
          <CheckCircle2 className="w-16 h-16 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-surface-900 dark:text-surface-100 mb-2">No reviews yet</h4>
          <p className="text-surface-500 dark:text-surface-400">Request peer reviews to get feedback on your research.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                        {review.reviewer?.displayName?.charAt(0) || 'R'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-surface-900 dark:text-surface-100">
                        {review.reviewer?.displayName || 'Anonymous Reviewer'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-surface-500 dark:text-surface-400">
                        <span className="capitalize">{review.reviewType} review</span>
                        <span>•</span>
                        <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('px-2.5 py-1 text-xs rounded-full capitalize', getStatusColor(review.status))}>
                      {review.status.replace('_', ' ')}
                    </span>
                    {review.overallRating && (
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              'w-4 h-4',
                              star <= review.overallRating! ? 'text-yellow-400 fill-yellow-400' : 'text-surface-300 dark:text-surface-600'
                            )}
                          />
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => setExpandedReview(expandedReview === review.id ? null : review.id)}
                      className="p-1 text-surface-400 hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300 rounded"
                    >
                      {expandedReview === review.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {expandedReview === review.id && review.summary && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-2 border-t border-surface-100 dark:border-surface-700 space-y-3">
                      {review.summary && (
                        <div>
                          <h5 className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase mb-1">Summary</h5>
                          <p className="text-sm text-surface-700 dark:text-surface-300">{review.summary}</p>
                        </div>
                      )}
                      {review.strengths && (
                        <div>
                          <h5 className="text-xs font-medium text-green-600 dark:text-green-400 uppercase mb-1">Strengths</h5>
                          <p className="text-sm text-surface-700 dark:text-surface-300">{review.strengths}</p>
                        </div>
                      )}
                      {review.weaknesses && (
                        <div>
                          <h5 className="text-xs font-medium text-red-600 dark:text-red-400 uppercase mb-1">Weaknesses</h5>
                          <p className="text-sm text-surface-700 dark:text-surface-300">{review.weaknesses}</p>
                        </div>
                      )}
                      {review.recommendations && (
                        <div>
                          <h5 className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase mb-1">Recommendations</h5>
                          <p className="text-sm text-surface-700 dark:text-surface-300">{review.recommendations}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Discussions Tab
// ============================================================================

interface DiscussionsTabProps {
  projectId: string;
  canEdit: boolean;
  authFetch: (path: string, options?: RequestInit) => Promise<Response>;
  onError: (msg: string | null) => void;
}

function DiscussionsTab({ projectId, canEdit, authFetch, onError }: DiscussionsTabProps) {
  const [discussions, setDiscussions] = useState<ResearchDiscussion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState<string | null>(null);
  const [replies, setReplies] = useState<ResearchDiscussionReply[]>([]);
  const [newReply, setNewReply] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchDiscussions();
  }, [projectId]);

  useEffect(() => {
    if (selectedDiscussion) {
      fetchReplies(selectedDiscussion);
    }
  }, [selectedDiscussion]);

  const fetchDiscussions = async () => {
    setIsLoading(true);
    try {
      const res = await authFetch(`/projects/${projectId}/discussions`);
      if (res.ok) {
        const data = await res.json();
        setDiscussions(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching discussions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReplies = async (discussionId: string) => {
    try {
      const res = await authFetch(`/discussions/${discussionId}/replies`);
      if (res.ok) {
        const data = await res.json();
        setReplies(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching replies:', error);
    }
  };

  const handleCreateDiscussion = async () => {
    if (!title.trim()) return;
    setIsSaving(true);

    try {
      const res = await authFetch(`/projects/${projectId}/discussions`, {
        method: 'POST',
        body: JSON.stringify({ title, initialMessage }),
      });

      if (res.ok) {
        await fetchDiscussions();
        setTitle('');
        setInitialMessage('');
        setShowForm(false);
      }
    } catch (error) {
      console.error('Error creating discussion:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendReply = async () => {
    if (!newReply.trim() || !selectedDiscussion) return;
    setIsSending(true);

    try {
      const res = await authFetch(`/discussions/${selectedDiscussion}/replies`, {
        method: 'POST',
        body: JSON.stringify({ content: newReply }),
      });

      if (res.ok) {
        await fetchReplies(selectedDiscussion);
        await fetchDiscussions();
        setNewReply('');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  // Show discussion thread if selected
  if (selectedDiscussion) {
    const discussion = discussions.find((d) => d.id === selectedDiscussion);

    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedDiscussion(null)}
          className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
        >
          ← Back to discussions
        </button>

        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
          <h3 className="font-medium text-surface-900 dark:text-surface-100">{discussion?.title}</h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-surface-500 dark:text-surface-400">
            <span>Started by {discussion?.createdBy?.displayName}</span>
            <span>•</span>
            <span>{replies.length} replies</span>
          </div>
        </div>

        {/* Replies */}
        <div className="space-y-3">
          {replies.map((reply) => (
            <div
              key={reply.id}
              className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center">
                  <span className="text-xs font-medium text-surface-600 dark:text-surface-400">
                    {reply.createdBy?.displayName?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-surface-900 dark:text-surface-100">
                      {reply.createdBy?.displayName}
                    </span>
                    <span className="text-xs text-surface-400 dark:text-surface-500">
                      {new Date(reply.createdAt).toLocaleString()}
                    </span>
                    {reply.isSolution && (
                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                        Solution
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-surface-700 dark:text-surface-300">{reply.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Reply input */}
        {canEdit && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              placeholder="Write a reply..."
              className="flex-1 px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100"
              onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
            />
            <button
              onClick={handleSendReply}
              disabled={!newReply.trim() || isSending}
              className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
            Discussions ({discussions.length})
          </h3>
          <p className="text-sm text-surface-500 dark:text-surface-400">Team conversations and questions</p>
        </div>
        {canEdit && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Start Discussion
          </button>
        )}
      </div>

      {/* New Discussion Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5"
          >
            <h4 className="font-medium text-surface-900 dark:text-surface-100 mb-4">Start Discussion</h4>
            <div className="space-y-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Discussion topic..."
                className="w-full px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100"
              />
              <textarea
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                placeholder="Initial message (optional)..."
                rows={3}
                className="w-full px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 resize-none"
              />
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateDiscussion}
                  disabled={!title.trim() || isSaving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                  Start
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Discussions List */}
      {discussions.length === 0 ? (
        <div className="bg-white dark:bg-surface-800 rounded-xl p-12 text-center border border-surface-200 dark:border-surface-700">
          <MessageSquare className="w-16 h-16 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-surface-900 dark:text-surface-100 mb-2">No discussions yet</h4>
          <p className="text-surface-500 dark:text-surface-400">Start a discussion to collaborate with your team.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {discussions.map((discussion) => (
            <button
              key={discussion.id}
              onClick={() => setSelectedDiscussion(discussion.id)}
              className="w-full text-left bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4 hover:border-primary-300 dark:hover:border-primary-600 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {discussion.isPinned && <Pin className="w-3.5 h-3.5 text-primary-500" />}
                    <h4 className="font-medium text-surface-900 dark:text-surface-100">{discussion.title}</h4>
                    <span
                      className={cn(
                        'px-2 py-0.5 text-xs rounded-full',
                        discussion.status === 'open'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : discussion.status === 'resolved'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          : 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-400'
                      )}
                    >
                      {discussion.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-surface-500 dark:text-surface-400">
                    <span>{discussion.createdBy?.displayName}</span>
                    <span>•</span>
                    <span>{discussion.replyCount} replies</span>
                    {discussion.lastReplyAt && (
                      <>
                        <span>•</span>
                        <span>Last reply {new Date(discussion.lastReplyAt).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-surface-400 dark:text-surface-500" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default CollaborationPanel;
