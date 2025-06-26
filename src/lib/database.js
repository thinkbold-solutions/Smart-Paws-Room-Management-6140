// Add GHL tables to existing database.js createTablesIfNotExist method

const ghlTables = [
  {
    name: 'ghl_agency_credentials',
    sql: `
      CREATE TABLE IF NOT EXISTS ghl_agency_credentials (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        expires_at TIMESTAMP WITH TIME ZONE,
        token_type TEXT DEFAULT 'Bearer',
        scope TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Enable RLS
      ALTER TABLE ghl_agency_credentials ENABLE ROW LEVEL SECURITY;
      
      -- Create policy
      CREATE POLICY "Enable all for authenticated users" ON ghl_agency_credentials 
        FOR ALL USING (true);
    `
  },
  {
    name: 'ghl_sub_accounts',
    sql: `
      CREATE TABLE IF NOT EXISTS ghl_sub_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ghl_location_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        business_name TEXT,
        phone TEXT,
        email TEXT,
        website TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        postal_code TEXT,
        country TEXT,
        timezone TEXT,
        active BOOLEAN DEFAULT true,
        last_synced TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Enable RLS
      ALTER TABLE ghl_sub_accounts ENABLE ROW LEVEL SECURITY;
      
      -- Create policy
      CREATE POLICY "Enable all for authenticated users" ON ghl_sub_accounts 
        FOR ALL USING (true);
    `
  },
  {
    name: 'ghl_clinic_mappings',
    sql: `
      CREATE TABLE IF NOT EXISTS ghl_clinic_mappings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        clinic_id UUID REFERENCES sp_clinics_live(id),
        ghl_sub_account_id UUID REFERENCES ghl_sub_accounts(id),
        mapping_type TEXT DEFAULT 'full_sync',
        sync_settings JSONB DEFAULT '{}',
        mapped_by UUID REFERENCES sp_users_live(id),
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(clinic_id, ghl_sub_account_id)
      );

      -- Enable RLS
      ALTER TABLE ghl_clinic_mappings ENABLE ROW LEVEL SECURITY;
      
      -- Create policy
      CREATE POLICY "Enable all for authenticated users" ON ghl_clinic_mappings 
        FOR ALL USING (true);
    `
  },
  {
    name: 'ghl_sync_log',
    sql: `
      CREATE TABLE IF NOT EXISTS ghl_sync_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        clinic_mapping_id UUID REFERENCES ghl_clinic_mappings(id),
        sync_type TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        status TEXT DEFAULT 'pending',
        error_message TEXT,
        sync_data JSONB,
        processed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Enable RLS
      ALTER TABLE ghl_sync_log ENABLE ROW LEVEL SECURITY;
      
      -- Create policy
      CREATE POLICY "Enable all for authenticated users" ON ghl_sync_log 
        FOR ALL USING (true);
    `
  }
];

// Add these tables to the existing tables array in createTablesIfNotExist()
// Also add ghl_contact_id column to sp_clients_live table
const addGHLColumnsSQL = `
  -- Add GHL contact ID to clients table if it doesn't exist
  DO $$ 
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'sp_clients_live' 
      AND column_name = 'ghl_contact_id'
    ) THEN
      ALTER TABLE sp_clients_live 
      ADD COLUMN ghl_contact_id TEXT;
    END IF;
  END $$;
`;