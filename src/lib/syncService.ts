import { db, type FieldForm, type SyncQueueItem } from './db';
import { createClient } from '@/utils/supabase/client';
import { v4 as uuidv4 } from 'uuid'; // You'll need to install uuid if not already

export const syncService = {
  /**
   * Save a form locally. If status is pending_sync, add to sync queue.
   */
  async saveFormLocally(form: Omit<FieldForm, 'id' | 'created_at' | 'updated_at'>, id?: string) {
    const now = new Date().toISOString();
    const formId = id || uuidv4();
    
    const newForm: FieldForm = {
      ...form,
      id: formId,
      created_at: now,
      updated_at: now,
    };

    await db.transaction('rw', db.fieldForms, db.syncQueue, async () => {
      if (id) {
        // Update existing
        await db.fieldForms.update(id, { ...newForm, updated_at: now });
      } else {
        // Add new
        await db.fieldForms.add(newForm);
      }

      if (newForm.status === 'pending_sync') {
        const queueItem: SyncQueueItem = {
          id: uuidv4(),
          form_id: formId,
          action: id ? 'update' : 'insert',
          payload: newForm,
          status: 'pending',
          retry_count: 0,
          created_at: now,
        };
        await db.syncQueue.add(queueItem);
      }
    });

    // Attempt sync if online
    if (navigator.onLine) {
      this.processSyncQueue();
    }

    return formId;
  },

  /**
   * Process the sync queue and send data to Supabase
   */
  async processSyncQueue() {
    if (!navigator.onLine) return;

    const pendingItems = await db.syncQueue.where('status').equals('pending').toArray();
    if (pendingItems.length === 0) return;

    const supabase = createClient();

    for (const item of pendingItems) {
      try {
        const { payload, action } = item;
        
        // Prepare data for Supabase
        const supabaseData = {
          workspace_id: payload.workspace_id,
          project_id: payload.project_id,
          title: payload.title,
          form_data: payload.form_data,
          status: 'synced', // Mark as synced on server
          device_local_id: payload.id,
        };

        if (action === 'insert') {
          const { data, error } = await supabase.from('field_forms').insert([supabaseData]).select('id').single();
          if (error) throw error;
          
          // Update local form with server ID and synced status
          await db.fieldForms.update(item.form_id, { 
            status: 'synced', 
            server_id: data.id 
          });
        } else if (action === 'update' && payload.server_id) {
           const { error } = await supabase.from('field_forms').update(supabaseData).eq('id', payload.server_id);
           if (error) throw error;

           await db.fieldForms.update(item.form_id, { status: 'synced' });
        }

        // Remove from queue on success
        await db.syncQueue.delete(item.id);

      } catch (error) {
        console.error('Sync failed for item', item.id, error);
        // Increment retry count
        await db.syncQueue.update(item.id, { 
          retry_count: item.retry_count + 1,
          status: item.retry_count > 3 ? 'failed' : 'pending'
        });
      }
    }
  },

  /**
   * Listen for online events to trigger auto-sync
   */
  initAutoSync() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('Online! Processing sync queue...');
        this.processSyncQueue();
      });
      
      // Initial check
      if (navigator.onLine) {
         this.processSyncQueue();
      }
    }
  }
};
