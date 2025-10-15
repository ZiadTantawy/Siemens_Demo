import React, { useState, useEffect } from 'react';
import { Upload, File, Trash2, CheckCircle, AlertCircle, Loader, X } from 'lucide-react';
import { apiCall, API_CONFIG } from '../config/api';

interface Document {
  filename: string;
  filepath: string;
  size: number;
  vectors?: number;
  status: string;
  upload_time: string;
  ingestion_time?: string;
}

interface DocumentUploadProps {
  onClose: () => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onClose }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Fetch documents on mount
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
      setError('');
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.pdf')) {
      setError('Only PDF files are supported');
      return;
    }

    setIsUploading(true);
    setUploadProgress(`Uploading ${file.name}...`);
    setError('');

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
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const result = await response.json();
      
      if (result.success) {
        setUploadProgress('Upload successful! Processing...');
        // Refresh document list
        await fetchDocuments();
        setUploadProgress('');
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleDeleteDocument = async (filename: string) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}"?`)) {
      return;
    }

    try {
      await apiCall(`${API_CONFIG.ENDPOINTS.DOCUMENTS_DELETE}/${filename}`, {
        method: 'DELETE',
      });
      
      // Refresh document list
      await fetchDocuments();
      setError('');
    } catch (err) {
      console.error('Delete error:', err);
      setError(`Failed to delete ${filename}`);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Loader className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <File className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border/50 rounded-modern shadow-glass max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-gradient rounded-lg flex items-center justify-center">
              <File className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Document Management</h2>
              <p className="text-sm text-foreground/70">Upload and manage PDF documents</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-background/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-foreground/70" />
          </button>
        </div>

        {/* Upload Area */}
        <div className="p-6 border-b border-border/50">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border/50 rounded-modern cursor-pointer hover:border-primary/50 hover:bg-background/30 transition-all">
            <div className="flex flex-col items-center justify-center gap-2">
              <Upload className="w-8 h-8 text-primary" />
              <p className="text-sm text-foreground/70">
                {isUploading ? uploadProgress : 'Click to upload PDF or drag and drop'}
              </p>
              {isUploading && <Loader className="w-5 h-5 text-primary animate-spin" />}
            </div>
            <input
              type="file"
              className="hidden"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </label>
          
          {error && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}
        </div>

        {/* Document List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-foreground/50">
              <File className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg">No documents uploaded yet</p>
              <p className="text-sm">Upload a PDF to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.filename}
                  className="flex items-center justify-between p-4 bg-background/30 border border-border/50 rounded-lg hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {getStatusIcon(doc.status)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{doc.filename}</p>
                      <div className="flex items-center gap-4 text-xs text-foreground/60 mt-1">
                        <span>{formatFileSize(doc.size)}</span>
                        {doc.vectors && <span>{doc.vectors} vectors</span>}
                        <span>{formatDate(doc.upload_time)}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteDocument(doc.filename)}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4 text-foreground/60 group-hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border/50 bg-background/20">
          <p className="text-sm text-foreground/60 text-center">
            {documents.length} document{documents.length !== 1 ? 's' : ''} in knowledge base
          </p>
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;
