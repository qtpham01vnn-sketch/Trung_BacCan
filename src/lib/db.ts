import Dexie, { type EntityTable } from 'dexie';

export type FormStatus = 'draft' | 'pending_sync' | 'synced' | 'submitted' | 'approved' | 'rejected';

export interface FieldForm {
  id: string; // Local UUID
  workspace_id: string;
  project_id: string;
  type: string; // e.g., 'attendance', 'hours', 'volume'
  title: string;
  form_data: Record<string, any>;
  status: FormStatus;
  created_at: string;
  updated_at: string;
  server_id?: string; // UUID from Supabase after sync
}

export interface SyncQueueItem {
  id: string;
  form_id: string;
  action: 'insert' | 'update' | 'delete';
  payload: any;
  status: 'pending' | 'failed';
  retry_count: number;
  created_at: string;
}

export interface MasterData {
  id: string;
  project_id?: string;
  type: string;
  value: string;
  label: string;
  is_active: boolean;
}

const db = new Dexie('TrungBacCanDB') as Dexie & {
  fieldForms: EntityTable<FieldForm, 'id'>;
  syncQueue: EntityTable<SyncQueueItem, 'id'>;
  masterData: EntityTable<MasterData, 'id'>;
};

// Define schema
db.version(2).stores({
  fieldForms: 'id, workspace_id, project_id, type, status, created_at, server_id', // Primary key and indexed props
  syncQueue: 'id, form_id, status, created_at',
  masterData: 'id, type, project_id'
});

export { db };
