import { supabase } from '../lib/supabase';
import type { Task, InsertTables, UpdateTables } from '../types/database.types';

export const tasksService = {
  // Get all tasks for current organization
  async getAll(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles!tasks_assignee_id_fkey(id, name, avatar_url),
        client:clients(id, name),
        attachments:task_attachments(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get tasks by status
  async getByStatus(status: Task['status']): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles!tasks_assignee_id_fkey(id, name, avatar_url),
        client:clients(id, name)
      `)
      .eq('status', status)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get tasks assigned to current user
  async getMyTasks(): Promise<Task[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles!tasks_assignee_id_fkey(id, name, avatar_url),
        client:clients(id, name),
        attachments:task_attachments(*)
      `)
      .eq('assignee_id', user.id)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get tasks by date range
  async getByDateRange(startDate: string, endDate: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles!tasks_assignee_id_fkey(id, name, avatar_url),
        client:clients(id, name)
      `)
      .gte('due_date', startDate)
      .lte('due_date', endDate)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get single task by ID
  async getById(id: string): Promise<Task | null> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles!tasks_assignee_id_fkey(id, name, avatar_url, email),
        created_by_user:profiles!tasks_created_by_fkey(id, name),
        client:clients(id, name),
        attachments:task_attachments(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create new task
  async create(task: InsertTables<'tasks'>): Promise<Task> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) throw new Error('No organization found');

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...task,
        organization_id: profile.organization_id,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update task
  async update(id: string, updates: UpdateTables<'tasks'>): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete task
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Update task status
  async updateStatus(id: string, status: Task['status']): Promise<Task> {
    return this.update(id, { status });
  },

  // Assign task to user
  async assign(taskId: string, userId: string | null): Promise<Task> {
    return this.update(taskId, { assignee_id: userId });
  },

  // Get overdue tasks
  async getOverdue(): Promise<Task[]> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles!tasks_assignee_id_fkey(id, name, avatar_url),
        client:clients(id, name)
      `)
      .lt('due_date', today)
      .neq('status', 'DONE')
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get task statistics
  async getStats(): Promise<{
    total: number;
    todo: number;
    inProgress: number;
    review: number;
    done: number;
    overdue: number;
    highPriority: number;
  }> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('tasks')
      .select('status, priority, due_date');

    if (error) throw error;

    const tasks = data || [];
    return {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'TODO').length,
      inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      review: tasks.filter(t => t.status === 'REVIEW').length,
      done: tasks.filter(t => t.status === 'DONE').length,
      overdue: tasks.filter(t => t.due_date && t.due_date < today && t.status !== 'DONE').length,
      highPriority: tasks.filter(t => t.priority === 'High' && t.status !== 'DONE').length
    };
  },

  // Subscribe to realtime task changes
  subscribeToChanges(callback: (payload: any) => void) {
    return supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        callback
      )
      .subscribe();
  }
};
