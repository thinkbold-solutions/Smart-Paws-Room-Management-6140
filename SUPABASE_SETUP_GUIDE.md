# 🚀 Supabase Setup Guide for Smart Paws

## 📋 **Step 1: Create Supabase Project**

1. **Go to [Supabase](https://supabase.com)**
2. **Sign up/Login** to your account
3. **Click "New Project"**
4. **Fill in project details:**
   - Project Name: `smart-paws-room-management`
   - Organization: Choose your organization
   - Password: Create a strong database password
   - Region: Choose closest to your location

## 🔑 **Step 2: Get Your Credentials**

1. **Go to Settings > API** in your Supabase dashboard
2. **Copy these values:**
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon/public key**: `eyJhbGc...` (long string)

## ⚙️ **Step 3: Configure the App**

**Update `src/lib/supabase.js`:**

```javascript
const SUPABASE_URL = 'https://your-project-id.supabase.co'  // ← Paste your URL here
const SUPABASE_ANON_KEY = 'your-anon-key-here'              // ← Paste your key here
```

## 🗄️ **Step 4: Create Database Tables**

**Option A: Automatic Setup (Recommended)**
1. Update your credentials in `supabase.js`
2. Refresh the app
3. The app will automatically create all tables

**Option B: Manual SQL Setup**
Run this SQL in your Supabase SQL Editor:

```sql
-- Create Organizations Table
CREATE TABLE IF NOT EXISTS sp_organizations_live (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT,
  subscription_tier TEXT DEFAULT 'basic',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Clinics Table
CREATE TABLE IF NOT EXISTS sp_clinics_live (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES sp_organizations_live(id),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  settings JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Users Table
CREATE TABLE IF NOT EXISTS sp_users_live (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES sp_organizations_live(id),
  clinic_id UUID REFERENCES sp_clinics_live(id),
  auth_id TEXT,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'clinic_user',
  status TEXT DEFAULT 'active',
  last_login TIMESTAMP WITH TIME ZONE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Rooms Table
CREATE TABLE IF NOT EXISTS sp_rooms_live (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES sp_clinics_live(id),
  room_number TEXT NOT NULL,
  room_name TEXT,
  room_type TEXT DEFAULT 'examination',
  status TEXT DEFAULT 'available',
  capacity INTEGER DEFAULT 1,
  equipment JSONB DEFAULT '[]',
  notes TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Clients Table
CREATE TABLE IF NOT EXISTS sp_clients_live (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES sp_clinics_live(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Pets Table
CREATE TABLE IF NOT EXISTS sp_pets_live (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES sp_clients_live(id),
  name TEXT NOT NULL,
  species TEXT,
  breed TEXT,
  age INTEGER,
  weight DECIMAL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Appointments Table
CREATE TABLE IF NOT EXISTS sp_appointments_live (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES sp_clinics_live(id),
  client_id UUID REFERENCES sp_clients_live(id),
  pet_id UUID REFERENCES sp_pets_live(id),
  room_id UUID REFERENCES sp_rooms_live(id),
  staff_id UUID REFERENCES sp_users_live(id),
  appointment_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status TEXT DEFAULT 'scheduled',
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Waiting Queue Table
CREATE TABLE IF NOT EXISTS sp_waiting_queue_live (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES sp_clinics_live(id),
  client_id UUID REFERENCES sp_clients_live(id),
  pet_id UUID REFERENCES sp_pets_live(id),
  check_in_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT,
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'waiting',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Room Assignments Table
CREATE TABLE IF NOT EXISTS sp_room_assignments_live (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES sp_rooms_live(id),
  staff_id UUID REFERENCES sp_users_live(id),
  appointment_id UUID REFERENCES sp_appointments_live(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unassigned_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE sp_organizations_live ENABLE ROW LEVEL SECURITY;
ALTER TABLE sp_clinics_live ENABLE ROW LEVEL SECURITY;
ALTER TABLE sp_users_live ENABLE ROW LEVEL SECURITY;
ALTER TABLE sp_rooms_live ENABLE ROW LEVEL SECURITY;
ALTER TABLE sp_clients_live ENABLE ROW LEVEL SECURITY;
ALTER TABLE sp_pets_live ENABLE ROW LEVEL SECURITY;
ALTER TABLE sp_appointments_live ENABLE ROW LEVEL SECURITY;
ALTER TABLE sp_waiting_queue_live ENABLE ROW LEVEL SECURITY;
ALTER TABLE sp_room_assignments_live ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (Allow all for development - adjust for production)
CREATE POLICY "Enable all for authenticated users" ON sp_organizations_live FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON sp_clinics_live FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON sp_users_live FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON sp_rooms_live FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON sp_clients_live FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON sp_pets_live FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON sp_appointments_live FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON sp_waiting_queue_live FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON sp_room_assignments_live FOR ALL USING (true);

-- Insert Sample Data
INSERT INTO sp_organizations_live (name, domain) 
VALUES ('Smart Paws Demo Organization', 'smartpaws.demo')
ON CONFLICT DO NOTHING;

-- Get the organization ID for subsequent inserts
DO $$
DECLARE
    org_id UUID;
    clinic1_id UUID;
    clinic2_id UUID;
BEGIN
    SELECT id INTO org_id FROM sp_organizations_live WHERE domain = 'smartpaws.demo';
    
    -- Insert Clinics
    INSERT INTO sp_clinics_live (organization_id, name, address, phone, email) 
    VALUES 
        (org_id, 'Downtown Vet Clinic', '123 Main St, Downtown, NY 10001', '(555) 123-4567', 'info@downtownvet.com'),
        (org_id, 'Westside Animal Hospital', '456 Oak Ave, Westside, NY 10002', '(555) 987-6543', 'contact@westsideanimal.com')
    ON CONFLICT DO NOTHING;
    
    SELECT id INTO clinic1_id FROM sp_clinics_live WHERE name = 'Downtown Vet Clinic';
    SELECT id INTO clinic2_id FROM sp_clinics_live WHERE name = 'Westside Animal Hospital';
    
    -- Insert Users
    INSERT INTO sp_users_live (organization_id, clinic_id, email, first_name, last_name, role, phone) 
    VALUES 
        (org_id, clinic1_id, 'admin@smartpaws.demo', 'Admin', 'User', 'agency_admin', '(555) 000-0001'),
        (org_id, clinic1_id, 'sarah.johnson@downtownvet.com', 'Dr. Sarah', 'Johnson', 'clinic_admin', '(555) 123-4567'),
        (org_id, clinic1_id, 'mike.rodriguez@downtownvet.com', 'Mike', 'Rodriguez', 'clinic_user', '(555) 987-6543'),
        (org_id, clinic2_id, 'emily.chen@westsidevets.com', 'Emily', 'Chen', 'clinic_admin', '(555) 456-7890')
    ON CONFLICT (email) DO NOTHING;
    
    -- Insert Rooms
    INSERT INTO sp_rooms_live (clinic_id, room_number, room_name, room_type, status) 
    VALUES 
        (clinic1_id, '1', 'Exam Room 1', 'examination', 'available'),
        (clinic1_id, '2', 'Exam Room 2', 'examination', 'available'),
        (clinic1_id, '3', 'Surgery Room', 'surgery', 'available'),
        (clinic2_id, '1', 'Exam Room A', 'examination', 'available'),
        (clinic2_id, '2', 'Exam Room B', 'examination', 'occupied')
    ON CONFLICT DO NOTHING;
END $$;
```

## ✅ **Step 5: Verify Setup**

1. **Refresh your app**
2. **Click "Debug DB"** button
3. **Check console** for success messages
4. **Users should now load** successfully

## 🔧 **Troubleshooting**

### **Common Issues:**

**❌ "relation does not exist"**
- Solution: Run the SQL setup above

**❌ "Invalid API key"** 
- Solution: Double-check your anon key

**❌ "Network error"**
- Solution: Check your project URL format

**❌ "Permission denied"**
- Solution: Ensure RLS policies are created

### **Quick Test:**
```javascript
// Test in browser console:
console.log('Testing Supabase connection...');
```

## 🎯 **Expected Results**

After setup, you should see:
- ✅ All 9 tables created
- ✅ Sample data inserted
- ✅ Users loading successfully
- ✅ Real-time updates working

## 📞 **Need Help?**

If you encounter issues:
1. Check the browser console for detailed error logs
2. Verify your Supabase credentials
3. Ensure tables are created in your Supabase dashboard
4. Check that RLS policies allow access