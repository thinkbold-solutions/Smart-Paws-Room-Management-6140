import { ghlApiService } from './ghlApiService';
import supabase from '../lib/supabase';
import { dbManager } from '../lib/database';

export class GHLSyncService {
  constructor() {
    this.syncQueue = [];
    this.isProcessing = false;
    this.batchSize = 50;
  }

  // Phase 2: Bidirectional sync between Smart Paws and GHL
  async syncClinicContacts(clinicId, direction = 'both') {
    try {
      dbManager.log('info', `🔄 Starting contact sync for clinic: ${clinicId}`);
      
      // Get clinic mapping
      const mapping = await this.getClinicMapping(clinicId);
      if (!mapping) {
        throw new Error('No GHL mapping found for this clinic');
      }

      let syncResults = {
        imported: 0,
        exported: 0,
        updated: 0,
        errors: []
      };

      // Import from GHL to Smart Paws
      if (direction === 'import' || direction === 'both') {
        const importResults = await this.importContactsFromGHL(mapping);
        syncResults.imported = importResults.imported;
        syncResults.errors.push(...importResults.errors);
      }

      // Export from Smart Paws to GHL
      if (direction === 'export' || direction === 'both') {
        const exportResults = await this.exportContactsToGHL(mapping);
        syncResults.exported = exportResults.exported;
        syncResults.updated = exportResults.updated;
        syncResults.errors.push(...exportResults.errors);
      }

      // Log sync completion
      await this.logSyncActivity(mapping.id, 'contact_sync', 'success', {
        direction,
        results: syncResults
      });

      dbManager.log('info', '✅ Contact sync completed', syncResults);
      return syncResults;

    } catch (error) {
      dbManager.log('error', 'Contact sync failed', error);
      throw error;
    }
  }

  // Import contacts from GHL to Smart Paws
  async importContactsFromGHL(mapping) {
    try {
      dbManager.log('info', `📥 Importing contacts from GHL location: ${mapping.ghl_sub_account.ghl_location_id}`);
      
      let imported = 0;
      let errors = [];
      let startAfter = null;
      let hasMore = true;

      while (hasMore) {
        try {
          // Get contacts from GHL
          const ghlContacts = await ghlApiService.getLocationContacts(
            mapping.ghl_sub_account.ghl_location_id,
            this.batchSize,
            startAfter
          );

          if (ghlContacts.length === 0) {
            hasMore = false;
            break;
          }

          // Process batch
          for (const ghlContact of ghlContacts) {
            try {
              await this.importSingleContact(ghlContact, mapping.clinic_id);
              imported++;
            } catch (error) {
              errors.push({
                contact: ghlContact.email,
                error: error.message
              });
            }
          }

          // Set pagination for next batch
          if (ghlContacts.length < this.batchSize) {
            hasMore = false;
          } else {
            startAfter = ghlContacts[ghlContacts.length - 1].id;
          }

          // Rate limiting pause
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          dbManager.log('error', 'Batch import failed', error);
          errors.push({ batch: 'unknown', error: error.message });
          hasMore = false;
        }
      }

      return { imported, errors };
    } catch (error) {
      dbManager.log('error', 'Import from GHL failed', error);
      throw error;
    }
  }

  // Import single contact from GHL
  async importSingleContact(ghlContact, clinicId) {
    try {
      // Check if contact already exists
      const { data: existingClient } = await supabase
        .from('sp_clients_live')
        .select('id')
        .eq('email', ghlContact.email)
        .eq('clinic_id', clinicId)
        .single();

      const clientData = {
        clinic_id: clinicId,
        first_name: ghlContact.firstName || '',
        last_name: ghlContact.lastName || '',
        email: ghlContact.email,
        phone: ghlContact.phone,
        address: this.formatAddress(ghlContact),
        ghl_contact_id: ghlContact.id,
        notes: `Imported from GoHighLevel on ${new Date().toISOString()}`,
        updated_at: new Date().toISOString()
      };

      if (existingClient) {
        // Update existing client
        const { error } = await supabase
          .from('sp_clients_live')
          .update(clientData)
          .eq('id', existingClient.id);

        if (error) throw error;
        dbManager.log('debug', `Updated existing client: ${ghlContact.email}`);
      } else {
        // Create new client
        const { error } = await supabase
          .from('sp_clients_live')
          .insert(clientData);

        if (error) throw error;
        dbManager.log('debug', `Created new client: ${ghlContact.email}`);
      }

      return true;
    } catch (error) {
      dbManager.log('error', `Failed to import contact ${ghlContact.email}`, error);
      throw error;
    }
  }

