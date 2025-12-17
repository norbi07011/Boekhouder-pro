import { supabase } from '../lib/supabase';
import type { Task, InsertTables, UpdateTables } from '../types/database.types';
import { notificationsService } from './notificationsService';

export const tasksService = {
  // Get all tasks for current organization (with multiple assignees)
  async getAll(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles!tasks_assignee_id_fkey(id, name, avatar_url),
        assignees:task_assignees(
          user:profiles!task_assignees_user_id_fkey(id, name, avatar_url)
        ),
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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles!tasks_assignee_id_fkey(id, name, avatar_url),
        client:clients(id, name),
        attachments:task_attachments(*)
      `)
      .eq('assignee_id', session.user.id)
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

  // Create new task (organization_id and created_by are added automatically)
  async create(task: Omit<InsertTables<'tasks'>, 'created_by' | 'organization_id'>): Promise<Task> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', session.user.id)
      .single();

    if (!profile?.organization_id) throw new Error('No organization found');

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...task,
        organization_id: profile.organization_id,
        created_by: session.user.id
      })
      .select()
      .single();

    if (error) throw error;

    // Send notification to assignee if task is assigned
    if (data.assignee_id && data.assignee_id !== session.user.id) {
      try {
        await notificationsService.create({
          user_id: data.assignee_id,
          type: 'task_assigned',
          title: 'Nowe zadanie przypisane',
          body: `Masz nowe zadanie: ${data.title}`,
          link: 'tasks'
        });
      } catch (notifError) {
        console.error('Error sending notification:', notifError);
      }
    }

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
    const { data: { session } } = await supabase.auth.getSession();
    const result = await this.update(taskId, { assignee_id: userId });
    
    // Send notification to new assignee
    if (userId && session?.user && userId !== session.user.id) {
      try {
        await notificationsService.create({
          user_id: userId,
          type: 'task_assigned',
          title: 'Zadanie przypisane do Ciebie',
          body: `Zostałeś przypisany do zadania: ${result.title}`,
          link: 'tasks'
        });
      } catch (notifError) {
        console.error('Error sending notification:', notifError);
      }
    }
    
    return result;
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
  },

  // ============ MULTIPLE ASSIGNEES ============

  // Get all assignees for a task
  async getAssignees(taskId: string): Promise<{ id: string; name: string; avatar_url: string | null }[]> {
    const { data, error } = await supabase
      .from('task_assignees')
      .select(`
        user:profiles!task_assignees_user_id_fkey(id, name, avatar_url)
      `)
      .eq('task_id', taskId);

    if (error) throw error;
    return (data || []).map((d: any) => d.user).filter(Boolean);
  },

  // Set assignees for a task (replaces all existing assignees)
  async setAssignees(taskId: string, userIds: string[]): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    // Remove all existing assignees
    const { error: deleteError } = await supabase
      .from('task_assignees')
      .delete()
      .eq('task_id', taskId);

    if (deleteError) throw deleteError;

    // Add new assignees
    if (userIds.length > 0) {
      const assigneeRecords = userIds.map(userId => ({
        task_id: taskId,
        user_id: userId,
        assigned_by: session.user.id
      }));

      const { error: insertError } = await supabase
        .from('task_assignees')
        .insert(assigneeRecords);

      if (insertError) throw insertError;
    }

    // Also update the legacy assignee_id field (for backwards compatibility)
    // Set to first assignee or null
    await supabase
      .from('tasks')
      .update({ assignee_id: userIds[0] || null })
      .eq('id', taskId);
  },

  // Add a single assignee to a task
  async addAssignee(taskId: string, userId: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('task_assignees')
      .insert({
        task_id: taskId,
        user_id: userId,
        assigned_by: session.user.id
      });

    if (error && error.code !== '23505') throw error; // Ignore duplicate key error
  },

  // Remove an assignee from a task
  async removeAssignee(taskId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('task_assignees')
      .delete()
      .eq('task_id', taskId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  // Subscribe to task assignee changes
  subscribeToAssigneeChanges(callback: (payload: any) => void) {
    return supabase
      .channel('task-assignees-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_assignees'
        },
        callback
      )
      .subscribe();
  }
};
