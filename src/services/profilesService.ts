import { supabase } from '../lib/supabase';
import type { Profile, InsertTables, UpdateTables } from '../types/database.types';

export const profilesService = {
  // Get current user's profile
  async getCurrentProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        organization:organizations(id, name, logo_url)
      `)
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return data;
  },

  // Get all profiles in organization
  async getAllInOrganization(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  // Get profile by ID
  async getById(id: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        organization:organizations(id, name, logo_url)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Update profile
  async update(id: string, updates: UpdateTables<'profiles'>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update current user's profile
  async updateCurrentProfile(updates: UpdateTables<'profiles'>): Promise<Profile> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    return this.update(user.id, updates);
  },

  // Upload avatar
  async uploadAvatar(file: File): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/avatar.${fileExt}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    // Update profile with new avatar URL
    await this.update(user.id, { avatar_url: data.publicUrl });

    return data.publicUrl;
  },

  // Update user status (Online/Offline/Busy)
  async updateStatus(status: Profile['status']): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('profiles')
      .update({ status })
      .eq('id', user.id);
  },

  // Get online users in organization
  async getOnlineUsers(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('status', 'Online');

    if (error) throw error;
    return data || [];
  }
};
