# Boekhouder Connect - Supabase Setup Guide

## 🚀 Quick Setup

### 1. Create Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Create a new project
3. Wait for the project to be ready (~2 minutes)

### 2. Get API Keys

1. Go to **Settings → API**
2. Copy:
   - **Project URL** (e.g., `https://xxx.supabase.co`)
   - **anon public** key

### 3. Configure Environment

Create `.env` file in project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run Database Schema

1. Go to **SQL Editor** in Supabase Dashboard
2. Copy contents of `supabase/schema.sql`
3. Run the query

### 5. Create Storage Buckets

Go to **Storage** in Supabase Dashboard and create:

| Bucket Name | Public |
|-------------|--------|
| `avatars` | ✅ Yes |
| `documents` | ❌ No |
| `task-attachments` | ❌ No |
| `chat-attachments` | ❌ No |

Then run `supabase/storage-policies.sql` in SQL Editor.

### 6. Enable Authentication Providers

Go to **Authentication → Providers**:

1. **Email** - Already enabled
2. **Google** (optional):
   - Get OAuth credentials from Google Cloud Console
   - Add Client ID and Secret

### 7. Configure Email Templates (Optional)

Go to **Authentication → Email Templates**:
- Customize confirmation, password reset emails

---

## 📁 Project Structure

```
src/
├── lib/
│   └── supabase.ts          # Supabase client
├── types/
│   └── database.types.ts    # TypeScript types
├── services/
│   ├── authService.ts       # Authentication
│   ├── tasksService.ts      # Tasks CRUD
│   ├── chatService.ts       # Chat & messages
│   ├── documentsService.ts  # Documents
│   ├── profilesService.ts   # User profiles
│   ├── clientsService.ts    # Accounting clients
│   └── notificationsService.ts
├── hooks/
│   ├── useTasks.ts          # Tasks hook
│   ├── useChat.ts           # Chat hook
│   └── useDocuments.ts      # Documents hook
├── contexts/
│   └── AuthContext.tsx      # Auth provider
└── components/
    └── auth/
        └── AuthForm.tsx     # Login/Register form
```

---

## 🔧 Database Tables

| Table | Description |
|-------|-------------|
| `organizations` | Companies/tenants |
| `profiles` | User profiles (extends auth.users) |
| `clients` | Accounting clients |
| `tasks` | Tasks/assignments |
| `task_attachments` | Task file attachments |
| `task_templates` | Reusable task templates |
| `chat_channels` | Chat rooms & DMs |
| `chat_messages` | Messages |
| `documents` | Uploaded documents |
| `notifications` | User notifications |
| `user_settings` | Preferences |
| `audit_logs` | Change history |
| `dutch_tax_deadlines` | NL tax calendar |

---

## 🔐 Row Level Security (RLS)

All tables have RLS enabled:
- Users can only access data within their organization
- Users can only modify their own profile
- Notifications are user-private

---

## ⚡ Real-time Subscriptions

Enabled for:
- `chat_messages` - Live chat
- `notifications` - Push notifications
- `tasks` - Task updates

---

## 📝 Usage Examples

### Authentication

```tsx
import { useAuth } from './contexts/AuthContext';

function App() {
  const { user, signIn, signOut, loading } = useAuth();

  if (loading) return <Loading />;
  if (!user) return <AuthForm />;

  return <Dashboard />;
}
```

### Tasks

```tsx
import { useTasks } from './hooks/useTasks';

function TaskList() {
  const { tasks, loading, createTask, updateStatus } = useTasks();

  const handleCreate = async () => {
    await createTask({
      title: 'BTW Aangifte Q4',
      priority: 'High',
      due_date: '2025-01-31'
    });
  };

  return (
    <ul>
      {tasks.map(task => (
        <li key={task.id}>{task.title}</li>
      ))}
    </ul>
  );
}
```

### Chat

```tsx
import { useChat } from './hooks/useChat';

function ChatRoom() {
  const { messages, sendMessage, activeChannel } = useChat();

  const handleSend = async (text: string) => {
    await sendMessage(text);
  };

  return (
    <div>
      {messages.map(msg => (
        <Message key={msg.id} {...msg} />
      ))}
    </div>
  );
}
```

---

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

---

## 📞 Support

For issues with Supabase setup, check:
- [Supabase Docs](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
