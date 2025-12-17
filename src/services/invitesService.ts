import { supabase } from '../lib/supabase';

export interface OrganizationInvite {
  id: string;
  organization_id: string;
  email: string;
  invited_by: string;
  role: string;
  token: string;
  status: string;
  expires_at: string;
  created_at: string;
  accepted_at?: string;
  invited_by_user?: { id: string; name: string; avatar_url: string };
  organization?: { id: string; name: string };
}

export const invitesService = {
  // Get all pending invites for current organization
  async getPendingInvites(): Promise<OrganizationInvite[]> {
    const { data, error } = await supabase
      .from('organization_invites')
      .select(`
        *,
        invited_by_user:profiles!organization_invites_invited_by_fkey(id, name, avatar_url)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as OrganizationInvite[];
  },

  // Create new invite
  async createInvite(email: string, role: string = 'Accountant'): Promise<OrganizationInvite> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', session.user.id)
      .single();

    if (!profile?.organization_id) throw new Error('No organization found');

    const { data, error } = await supabase
      .from('organization_invites')
      .insert({
        organization_id: profile.organization_id,
        email: email.toLowerCase(),
        invited_by: session.user.id,
        role
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('User already invited');
      }
      throw error;
    }
    
    return data as unknown as OrganizationInvite;
  },

  // Cancel invite
  async cancelInvite(inviteId: string): Promise<void> {
    const { error } = await supabase
      .from('organization_invites')
      .update({ status: 'cancelled' })
      .eq('id', inviteId);

    if (error) throw error;
  },

  // Accept invite using token
  async acceptInvite(token: string): Promise<{ success: boolean; error?: string; organization_id?: string }> {
    const { data, error } = await supabase.rpc('accept_organization_invite', {
      invite_token: token
    });

    if (error) throw error;
    return data as { success: boolean; error?: string; organization_id?: string };
  },

  // Check if current user has pending invite
  async checkMyInvite(): Promise<OrganizationInvite | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) return null;

    const { data, error } = await supabase
      .from('organization_invites')
      .select(`
        *,
        organization:organizations(id, name)
      `)
      .eq('email', session.user.email.toLowerCase())
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as unknown as OrganizationInvite | null;
  },

  // Generate invite link
  getInviteLink(token: string): string {
    return `${window.location.origin}?invite=${token}`;
  }
};
