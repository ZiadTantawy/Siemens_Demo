/**
 * Documents Attachment Tab
 */

import React, { useState, useEffect } from 'react';
import { FileText, Search } from 'lucide-react';
import { apiCall, API_CONFIG } from '../../../config/api';
import { AttachedContext } from '../../../types/chat';

interface DocumentsTabProps {
  selectedItems: AttachedContext[];
  onSelectionChange: (items: AttachedContext[]) => void;
}

interface Document {
  filename: string;
  filepath: string;
  size: number;
  status: string;
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({ selectedItems, onSelectionChange }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelection = (filename: string) => {
    const itemId = `document_${filename}`;
    const isSelected = selectedItems.some(item => item.id === itemId);

    if (isSelected) {
      onSelectionChange(selectedItems.filter(item => item.id !== itemId));
    } else {
      onSelectionChange([
        ...selectedItems,
        {
          id: itemId,
          type: 'document',
          sourceId: filename,
          title: filename
        }
      ]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
        {filteredDocuments.length === 0 ? (
          <p className="text-center py-8 text-foreground/60">No documents found</p>
        ) : (
          filteredDocuments.map((doc) => {
            const itemId = `document_${doc.filename}`;
            const isSelected = selectedItems.some(item => item.id === itemId);

              return (
                <label
                  key={doc.filename}
                  className={`flex items-center gap-4 p-5 border-2 rounded-modern cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-primary/20 border-primary/30 shadow-lg'
                      : 'bg-background/30 border-border/50 hover:border-primary/30 hover:bg-background/40'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelection(doc.filename)}
                    className="w-5 h-5 rounded cursor-pointer"
                  />
                  <FileText className="w-6 h-6 text-orange-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-foreground truncate mb-1">{doc.filename}</p>
                    <p className="text-sm text-foreground/60">{doc.status}</p>
                  </div>
                </label>
              );
          })
        )}
      </div>
    </div>
  );
};

export default DocumentsTab;

