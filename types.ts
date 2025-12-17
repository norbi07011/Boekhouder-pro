
export type Language = 'PL' | 'TR' | 'NL';

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
}

export type TaskCategory = 'General' | 'Tax' | 'Payroll' | 'Meeting' | 'Audit' | 'Advisory';

export interface User {
  id: string;
  name: string;
  avatar: string;
  role: 'Accountant' | 'Manager' | 'Admin';
  email?: string;
  phone?: string;
  website?: string;
  location?: string;
  bio?: string;
  status?: 'Online' | 'Offline' | 'Busy';
  linkedin?: string;
}

export interface TaskAttachment {
  id: string;
  type: 'image' | 'file' | 'voice';
  name: string;
  url: string; // Base64 or Blob URL
  size?: string;
  timestamp: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string | null; // Legacy single assignee (for backwards compatibility)
  assigneeIds?: string[]; // Multiple assignees
  dueDate: string; // ISO date YYYY-MM-DD
  dueTime?: string; // HH:MM
  status: TaskStatus;
  priority: 'Low' | 'Medium' | 'High';
  category?: TaskCategory;
  estimatedHours?: number;
  tags: string[];
  attachments: TaskAttachment[];
}

export interface ChatAttachment {
    id: string;
    type: 'image' | 'file' | 'voice';
    url: string;
    name?: string;
    size?: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  channelId: string; // 'general', 'payroll', or userId for DM
  text: string;
  timestamp: string;
  attachments?: ChatAttachment[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'MEETING' | 'DEADLINE' | 'REMINDER';
}

export interface DutchTaxDeadline {
  date: string;
  descriptionPL: string;
  descriptionTR: string;
  descriptionNL: string;
}

export interface TaskTemplate {
  id?: string;
  label: string;
  color: string;
  title: string;
  descPL: string;
  descTR: string;
  descNL: string;
  priority: string;
  category?: TaskCategory;
}
