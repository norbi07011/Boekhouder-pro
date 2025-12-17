import { supabase } from '../lib/supabase';
import type { Client, InsertTables, UpdateTables } from '../types/database.types';

export const clientsService = {
  // Get all clients
  async getAll(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  // Get active clients only
  async getActive(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  // Get client by ID
  async getById(id: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Get client with related data
  async getWithDetails(id: string): Promise<(Client & { tasks: any[]; documents: any[] }) | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*, tasks(id, title, status, due_date, priority), documents(id, name, category, created_at)')
      .eq('id', id)
      .single() as any;

    if (error) throw error;
    return data;
  },

  // Create client
  async create(client: Omit<InsertTables<'clients'>, 'organization_id'>): Promise<Client> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', session.user.id)
      .single();

    if (!profile?.organization_id) throw new Error('No organization found');

    const { data, error } = await supabase
      .from('clients')
      .insert({
        ...client,
        organization_id: profile.organization_id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update client
  async update(id: string, updates: UpdateTables<'clients'>): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete client (soft delete by setting is_active = false)
  async deactivate(id: string): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },

  // Hard delete client
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Search clients
  async search(query: string): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,kvk_number.ilike.%${query}%`)
      .eq('is_active', true)
      .order('name')
      .limit(20);

    if (error) throw error;
    return data || [];
  }
};
