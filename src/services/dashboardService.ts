import { supabase } from '../lib/supabase';

export interface DashboardStats {
  todoCount: number;
  inProgressCount: number;
  reviewCount: number;
  doneCount: number;
  highPriorityCount: number;
  overdueCount: number;
  totalTasks: number;
}

export interface TaxDeadline {
  id: string;
  date: string;
  descriptionPL: string;
  descriptionTR: string;
  descriptionNL: string;
  isRecurring: boolean;
}

export interface RecentActivity {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  dueDate: string;
  updatedAt: string;
  assigneeName?: string;
  assigneeAvatar?: string;
}

export interface TeamWorkload {
  userId: string;
  name: string;
  taskCount: number;
  todoCount: number;
  inProgressCount: number;
  doneCount: number;
}

export const dashboardService = {
  /**
   * Get task statistics for dashboard KPI cards
   */
  async getTaskStats(): Promise<DashboardStats> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('status, priority, due_date');

    if (error) {
      console.error('Error fetching task stats:', error);
      return {
        todoCount: 0,
        inProgressCount: 0,
        reviewCount: 0,
        doneCount: 0,
        highPriorityCount: 0,
        overdueCount: 0,
        totalTasks: 0
      };
    }

    const stats: DashboardStats = {
      todoCount: 0,
      inProgressCount: 0,
      reviewCount: 0,
      doneCount: 0,
      highPriorityCount: 0,
      overdueCount: 0,
      totalTasks: tasks?.length || 0
    };

    tasks?.forEach(task => {
      // Count by status
      switch (task.status) {
        case 'TODO':
          stats.todoCount++;
          break;
        case 'IN_PROGRESS':
          stats.inProgressCount++;
          break;
        case 'REVIEW':
          stats.reviewCount++;
          break;
        case 'DONE':
          stats.doneCount++;
          break;
      }

      // Count high priority (not done)
      if (task.priority === 'High' && task.status !== 'DONE') {
        stats.highPriorityCount++;
      }

      // Count overdue (not done and past due date)
      if (task.due_date && task.status !== 'DONE' && task.due_date < today) {
        stats.overdueCount++;
      }
    });

    return stats;
  },

  /**
   * Get Dutch tax deadlines from database (not static constants!)
   */
  async getTaxDeadlines(): Promise<TaxDeadline[]> {
    const { data, error } = await supabase
      .from('dutch_tax_deadlines')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching tax deadlines:', error);
      return [];
    }

    return (data || []).map(d => ({
      id: d.id,
      date: d.date,
      descriptionPL: d.description_pl,
      descriptionTR: d.description_tr,
      descriptionNL: d.description_nl,
      isRecurring: d.is_recurring ?? true
    }));
  },

  /**
   * Get upcoming tax deadlines (future only)
   */
  async getUpcomingDeadlines(limit: number = 5): Promise<TaxDeadline[]> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('dutch_tax_deadlines')
      .select('*')
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching upcoming deadlines:', error);
      return [];
    }

    return (data || []).map(d => ({
      id: d.id,
      date: d.date,
      descriptionPL: d.description_pl,
      descriptionTR: d.description_tr,
      descriptionNL: d.description_nl,
      isRecurring: d.is_recurring ?? true
    }));
  },

  /**
   * Get next upcoming deadline
   */
  async getNextDeadline(): Promise<TaxDeadline | null> {
    const deadlines = await this.getUpcomingDeadlines(1);
    return deadlines.length > 0 ? deadlines[0] : null;
  },

  /**
   * Get recent activity (tasks sorted by updated_at)
   */
  async getRecentActivity(limit: number = 5): Promise<RecentActivity[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        description,
        priority,
        status,
        due_date,
        updated_at,
        assignee:profiles!tasks_assignee_id_fkey (
          name,
          avatar_url
        )
      `)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }

    return (data || []).map(task => ({
      id: task.id,
      title: task.title,
      description: task.description || '',
      priority: task.priority || 'Medium',
      status: task.status || 'TODO',
      dueDate: task.due_date || '',
      updatedAt: task.updated_at || '',
      assigneeName: (task.assignee as any)?.name,
      assigneeAvatar: (task.assignee as any)?.avatar_url
    }));
  },

  /**
   * Get team workload distribution
   */
  async getTeamWorkload(): Promise<TeamWorkload[]> {
    // Get all users in organization
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return [];
    }

    // Get all tasks with assignees
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('assignee_id, status');

    if (tasksError) {
      console.error('Error fetching tasks for workload:', tasksError);
      return [];
    }

    // Also get multi-assignees from task_assignees table
    const { data: taskAssignees, error: assigneesError } = await supabase
      .from('task_assignees')
      .select('user_id, task_id, tasks!task_assignees_task_id_fkey(status)');

    // Calculate workload per user
    const workloadMap = new Map<string, TeamWorkload>();

    // Initialize with all profiles
    profiles?.forEach(profile => {
      workloadMap.set(profile.id, {
        userId: profile.id,
        name: profile.name,
        taskCount: 0,
        todoCount: 0,
        inProgressCount: 0,
        doneCount: 0
      });
    });

    // Count from main assignee_id
    tasks?.forEach(task => {
      if (task.assignee_id && workloadMap.has(task.assignee_id)) {
        const workload = workloadMap.get(task.assignee_id)!;
        workload.taskCount++;
        
        switch (task.status) {
          case 'TODO':
            workload.todoCount++;
            break;
          case 'IN_PROGRESS':
            workload.inProgressCount++;
            break;
          case 'DONE':
            workload.doneCount++;
            break;
        }
      }
    });

    // Count from task_assignees (additional assignees)
    if (!assigneesError && taskAssignees) {
      taskAssignees.forEach((ta: any) => {
        if (ta.user_id && workloadMap.has(ta.user_id)) {
          const workload = workloadMap.get(ta.user_id)!;
          workload.taskCount++;
          
          const status = ta.tasks?.status;
          switch (status) {
            case 'TODO':
              workload.todoCount++;
              break;
            case 'IN_PROGRESS':
              workload.inProgressCount++;
              break;
            case 'DONE':
              workload.doneCount++;
              break;
          }
        }
      });
    }

    return Array.from(workloadMap.values())
      .filter(w => w.taskCount > 0 || true) // Include all team members
      .sort((a, b) => b.taskCount - a.taskCount);
  },

  /**
   * Calculate days until a deadline
   */
  daysUntil(dateString: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(dateString);
    deadline.setHours(0, 0, 0, 0);
    const diffTime = deadline.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
};
