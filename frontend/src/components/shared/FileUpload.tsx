/**
 * Enhanced file upload component with drag-and-drop
 */

import React, { useState, useCallback } from 'react';
import { Upload, File, X, Loader } from 'lucide-react';
import { ALLOWED_FILE_TYPES, formatFileSize, isValidFileType, getFileTypeLabel } from '../../utils/fileUtils';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  accept?: string[];
  multiple?: boolean;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB default
  accept = ALLOWED_FILE_TYPES,
  multiple = true,
  disabled = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const validateFile = (file: File): string | null => {
    if (!isValidFileType(file.name, accept)) {
      return `File type not allowed. Allowed types: ${accept.join(', ')}`;
    }
    if (file.size > maxSize) {
      return `File size exceeds ${formatFileSize(maxSize)}`;
    }
    return null;
  };

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const newErrors: string[] = [];

    fileArray.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        newErrors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (newErrors.length > 0) {
      setErrors(newErrors);
    } else {
      setErrors([]);
    }

    const updatedFiles = multiple
      ? [...selectedFiles, ...validFiles].slice(0, maxFiles)
      : validFiles.slice(0, 1);

    setSelectedFiles(updatedFiles);
    if (validFiles.length > 0) {
      onFilesSelected(updatedFiles);
    }
  }, [selectedFiles, multiple, maxFiles, accept, maxSize, onFilesSelected]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (!disabled) {
      handleFiles(e.dataTransfer.files);
    }
  }, [disabled, handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = ''; // Reset input
  }, [handleFiles]);

  const removeFile = useCallback((index: number) => {
    const updated = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updated);
    onFilesSelected(updated);
  }, [selectedFiles, onFilesSelected]);

  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0) return;
    
    setIsUploading(true);
    try {
      // This would normally upload files
      await new Promise(resolve => setTimeout(resolve, 1000));
      onFilesSelected(selectedFiles);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
      setSelectedFiles([]);
    }
  }, [selectedFiles, onFilesSelected]);

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-modern p-8 text-center transition-colors
          ${
            isDragging
              ? 'border-primary bg-primary/10'
              : 'border-border/50 hover:border-primary/50 hover:bg-background/30'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <input
          type="file"
          multiple={multiple}
          accept={accept.map(ext => `.${ext}`).join(',')}
          onChange={handleFileInput}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center gap-3">
          <Upload className={`w-8 h-8 ${isDragging ? 'text-primary' : 'text-foreground/60'}`} />
          <div>
            <p className="text-sm font-medium text-foreground">
              {isDragging ? 'Drop files here' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-foreground/60 mt-1">
              Supported: {accept.join(', ').toUpperCase()} (max {formatFileSize(maxSize)})
            </p>
          </div>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          {errors.map((error, index) => (
            <p key={index} className="text-sm text-red-500">{error}</p>
          ))}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-background/30 border border-border/50 rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <File className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-foreground/60">
                    {getFileTypeLabel(file.name.split('.').pop() || '')} • {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="p-1 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-foreground/60 hover:text-red-500" />
              </button>
            </div>
          ))}
          <button
            onClick={handleUpload}
            disabled={isUploading || disabled}
            className="w-full bg-primary-gradient text-white px-4 py-2 rounded-modern font-semibold transition-all hover:shadow-neon disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              `Upload ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}`
            )}
          </button>
        </div>
      )}
    </div>
  );
};



