// Database migration utilities for safe integration
export class SmartPawsMigration {
  constructor(supabase) {
    this.supabase = supabase;
    this.tablePrefix = 'sp_';
  }

  async checkExistingTables() {
    try {
      const { data, error } = await this.supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
      
      if (error) throw error;
      
      return data.map(table => table.table_name);
    } catch (error) {
      console.error('Error checking existing tables:', error);
      return [];
    }
  }

  async createTablesIfNotExist() {
    const existingTables = await this.checkExistingTables();
    const requiredTables = [
      'sp_clinics',
      'sp_rooms',
      'sp_appointments',
      'sp_staff',
      'sp_waiting_queue'
    ];

    const tablesToCreate = requiredTables.filter(
      table => !existingTables.includes(table)
    );

    for (const table of tablesToCreate) {
      await this.createTable(table);
    }
  }

  async createTable(tableName) {
    const migrations = {
      sp_clinics: `
        CREATE TABLE IF NOT EXISTS sp_clinics (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          address TEXT,
          phone TEXT,
          email TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `,
      sp_rooms: `
        CREATE TABLE IF NOT EXISTS sp_rooms (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          clinic_id UUID REFERENCES sp_clinics(id),
          room_number TEXT NOT NULL,
          room_name TEXT,
          room_type TEXT DEFAULT 'examination',
          status TEXT DEFAULT 'available',
          capacity INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `
      // Add more table definitions as needed
    };

    try {
      const { error } = await this.supabase.rpc('exec_sql', {
        sql: migrations[tableName]
      });
      
      if (error) throw error;
      console.log(`Created table: ${tableName}`);
    } catch (error) {
      console.error(`Error creating table ${tableName}:`, error);
    }
  }

  async setupRLS() {
    // Set up Row Level Security policies
    const policies = [
      `ALTER TABLE sp_clinics ENABLE ROW LEVEL SECURITY;`,
      `CREATE POLICY "Users can view their clinics" ON sp_clinics 
       FOR SELECT USING (true);`, // Adjust based on your auth system
    ];

    for (const policy of policies) {
      try {
        await this.supabase.rpc('exec_sql', { sql: policy });
      } catch (error) {
        console.error('Error setting up RLS:', error);
      }
    }
  }
}