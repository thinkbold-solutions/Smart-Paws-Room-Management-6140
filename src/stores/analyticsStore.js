import { create } from 'zustand';
import supabase from '../lib/supabase';

export const useAnalyticsStore = create((set, get) => ({
  overviewMetrics: null,
  trends: null,
  realTimeData: null,
  loading: false,
  error: null,

  fetchOverviewMetrics: async (clinicId, period = 'week') => {
    set({ loading: true, error: null });
    try {
      // Mock data - replace with actual API calls
      const mockMetrics = {
        roomEfficiency: 78 + Math.floor(Math.random() * 20),
        avgWaitTime: 8 + Math.floor(Math.random() * 15),
        patientThroughput: 45 + Math.floor(Math.random() * 20),
        revenuePerHour: 180 + Math.floor(Math.random() * 40)
      };

      set({ overviewMetrics: mockMetrics, loading: false });
    } catch (error) {
      console.error('Error fetching overview metrics:', error);
      set({ error: error.message, loading: false });
    }
  },

  fetchTrends: async (clinicId, period = 'week') => {
    try {
      // Mock trend data
      const mockTrends = {
        roomEfficiency: Math.floor(Math.random() * 20) - 10, // -10 to +10
        waitTime: Math.floor(Math.random() * 20) - 10,
        throughput: Math.floor(Math.random() * 20) - 5,
        revenue: Math.floor(Math.random() * 25) - 5
      };

      set({ trends: mockTrends });
    } catch (error) {
      console.error('Error fetching trends:', error);
      set({ error: error.message });
    }
  },

  fetchRealTimeData: async (clinicId) => {
    try {
      // Mock real-time data
      const mockRealTimeData = {
        activeRooms: Math.floor(Math.random() * 8) + 2,
        totalRooms: 10,
        currentWaitTime: Math.floor(Math.random() * 30) + 5,
        waitingClients: Math.floor(Math.random() * 8),
        hourlyRevenue: Math.floor(Math.random() * 500) + 200,
        activities: [
          { id: 1, time: '2 min ago', action: 'Room 2 occupied by Dr. Smith', type: 'room' },
          { id: 2, time: '5 min ago', action: 'Client checked in for appointment', type: 'client' },
          { id: 3, time: '8 min ago', action: 'Room 1 marked as available', type: 'room' },
          { id: 4, time: '12 min ago', action: 'Staff member clocked in', type: 'staff' }
        ]
      };

      set({ realTimeData: mockRealTimeData });
    } catch (error) {
      console.error('Error fetching real-time data:', error);
      set({ error: error.message });
    }
  },

  fetchDetailedAnalytics: async (clinicId, type, period = 'week') => {
    set({ loading: true });
    try {
      // This would fetch specific analytics based on type
      // Types: 'appointments', 'rooms', 'staff', 'revenue', etc.
      
      // Mock implementation
      const mockDetailedData = {
        appointments: {
          byHour: Array.from({ length: 12 }, (_, i) => ({
            hour: `${i + 8}:00`,
            count: Math.floor(Math.random() * 15) + 1
          })),
          byType: [
            { type: 'Routine Checkup', count: 45, percentage: 60 },
            { type: 'Vaccination', count: 15, percentage: 20 },
            { type: 'Emergency', count: 8, percentage: 11 },
            { type: 'Surgery', count: 7, percentage: 9 }
          ]
        },
        rooms: Array.from({ length: 6 }, (_, i) => ({
          id: `room-${i + 1}`,
          name: `Room ${i + 1}`,
          utilization: Math.floor(Math.random() * 40) + 60,
          avgDuration: Math.floor(Math.random() * 30) + 30,
          efficiency: Math.floor(Math.random() * 20) + 80
        }))
      };

      set({ loading: false });
      return mockDetailedData[type] || null;
    } catch (error) {
      console.error('Error fetching detailed analytics:', error);
      set({ error: error.message, loading: false });
      return null;
    }
  },

  generateReport: async (clinicId, type, period, format = 'json') => {
    set({ loading: true });
    try {
      // Generate comprehensive report
      const report = {
        clinicId,
        type,
        period,
        generatedAt: new Date().toISOString(),
        data: {
          summary: get().overviewMetrics,
          trends: get().trends,
          // Additional report data would be fetched here
        }
      };

      set({ loading: false });
      return report;
    } catch (error) {
      console.error('Error generating report:', error);
      set({ error: error.message, loading: false });
      return null;
    }
  },

  clearError: () => set({ error: null })
}));