import { createClient } from '@supabase/supabase-js'
import supabase from './supabase'

// Database Manager Class
export class DatabaseManager {
  constructor() {
    this.client = supabase
    this.initialized = false
  }

  // Logging utility
  log(level, message, data = null) {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`
    
    if (data) {
      console.log(logMessage, data)
    } else {
      console.log(logMessage)
    }
  }

  // Initialize database
  async initialize() {
    try {
      this.log('info', '🚀 Initializing database manager...')
      
      // Test basic connection
      const { data, error } = await this.client
        .from('sp_organizations_live')
        .select('id')
        .limit(1)

      if (error) {
        this.log('error', 'Database connection test failed', error)
        return false
      }

      this.initialized = true
      this.log('info', '✅ Database manager initialized successfully')
      return true
    } catch (error) {
      this.log('error', '❌ Database initialization failed', error)
      return false
    }
  }

  // Get or create organization
  async getOrganization() {
    try {
      // Try to get existing organization
      let { data: org, error } = await this.client
        .from('sp_organizations_live')
        .select('*')
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (!org) {
        // Create default organization
        const { data: newOrg, error: createError } = await this.client
          .from('sp_organizations_live')
          .insert({
            name: 'Smart Paws Demo Organization',
            domain: 'smartpaws.demo'
          })
          .select()
          .single()

        if (createError) throw createError
        org = newOrg
        this.log('info', '✅ Created default organization', org)
      }

      return org
    } catch (error) {
      this.log('error', '❌ Failed to get/create organization', error)
      throw error
    }
  }

  // Test database queries
  async testQueries() {
    try {
      this.log('info', '🧪 Testing database queries...')
      
      const tests = [
        { table: 'sp_organizations_live', name: 'Organizations' },
        { table: 'sp_clinics_live', name: 'Clinics' },
        { table: 'sp_users_live', name: 'Users' },
        { table: 'sp_rooms_live', name: 'Rooms' }
      ]

      for (const test of tests) {
        try {
          const { data, error } = await this.client
            .from(test.table)
            .select('id')
            .limit(1)

          if (error) {
            this.log('warn', `⚠️ ${test.name} table test failed`, error)
          } else {
            this.log('info', `✅ ${test.name} table accessible`)
          }
        } catch (error) {
          this.log('warn', `⚠️ ${test.name} table error`, error)
        }
      }

      this.log('info', '✅ Database query tests completed')
      return true
    } catch (error) {
      this.log('error', '❌ Database query tests failed', error)
      return false
    }
  }

  // Debug database state
  async debugDatabaseState() {
    try {
      this.log('info', '🔍 Starting database debug...')
      
      const debugInfo = {
        timestamp: new Date().toISOString(),
        connection: 'unknown',
        tables: {},
        errors: []
      }

      // Test connection
      try {
        const { data, error } = await this.client
          .from('sp_organizations_live')
          .select('count')
          .limit(1)

        debugInfo.connection = error ? 'failed' : 'success'
      } catch (error) {
        debugInfo.connection = 'failed'
        debugInfo.errors.push(error.message)
      }

      this.log('info', '🔍 Database debug completed', debugInfo)
      return debugInfo
    } catch (error) {
      this.log('error', '❌ Database debug failed', error)
      return { error: error.message }
    }
  }
}

// Live Data Service
export class LiveDataService {
  constructor() {
    this.subscriptions = new Map()
    this.dbManager = new DatabaseManager()
  }

  async initialize() {
    return await this.dbManager.initialize()
  }

  async subscribeToTable(tableName, callback, filter = null) {
    try {
      const channelName = `${tableName}_${Date.now()}`
      
      let channel = supabase.channel(channelName)
      
      const config = {
        event: '*',
        schema: 'public',
        table: tableName
      }

      if (filter) {
        config.filter = `${filter.column}=eq.${filter.value}`
      }

      channel = channel.on('postgres_changes', config, callback)
      
      const subscription = await channel.subscribe()
      
      this.subscriptions.set(channelName, {
        subscription,
        channel,
        tableName,
        callback
      })

      this.dbManager.log('info', `✅ Subscribed to ${tableName}`)
      return { id: channelName, subscription }
    } catch (error) {
      this.dbManager.log('error', `❌ Failed to subscribe to ${tableName}`, error)
      return null
    }
  }

  async unsubscribe(subscriptionInfo) {
    try {
      if (subscriptionInfo && subscriptionInfo.id) {
        const sub = this.subscriptions.get(subscriptionInfo.id)
        if (sub) {
          await supabase.removeChannel(sub.channel)
          this.subscriptions.delete(subscriptionInfo.id)
          this.dbManager.log('info', `✅ Unsubscribed from ${sub.tableName}`)
        }
      }
    } catch (error) {
      this.dbManager.log('error', '❌ Failed to unsubscribe', error)
    }
  }

  async testQueries() {
    return await this.dbManager.testQueries()
  }
}

// Export singleton instances
export const dbManager = new DatabaseManager()
export const liveDataService = new LiveDataService()

// Default export
export default {
  dbManager,
  liveDataService,
  DatabaseManager,
  LiveDataService
}