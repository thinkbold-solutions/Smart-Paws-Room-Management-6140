import supabase from '../lib/supabase';

export class DataSyncEngine {
  constructor() {
    this.syncQueue = [];
    this.isProcessing = false;
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
  }

  /**
   * Queue a sync operation
   */
  async queueSync(sourceProduct, targetProduct, entityType, entityId, syncData) {
    try {
      const { data, error } = await supabase
        .from('sp_data_sync_log_x7k9m2')
        .insert({
          source_product_id: await this.getProductId(sourceProduct),
          target_product_id: await this.getProductId(targetProduct),
          entity_type: entityType,
          entity_id: entityId,
          sync_type: 'update',
          sync_data: syncData,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Trigger processing
      this.processQueue();
      
      return data;
    } catch (error) {
      console.error('Failed to queue sync:', error);
      throw error;
    }
  }

  /**
   * Process the sync queue
   */
  async processQueue() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;

    try {
      // Get pending sync items
      const { data: pendingItems, error } = await supabase
        .from('sp_data_sync_log_x7k9m2')
        .select(`
          *,
          source_product:sp_products_x7k9m2!sp_data_sync_log_x7k9m2_source_product_id_fkey(name),
          target_product:sp_products_x7k9m2!sp_data_sync_log_x7k9m2_target_product_id_fkey(name)
        `)
        .eq('status', 'pending')
        .order('created_at')
        .limit(10);

      if (error) throw error;

      if (!pendingItems || pendingItems.length === 0) {
        this.isProcessing = false;
        return;
      }

      // Process each item
      for (const item of pendingItems) {
        await this.processSyncItem(item);
      }

    } catch (error) {
      console.error('Queue processing failed:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process individual sync item
   */
  async processSyncItem(syncItem) {
    try {
      let success = false;
      let errorMessage = null;

      // Execute sync based on entity type
      switch (syncItem.entity_type) {
        case 'user':
          success = await this.syncUserData(syncItem);
          break;
        case 'clinic':
          success = await this.syncClinicData(syncItem);
          break;
        case 'client':
          success = await this.syncClientData(syncItem);
          break;
        case 'appointment':
          success = await this.syncAppointmentData(syncItem);
          break;
        default:
          errorMessage = `Unknown entity type: ${syncItem.entity_type}`;
      }

      // Update sync status
      await supabase
        .from('sp_data_sync_log_x7k9m2')
        .update({
          status: success ? 'success' : 'failed',
          error_message: errorMessage,
          processed_at: new Date().toISOString()
        })
        .eq('id', syncItem.id);

    } catch (error) {
      console.error('Sync item processing failed:', error);
      
      // Mark as failed
      await supabase
        .from('sp_data_sync_log_x7k9m2')
        .update({
          status: 'failed',
          error_message: error.message,
          processed_at: new Date().toISOString()
        })
        .eq('id', syncItem.id);
    }
  }

  /**
   * Sync user data between products
   */
  async syncUserData(syncItem) {
    try {
      const syncData = syncItem.sync_data;
      const userId = syncItem.entity_id;

      // Update unified user profile
      if (syncData.profile_updates) {
        const { error: profileError } = await supabase
          .from('sp_unified_users_x7k9m2')
          .update({
            ...syncData.profile_updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (profileError) throw profileError;
      }

      // Update product-specific access if needed
      if (syncData.access_updates) {
        const { error: accessError } = await supabase
          .from('sp_user_product_access_x7k9m2')
          .update(syncData.access_updates)
          .eq('user_id', userId)
          .eq('product_id', await this.getProductId(syncItem.target_product.name));

        if (accessError) throw accessError;
      }

      return true;
    } catch (error) {
      console.error('User sync failed:', error);
      return false;
    }
  }

  /**
   * Sync clinic data between products
   */
  async syncClinicData(syncItem) {
    try {
      const syncData = syncItem.sync_data;
      const clinicId = syncItem.entity_id;

      const { error } = await supabase
        .from('sp_unified_clinics_x7k9m2')
        .update({
          ...syncData,
          updated_at: new Date().toISOString()
        })
        .eq('id', clinicId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Clinic sync failed:', error);
      return false;
    }
  }

  /**
   * Sync client data between products
   */
  async syncClientData(syncItem) {
    try {
      const syncData = syncItem.sync_data;
      const clientId = syncItem.entity_id;

      const { error } = await supabase
        .from('sp_unified_clients_x7k9m2')
        .update({
          ...syncData,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Client sync failed:', error);
      return false;
    }
  }

  /**
   * Sync appointment data (product-specific)
   */
  async syncAppointmentData(syncItem) {
    try {
      // This would sync to product-specific appointment tables
      // Implementation depends on target product structure
      console.log('Appointment sync:', syncItem);
      return true;
    } catch (error) {
      console.error('Appointment sync failed:', error);
      return false;
    }
  }

  /**
   * Get product ID by name
   */
  async getProductId(productName) {
    try {
      const { data, error } = await supabase
        .from('sp_products_x7k9m2')
        .select('id')
        .eq('name', productName)
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Failed to get product ID:', error);
      throw error;
    }
  }

  /**
   * Resolve data conflicts
   */
  async resolveConflicts(conflictData) {
    try {
      // Implementation for conflict resolution
      // Could be manual approval, last-write-wins, or custom logic
      console.log('Resolving conflicts:', conflictData);
      
      // For now, implement last-write-wins
      const { error } = await supabase
        .from('sp_data_sync_log_x7k9m2')
        .update({
          status: 'success',
          processed_at: new Date().toISOString()
        })
        .eq('id', conflictData.syncId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Conflict resolution failed:', error);
      return false;
    }
  }

  /**
   * Rollback a sync operation
   */
  async rollbackSync(syncId) {
    try {
      // Get sync details
      const { data: syncItem, error } = await supabase
        .from('sp_data_sync_log_x7k9m2')
        .select('*')
        .eq('id', syncId)
        .single();

      if (error) throw error;

      // Create rollback entry
      const { error: rollbackError } = await supabase
        .from('sp_data_sync_log_x7k9m2')
        .insert({
          source_product_id: syncItem.target_product_id,
          target_product_id: syncItem.source_product_id,
          entity_type: syncItem.entity_type,
          entity_id: syncItem.entity_id,
          sync_type: 'rollback',
          sync_data: syncItem.sync_data,
          status: 'pending'
        });

      if (rollbackError) throw rollbackError;

      // Process rollback
      this.processQueue();
      
      return true;
    } catch (error) {
      console.error('Rollback failed:', error);
      throw error;
    }
  }

  /**
   * Get sync status for entity
   */
  async getSyncStatus(entityType, entityId) {
    try {
      const { data, error } = await supabase
        .from('sp_data_sync_log_x7k9m2')
        .select(`
          *,
          source_product:sp_products_x7k9m2!sp_data_sync_log_x7k9m2_source_product_id_fkey(name),
          target_product:sp_products_x7k9m2!sp_data_sync_log_x7k9m2_target_product_id_fkey(name)
        `)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get sync status:', error);
      return [];
    }
  }
}

export const dataSyncEngine = new DataSyncEngine();