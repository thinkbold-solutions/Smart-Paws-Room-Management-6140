import { create } from 'zustand';
import supabase from '../lib/supabase';
import { liveDataService, dbManager } from '../lib/database';

export const useRoomStore = create((set, get) => ({
  rooms: [],
  appointments: [],
  waitingClients: [],
  loading: false,
  subscriptions: [],
  lastFetched: null,

  // Fetch rooms with comprehensive live data
  fetchRooms: async (clinicId) => {
    set({ loading: true });
    try {
      dbManager.log('info', `🏠 Fetching rooms for clinic: ${clinicId}`);
      
      const { data, error } = await supabase
        .from('sp_rooms_live')
        .select(`
          *,
          room_assignments:sp_room_assignments_live!sp_room_assignments_live_room_id_fkey(
            *,
            staff:sp_users_live(*),
            appointments:sp_appointments_live(
              *,
              clients:sp_clients_live(*),
              pets:sp_pets_live(*)
            )
          )
        `)
        .eq('clinic_id', clinicId)
        .order('room_number');

      if (error) {
        dbManager.log('error', 'Failed to fetch rooms', error);
        throw error;
      }

      // Filter out completed assignments
      const roomsWithActiveAssignments = data.map(room => ({
        ...room,
        room_assignments: room.room_assignments?.filter(assignment => !assignment.unassigned_at) || []
      }));

      set({ 
        rooms: roomsWithActiveAssignments || [], 
        loading: false,
        lastFetched: new Date()
      });

      dbManager.log('info', `✅ Fetched ${roomsWithActiveAssignments.length} rooms with live assignments`);

      // Set up real-time subscription if not already subscribed
      const existingSubscription = get().subscriptions.find(sub => sub.topic?.includes('rooms'));
      if (!existingSubscription) {
        const subscription = await liveDataService.subscribeToTable(
          'sp_rooms_live',
          (payload) => {
            dbManager.log('info', '🔄 Room real-time update received', payload);
            get().fetchRooms(clinicId); // Refresh data on change
          },
          { column: 'clinic_id', value: clinicId }
        );

        if (subscription) {
          set(state => ({
            subscriptions: [...state.subscriptions, subscription]
          }));
        }
      }

    } catch (error) {
      dbManager.log('error', 'Error fetching rooms:', error);
      set({ rooms: [], loading: false });
    }
  },

  // Fetch appointments with live data
  fetchAppointments: async (clinicId, date = new Date()) => {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      dbManager.log('info', `📅 Fetching appointments for clinic: ${clinicId} on ${date.toDateString()}`);

      const { data, error } = await supabase
        .from('sp_appointments_live')
        .select(`
          *,
          clients:sp_clients_live(*),
          pets:sp_pets_live(*),
          rooms:sp_rooms_live(*),
          staff:sp_users_live(*)
        `)
        .eq('clinic_id', clinicId)
        .gte('appointment_time', startOfDay.toISOString())
        .lte('appointment_time', endOfDay.toISOString())
        .order('appointment_time');

      if (error) {
        dbManager.log('error', 'Failed to fetch appointments', error);
        throw error;
      }

      set({ 
        appointments: data || [],
        lastFetched: new Date()
      });

      dbManager.log('info', `✅ Fetched ${data?.length || 0} appointments for today`);

      // Set up real-time subscription for appointments
      const existingSubscription = get().subscriptions.find(sub => sub.topic?.includes('appointments'));
      if (!existingSubscription) {
        const subscription = await liveDataService.subscribeToTable(
          'sp_appointments_live',
          (payload) => {
            dbManager.log('info', '🔄 Appointment real-time update received', payload);
            get().fetchAppointments(clinicId, date);
          },
          { column: 'clinic_id', value: clinicId }
        );

        if (subscription) {
          set(state => ({
            subscriptions: [...state.subscriptions, subscription]
          }));
        }
      }

    } catch (error) {
      dbManager.log('error', 'Error fetching appointments:', error);
      set({ appointments: [] });
    }
  },

  // Fetch waiting clients with live data
  fetchWaitingClients: async (clinicId) => {
    try {
      dbManager.log('info', `⏳ Fetching waiting clients for clinic: ${clinicId}`);

      const { data, error } = await supabase
        .from('sp_waiting_queue_live')
        .select(`
          *,
          clients:sp_clients_live(*),
          pets:sp_pets_live(*)
        `)
        .eq('clinic_id', clinicId)
        .eq('status', 'waiting')
        .order('check_in_time');

      if (error) {
        dbManager.log('error', 'Failed to fetch waiting clients', error);
        throw error;
      }

      set({ 
        waitingClients: data || [],
        lastFetched: new Date()
      });

      dbManager.log('info', `✅ Fetched ${data?.length || 0} waiting clients`);

      // Set up real-time subscription for waiting queue
      const existingSubscription = get().subscriptions.find(sub => sub.topic?.includes('waiting'));
      if (!existingSubscription) {
        const subscription = await liveDataService.subscribeToTable(
          'sp_waiting_queue_live',
          (payload) => {
            dbManager.log('info', '🔄 Waiting queue real-time update received', payload);
            get().fetchWaitingClients(clinicId);
          },
          { column: 'clinic_id', value: clinicId }
        );

        if (subscription) {
          set(state => ({
            subscriptions: [...state.subscriptions, subscription]
          }));
        }
      }

    } catch (error) {
      dbManager.log('error', 'Error fetching waiting clients:', error);
      set({ waitingClients: [] });
    }
  },

  // Update room status with optimistic updates and real-time sync
  updateRoomStatus: async (roomId, status, notes = '') => {
    try {
      dbManager.log('info', `🏠 Updating room ${roomId} status to: ${status}`);

      // Optimistic update
      const { rooms } = get();
      const updatedRooms = rooms.map(room =>
        room.id === roomId ? { ...room, status, notes, last_updated: new Date().toISOString() } : room
      );
      set({ rooms: updatedRooms });

      const { data, error } = await supabase
        .from('sp_rooms_live')
        .update({
          status,
          last_updated: new Date().toISOString(),
          notes
        })
        .eq('id', roomId)
        .select()
        .single();

      if (error) {
        dbManager.log('error', 'Failed to update room status', error);
        // Revert optimistic update on error
        set({ rooms });
        throw error;
      }

      dbManager.log('info', `✅ Room ${roomId} status updated to: ${status}`);
      return data;

    } catch (error) {
      dbManager.log('error', 'Error updating room status:', error);
      throw error;
    }
  },

  // Assign staff to room with real-time sync
  assignStaffToRoom: async (roomId, staffId, appointmentId = null) => {
    try {
      dbManager.log('info', `👨‍⚕️ Assigning staff ${staffId} to room ${roomId}`);

      // First, unassign any current staff from this room
      await supabase
        .from('sp_room_assignments_live')
        .update({ unassigned_at: new Date().toISOString() })
        .eq('room_id', roomId)
        .is('unassigned_at', null);

      // Create new assignment
      const { data, error } = await supabase
        .from('sp_room_assignments_live')
        .insert({
          room_id: roomId,
          staff_id: staffId,
          appointment_id: appointmentId,
          assigned_at: new Date().toISOString()
        })
        .select(`
          *,
          staff:sp_users_live(*),
          appointments:sp_appointments_live(
            *,
            clients:sp_clients_live(*),
            pets:sp_pets_live(*)
          )
        `)
        .single();

      if (error) {
        dbManager.log('error', 'Failed to assign staff to room', error);
        throw error;
      }

      // Update room status to occupied
      await get().updateRoomStatus(roomId, 'occupied');

      dbManager.log('info', `✅ Staff assigned to room successfully`);
      return data;

    } catch (error) {
      dbManager.log('error', 'Error assigning staff to room:', error);
      throw error;
    }
  },

  // Move client to room with real-time sync
  moveClientToRoom: async (waitingClientId, roomId, staffId) => {
    try {
      dbManager.log('info', `🏥 Moving client ${waitingClientId} to room ${roomId}`);

      // Get waiting client details
      const { data: waitingClient, error: clientError } = await supabase
        .from('sp_waiting_queue_live')
        .select('*')
        .eq('id', waitingClientId)
        .single();

      if (clientError) {
        dbManager.log('error', 'Failed to get waiting client', clientError);
        throw clientError;
      }

      // Update waiting client status
      await supabase
        .from('sp_waiting_queue_live')
        .update({ status: 'in_room' })
        .eq('id', waitingClientId);

      // Create room assignment
      await get().assignStaffToRoom(roomId, staffId);

      // Update room status
      await get().updateRoomStatus(roomId, 'occupied');

      dbManager.log('info', `✅ Client moved to room successfully`);
      return { success: true };

    } catch (error) {
      dbManager.log('error', 'Error moving client to room:', error);
      throw error;
    }
  },

  // Add to waiting queue with real-time sync
  addToWaitingQueue: async (clinicId, clientData, petData, reason, priority = 'normal') => {
    try {
      dbManager.log('info', `⏳ Adding client to waiting queue: ${clientData.first_name} ${clientData.last_name}`);

      const { data, error } = await supabase
        .from('sp_waiting_queue_live')
        .insert({
          clinic_id: clinicId,
          client_id: clientData.id,
          pet_id: petData.id,
          check_in_time: new Date().toISOString(),
          reason,
          priority,
          status: 'waiting'
        })
        .select(`
          *,
          clients:sp_clients_live(*),
          pets:sp_pets_live(*)
        `)
        .single();

      if (error) {
        dbManager.log('error', 'Failed to add to waiting queue', error);
        throw error;
      }

      // Optimistic update
      const { waitingClients } = get();
      set({ waitingClients: [...waitingClients, data] });

      dbManager.log('info', `✅ Client added to waiting queue successfully`);
      return data;

    } catch (error) {
      dbManager.log('error', 'Error adding to waiting queue:', error);
      throw error;
    }
  },

  // Create new appointment with real-time sync
  createAppointment: async (appointmentData) => {
    try {
      dbManager.log('info', `📅 Creating new appointment for: ${appointmentData.client_id}`);

      const { data, error } = await supabase
        .from('sp_appointments_live')
        .insert({
          ...appointmentData,
          created_at: new Date().toISOString()
        })
        .select(`
          *,
          clients:sp_clients_live(*),
          pets:sp_pets_live(*),
          rooms:sp_rooms_live(*),
          staff:sp_users_live(*)
        `)
        .single();

      if (error) {
        dbManager.log('error', 'Failed to create appointment', error);
        throw error;
      }

      // Optimistic update
      const { appointments } = get();
      set({ appointments: [...appointments, data] });

      dbManager.log('info', `✅ Appointment created successfully`);
      return data;

    } catch (error) {
      dbManager.log('error', 'Error creating appointment:', error);
      throw error;
    }
  },

  // Get real-time status
  getRealTimeStatus: () => {
    const { subscriptions, lastFetched } = get();
    return {
      isConnected: subscriptions.length > 0,
      subscriptionCount: subscriptions.length,
      lastFetched: lastFetched
    };
  },

  // Force refresh all data
  refreshAllData: async (clinicId) => {
    if (!clinicId) return;
    
    dbManager.log('info', '🔄 Force refreshing all clinic data');
    await Promise.all([
      get().fetchRooms(clinicId),
      get().fetchAppointments(clinicId),
      get().fetchWaitingClients(clinicId)
    ]);
  },

  // Cleanup subscriptions
  cleanup: async () => {
    const { subscriptions } = get();
    dbManager.log('info', `🧹 Cleaning up ${subscriptions.length} subscriptions`);
    
    for (const subscription of subscriptions) {
      await liveDataService.unsubscribe(subscription);
    }
    
    set({ subscriptions: [] });
  }
}));