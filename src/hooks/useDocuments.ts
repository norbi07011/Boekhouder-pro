import { useState, useEffect, useCallback } from 'react';
import { documentsService } from '../services/documentsService';
import type { Document } from '../types/database.types';

interface UseDocumentsReturn {
  documents: Document[];
  loading: boolean;
  error: string | null;
  uploadDocument: (file: File, metadata?: {
    clientId?: string;
    taskId?: string;
    category?: Document['category'];
    year?: number;
    quarter?: number;
  }) => Promise<Document>;
  deleteDocument: (id: string, filePath: string) => Promise<void>;
  updateDocument: (id: string, updates: {
    name?: string;
    category?: Document['category'];
    year?: number;
    quarter?: number;
  }) => Promise<Document>;
  getDownloadUrl: (filePath: string) => Promise<string>;
  searchDocuments: (query: string) => Promise<Document[]>;
  refreshDocuments: () => Promise<void>;
  filterByCategory: (category: Document['category'] | null) => void;
  filterByYear: (year: number | null) => void;
  filterByClient: (clientId: string | null) => void;
}

export const useDocuments = (): UseDocumentsReturn => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [allDocuments, setAllDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    category: Document['category'] | null;
    year: number | null;
    clientId: string | null;
  }>({
    category: null,
    year: null,
    clientId: null
  });

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await documentsService.getAll();
      setAllDocuments(data);
      setDocuments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Apply filters
  useEffect(() => {
    let filtered = [...allDocuments];

    if (filters.category) {
      filtered = filtered.filter(d => d.category === filters.category);
    }
    if (filters.year) {
      filtered = filtered.filter(d => d.year === filters.year);
    }
    if (filters.clientId) {
      filtered = filtered.filter(d => d.client_id === filters.clientId);
    }

    setDocuments(filtered);
  }, [allDocuments, filters]);

  const uploadDocument = async (file: File, metadata?: any): Promise<Document> => {
    const doc = await documentsService.upload(file, metadata || {});
    setAllDocuments(prev => [doc, ...prev]);
    return doc;
  };

  const deleteDocument = async (id: string, filePath: string): Promise<void> => {
    await documentsService.delete(id, filePath);
    setAllDocuments(prev => prev.filter(d => d.id !== id));
  };

  const updateDocument = async (id: string, updates: any): Promise<Document> => {
    const updated = await documentsService.update(id, updates);
    setAllDocuments(prev => prev.map(d => d.id === id ? updated : d));
    return updated;
  };

  const getDownloadUrl = async (filePath: string): Promise<string> => {
    return documentsService.getDownloadUrl(filePath);
  };

  const searchDocuments = async (query: string): Promise<Document[]> => {
    return documentsService.search(query);
  };

  const filterByCategory = (category: Document['category'] | null) => {
    setFilters(prev => ({ ...prev, category }));
  };

  const filterByYear = (year: number | null) => {
    setFilters(prev => ({ ...prev, year }));
  };

  const filterByClient = (clientId: string | null) => {
    setFilters(prev => ({ ...prev, clientId }));
  };

  return {
    documents,
    loading,
    error,
    uploadDocument,
    deleteDocument,
    updateDocument,
    getDownloadUrl,
    searchDocuments,
    refreshDocuments: fetchDocuments,
    filterByCategory,
    filterByYear,
    filterByClient
  };
};
