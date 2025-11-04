/**
 * Enhanced Documents Panel Component
 */

import React, { useState, useEffect } from 'react';
import { FileText, Folder, Upload, Trash2, CheckCircle, AlertCircle, Loader, Search, Plus, X } from 'lucide-react';
import { apiCall, API_CONFIG } from '../../config/api';
import { FileUpload } from '../shared/FileUpload';
import { formatFileSize } from '../../utils/fileUtils';
import { formatDate } from '../../utils/dateUtils';
import { useUI } from '../../contexts/UIContext';

interface Document {
  filename: string;
  filepath: string;
  size: number;
  vectors?: number;
  status: string;
  upload_time: string;
  ingestion_time?: string;
  folderId?: string;
  version?: number;
}

const DocumentsPanel: React.FC = () => {
  const { showToast } = useUI();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await apiCall(API_CONFIG.ENDPOINTS.DOCUMENTS_LIST, {
        method: 'GET',
      });
      setDocuments(response.documents || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
      showToast('Failed to load documents', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilesSelected = async (files: File[]) => {
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(
          `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DOCUMENTS_UPLOAD}?ingest_now=true`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        showToast(`${file.name} uploaded successfully`, 'success');
      } catch (error) {
        showToast(`Failed to upload ${file.name}`, 'error');
      }
    }

    await fetchDocuments();
    setShowUpload(false);
  };

  const handleDeleteDocument = async (filename: string) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}"?`)) {
      return;
    }

    try {
      await apiCall(`${API_CONFIG.ENDPOINTS.DOCUMENTS_DELETE}/${filename}`, {
        method: 'DELETE',
      });
      
      await fetchDocuments();
      showToast('Document deleted successfully', 'success');
    } catch (err) {
      showToast('Failed to delete document', 'error');
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = !searchQuery || doc.filename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = !selectedFolder || doc.folderId === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  const folders = Array.from(new Set(documents.map(d => d.folderId).filter(Boolean))) as string[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b-2 border-border/50">
        <div>
          <h3 className="text-2xl font-bold text-foreground mb-2">Documents</h3>
          <p className="text-base text-foreground/70">
            <span className="font-semibold text-foreground">{documents.length}</span> total documents
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-3 px-6 py-3 bg-primary-gradient text-white rounded-modern text-base font-semibold hover:shadow-neon transition-all"
        >
          <Plus className="w-5 h-5" />
          Upload
        </button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/60" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-5 py-4 bg-background/50 border-2 border-border/50 rounded-modern text-base text-foreground placeholder:text-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
          />
        </div>

        {folders.length > 0 && (
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setSelectedFolder(null)}
              className={`px-5 py-3 text-base font-medium rounded-modern transition-all ${
                !selectedFolder
                  ? 'bg-primary/20 text-primary border-2 border-primary/30 shadow-lg'
                  : 'bg-background/50 text-foreground/70 border-2 border-border/50 hover:border-primary/30 hover:bg-background/70'
              }`}
            >
              All Documents
            </button>
            {folders.map((folder) => (
              <button
                key={folder}
                onClick={() => setSelectedFolder(folder)}
                className={`px-5 py-3 text-base font-medium rounded-modern transition-all flex items-center gap-2 ${
                  selectedFolder === folder
                    ? 'bg-primary/20 text-primary border-2 border-primary/30 shadow-lg'
                    : 'bg-background/50 text-foreground/70 border-2 border-border/50 hover:border-primary/30 hover:bg-background/70'
                }`}
              >
                <Folder className="w-5 h-5" />
                {folder}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Document List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader className="w-10 h-10 text-primary animate-spin" />
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-foreground/60">
          <FileText className="w-20 h-20 mb-6 opacity-50" />
          <p className="text-xl font-medium mb-2">No documents found</p>
          <p className="text-base">Upload documents to get started</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.filename}
              className="flex items-center justify-between p-5 bg-background/30 border-2 border-border/50 rounded-modern hover:border-primary/50 hover:bg-background/40 transition-all shadow-sm hover:shadow-md"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {getStatusIcon(doc.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold text-foreground truncate mb-1">{doc.filename}</p>
                  <div className="flex items-center gap-4 text-sm text-foreground/60">
                    <span>{formatFileSize(doc.size)}</span>
                    {doc.vectors && <span>{doc.vectors} vectors</span>}
                    {doc.version && <span>v{doc.version}</span>}
                    <span>{formatDate(new Date(doc.upload_time))}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDeleteDocument(doc.filename)}
                className="p-3 hover:bg-red-500/10 rounded-modern transition-colors group border-2 border-transparent hover:border-red-500/30"
                title="Delete document"
              >
                <Trash2 className="w-5 h-5 text-foreground/60 group-hover:text-red-500" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border/50 rounded-modern shadow-glass max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <h2 className="text-xl font-bold text-foreground">Upload Documents</h2>
              <button
                onClick={() => setShowUpload(false)}
                className="p-2 hover:bg-background/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-foreground/70" />
              </button>
            </div>
            <div className="p-6">
              <FileUpload onFilesSelected={handleFilesSelected} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'processing':
      return <Loader className="w-4 h-4 text-blue-500 animate-spin" />;
    case 'failed':
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    default:
      return <FileText className="w-4 h-4 text-gray-500" />;
  }
}

export default DocumentsPanel;

