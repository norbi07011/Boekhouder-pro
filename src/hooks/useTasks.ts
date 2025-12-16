import { useState, useEffect, useCallback } from 'react';
import { tasksService } from '../services/tasksService';
import type { Task, InsertTables, UpdateTables } from '../types/database.types';

interface UseTasksReturn {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  stats: {
    total: number;
    todo: number;
    inProgress: number;
    review: number;
    done: number;
    overdue: number;
    highPriority: number;
  } | null;
  createTask: (task: InsertTables<'tasks'>) => Promise<Task>;
  updateTask: (id: string, updates: UpdateTables<'tasks'>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  updateStatus: (id: string, status: Task['status']) => Promise<Task>;
  assignTask: (taskId: string, userId: string | null) => Promise<Task>;
  refreshTasks: () => Promise<void>;
  getTasksByDate: (startDate: string, endDate: string) => Promise<Task[]>;
}

export const useTasks = (filter?: 'all' | 'mine' | 'overdue'): UseTasksReturn => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<UseTasksReturn['stats']>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data: Task[];
      switch (filter) {
        case 'mine':
          data = await tasksService.getMyTasks();
          break;
        case 'overdue':
          data = await tasksService.getOverdue();
          break;
        default:
          data = await tasksService.getAll();
      }
      setTasks(data);

      // Fetch stats
      const statsData = await tasksService.getStats();
      setStats(statsData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchTasks();

    // Subscribe to realtime changes
    const subscription = tasksService.subscribeToChanges((payload) => {
      if (payload.eventType === 'INSERT') {
        setTasks(prev => [payload.new as Task, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setTasks(prev => prev.map(t => t.id === payload.new.id ? payload.new as Task : t));
      } else if (payload.eventType === 'DELETE') {
        setTasks(prev => prev.filter(t => t.id !== payload.old.id));
      }
      // Refresh stats on any change
      tasksService.getStats().then(setStats);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchTasks]);

  const createTask = async (task: InsertTables<'tasks'>): Promise<Task> => {
    const newTask = await tasksService.create(task);
    setTasks(prev => [newTask, ...prev]);
    return newTask;
  };

  const updateTask = async (id: string, updates: UpdateTables<'tasks'>): Promise<Task> => {
    const updated = await tasksService.update(id, updates);
    setTasks(prev => prev.map(t => t.id === id ? updated : t));
    return updated;
  };

  const deleteTask = async (id: string): Promise<void> => {
    await tasksService.delete(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const updateStatus = async (id: string, status: Task['status']): Promise<Task> => {
    return updateTask(id, { status });
  };

  const assignTask = async (taskId: string, userId: string | null): Promise<Task> => {
    return updateTask(taskId, { assignee_id: userId });
  };

  const getTasksByDate = async (startDate: string, endDate: string): Promise<Task[]> => {
    return tasksService.getByDateRange(startDate, endDate);
  };

  return {
    tasks,
    loading,
    error,
    stats,
    createTask,
    updateTask,
    deleteTask,
    updateStatus,
    assignTask,
    refreshTasks: fetchTasks,
    getTasksByDate
  };
};
