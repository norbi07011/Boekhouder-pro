import { supabase } from '../lib/supabase';
import type { Document, InsertTables } from '../types/database.types';

export const documentsService = {
  // Get all documents
  async getAll(): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        client:clients(id, name),
        uploaded_by_user:profiles!documents_uploaded_by_fkey(id, name, avatar_url)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get documents by client
  async getByClient(clientId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        uploaded_by_user:profiles!documents_uploaded_by_fkey(id, name)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get documents by category
  async getByCategory(category: Document['category']): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        client:clients(id, name),
        uploaded_by_user:profiles!documents_uploaded_by_fkey(id, name)
      `)
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get documents by year
  async getByYear(year: number): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        client:clients(id, name)
      `)
      .eq('year', year)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Upload document
  async upload(
    file: File,
    metadata: {
      clientId?: string;
      taskId?: string;
      category?: Document['category'];
      year?: number;
      quarter?: number;
    }
  ): Promise<Document> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) throw new Error('No organization found');

    // Generate file path
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const filePath = `${profile.organization_id}/${metadata.clientId || 'general'}/${timestamp}-${file.name}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get signed URL
    const { data: urlData } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year

    // Create document record
    const { data, error } = await supabase
      .from('documents')
      .insert({
        organization_id: profile.organization_id,
        client_id: metadata.clientId || null,
        task_id: metadata.taskId || null,
        name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        category: metadata.category || 'other',
        year: metadata.year || new Date().getFullYear(),
        quarter: metadata.quarter || null,
        uploaded_by: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get download URL
  async getDownloadUrl(filePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 60 * 60); // 1 hour

    if (error) throw error;
    return data.signedUrl;
  },

  // Delete document
  async delete(id: string, filePath: string): Promise<void> {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([filePath]);

    if (storageError) throw storageError;

    // Delete record
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Update document metadata
  async update(id: string, updates: {
    name?: string;
    category?: Document['category'];
    year?: number;
    quarter?: number;
  }): Promise<Document> {
    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Search documents
  async search(query: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        client:clients(id, name)
      `)
      .ilike('name', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  }
};