  // Export contacts from Smart Paws to GHL
  async exportContactsToGHL(mapping) {
    try {
      dbManager.log('info', `📤 Exporting contacts to GHL location: ${mapping.ghl_sub_account.ghl_location_id}`);
      
      let exported = 0;
      let updated = 0;
      let errors = [];

      // Get all clients from Smart Paws clinic
      const { data: clients, error } = await supabase
        .from('sp_clients_live')
        .select('*')
        .eq('clinic_id', mapping.clinic_id)
        .order('created_at');

      if (error) throw error;

      // Process in batches
      for (let i = 0; i < clients.length; i += this.batchSize) {
        const batch = clients.slice(i, i + this.batchSize);
        
        for (const client of batch) {
          try {
            if (client.ghl_contact_id) {
              // Update existing GHL contact
              await this.updateGHLContact(client, mapping.ghl_sub_account.ghl_location_id);
              updated++;
            } else {
              // Create new GHL contact
              await this.createGHLContact(client, mapping.ghl_sub_account.ghl_location_id);
              exported++;
            }
          } catch (error) {
            errors.push({
              client: client.email,
              error: error.message
            });
          }
        }

        // Rate limiting pause between batches
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      return { exported, updated, errors };
    } catch (error) {
      dbManager.log('error', 'Export to GHL failed', error);
      throw error;
    }
  }

  // Create contact in GHL
  async createGHLContact(client, locationId) {
    try {
      const contactData = {
        firstName: client.first_name,
        lastName: client.last_name,
        email: client.email,
        phone: client.phone,
        address: client.address,
        tags: ['veterinary-client', 'smart-paws-sync'],
        customFields: {
          'smart_paws_id': client.id,
          'sync_date': new Date().toISOString()
        }
      };

      const ghlContact = await ghlApiService.createContact(locationId, contactData);
      
      // Update Smart Paws client with GHL contact ID
      await supabase
        .from('sp_clients_live')
        .update({ ghl_contact_id: ghlContact.id })
        .eq('id', client.id);

      dbManager.log('debug', `Created GHL contact for: ${client.email}`);
      return ghlContact;
    } catch (error) {
      dbManager.log('error', `Failed to create GHL contact for ${client.email}`, error);
      throw error;
    }
  }

  // Update contact in GHL
  async updateGHLContact(client, locationId) {
    try {
      const contactData = {
        firstName: client.first_name,
        lastName: client.last_name,
        email: client.email,
        phone: client.phone,
        address1: client.address,
        customFields: {
          'smart_paws_id': client.id,
          'last_sync_date': new Date().toISOString()
        }
      };

      await ghlApiService.updateContact(locationId, client.ghl_contact_id, contactData);
      dbManager.log('debug', `Updated GHL contact for: ${client.email}`);
      return true;
    } catch (error) {
      dbManager.log('error', `Failed to update GHL contact for ${client.email}`, error);
      throw error;
    }
  }

  // Get clinic mapping
  async getClinicMapping(clinicId) {
    try {
      const { data, error } = await supabase
        .from('ghl_clinic_mappings')
        .select(`
          *,
          ghl_sub_account:ghl_sub_accounts(*)
        `)
        .eq('clinic_id', clinicId)
        .eq('active', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      dbManager.log('error', 'Failed to get clinic mapping', error);
      return null;
    }
  }

  // Log sync activity
  async logSyncActivity(mappingId, syncType, status, data) {
    try {
      const { error } = await supabase
        .from('ghl_sync_log')
        .insert({
          clinic_mapping_id: mappingId,
          sync_type: syncType,
          entity_type: 'contact',
          status: status,
          sync_data: data,
          processed_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      dbManager.log('error', 'Failed to log sync activity', error);
    }
  }

  // Helper: Format address from GHL contact
  formatAddress(ghlContact) {
    const parts = [
      ghlContact.address1,
      ghlContact.city,
      ghlContact.state,
      ghlContact.postalCode
    ].filter(Boolean);
    
    return parts.join(', ');
  }

  // Get sync status for clinic
  async getSyncStatus(clinicId) {
    try {
      const { data, error } = await supabase
        .from('ghl_sync_log')
        .select(`
          *,
          clinic_mapping:ghl_clinic_mappings(
            clinic:sp_clinics_live(name)
          )
        `)
        .eq('clinic_mapping.clinic_id', clinicId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      dbManager.log('error', 'Failed to get sync status', error);
      return [];
    }
  }

  // Manual trigger for sync
  async triggerManualSync(clinicId, direction = 'both') {
    try {
      dbManager.log('info', `🚀 Manual sync triggered for clinic: ${clinicId}`);
      return await this.syncClinicContacts(clinicId, direction);
    } catch (error) {
      dbManager.log('error', 'Manual sync failed', error);
      throw error;
    }
  }
}

export const ghlSyncService = new GHLSyncService();