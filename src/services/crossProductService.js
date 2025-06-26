import supabase from '../lib/supabase';

export class CrossProductService {
  constructor() {
    this.currentProduct = 'Room Management System';
  }

  /**
   * Recognize existing user across Smart Paws products
   */
  async recognizeUser(email, authId) {
    try {
      // 1. Check if user exists in unified registry
      const { data: existingUser, error } = await supabase
        .rpc('find_existing_user', { user_email: email });

      if (error) throw error;

      if (existingUser && existingUser.length > 0) {
        const user = existingUser[0];
        
        // 2. Link auth ID to existing profile if not already linked
        await this.linkAuthToProfile(authId, user.user_id);
        
        // 3. Load complete user context
        return await this.loadUserContext(user.user_id);
      }

      // 4. Detect organization by email domain
      const orgId = await this.detectOrganizationByEmail(email);

      if (orgId) {
        // 5. Create user profile with organization context
        return await this.createUserWithOrganization(email, authId, orgId);
      }

      // 6. New organization flow
      return await this.createNewUserAndOrganization(email, authId);
    } catch (error) {
      console.error('User recognition failed:', error);
      throw error;
    }
  }

  /**
   * Detect organization by email domain
   */
  async detectOrganizationByEmail(email) {
    try {
      const { data, error } = await supabase
        .rpc('detect_organization_by_email', { user_email: email });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Organization detection failed:', error);
      return null;
    }
  }

  /**
   * Link Supabase auth ID to existing user profile
   */
  async linkAuthToProfile(authId, userId) {
    try {
      const { error } = await supabase
        .from('sp_unified_users_x7k9m2')
        .update({ auth_id: authId, last_active_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Auth linking failed:', error);
      throw error;
    }
  }

  /**
   * Load complete user context including product access
   */
  async loadUserContext(userId) {
    try {
      // Get user profile
      const { data: user, error: userError } = await supabase
        .from('sp_unified_users_x7k9m2')
        .select(`
          *,
          organization:sp_organizations_x7k9m2(*)
        `)
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Get product access
      const { data: productAccess, error: accessError } = await supabase
        .from('sp_user_product_access_x7k9m2')
        .select(`
          *,
          product:sp_products_x7k9m2(*),
          clinic:sp_unified_clinics_x7k9m2(*)
        `)
        .eq('user_id', userId)
        .eq('active', true);

      if (accessError) throw accessError;

      // Get accessible clinics
      const { data: clinics, error: clinicsError } = await supabase
        .from('sp_unified_clinics_x7k9m2')
        .select('*')
        .eq('organization_id', user.organization_id)
        .eq('active', true);

      if (clinicsError) throw clinicsError;

      return {
        user,
        productAccess: productAccess || [],
        clinics: clinics || [],
        hasRoomAccess: productAccess?.some(p => p.product.name === 'Room Management System'),
        hasAppointmentAccess: productAccess?.some(p => p.product.name === 'Appointment Scheduling'),
        hasPortalAccess: productAccess?.some(p => p.product.name === 'Client Portal'),
        hasInventoryAccess: productAccess?.some(p => p.product.name === 'Inventory Management')
      };
    } catch (error) {
      console.error('Failed to load user context:', error);
      throw error;
    }
  }

  /**
   * Create user with existing organization
   */
  async createUserWithOrganization(email, authId, organizationId) {
    try {
      // Extract name from email
      const [firstName] = email.split('@')[0].split('.');
      
      // Create user profile
      const { data: user, error: userError } = await supabase
        .from('sp_unified_users_x7k9m2')
        .insert({
          auth_id: authId,
          email,
          first_name: firstName,
          organization_id: organizationId
        })
        .select()
        .single();

      if (userError) throw userError;

      // Grant access to current product
      await this.grantProductAccess(user.id, this.currentProduct, 'clinic_user');

      return await this.loadUserContext(user.id);
    } catch (error) {
      console.error('Failed to create user with organization:', error);
      throw error;
    }
  }

  /**
   * Create new user and organization
   */
  async createNewUserAndOrganization(email, authId) {
    try {
      const domain = email.split('@')[1];
      const [firstName] = email.split('@')[0].split('.');
      
      // Create organization
      const { data: organization, error: orgError } = await supabase
        .from('sp_organizations_x7k9m2')
        .insert({
          name: `${domain} Organization`,
          domain: domain
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Create user
      const { data: user, error: userError } = await supabase
        .from('sp_unified_users_x7k9m2')
        .insert({
          auth_id: authId,
          email,
          first_name: firstName,
          organization_id: organization.id,
          primary_role: 'organization_admin'
        })
        .select()
        .single();

      if (userError) throw userError;

      // Grant admin access to current product
      await this.grantProductAccess(user.id, this.currentProduct, 'agency_admin');

      return await this.loadUserContext(user.id);
    } catch (error) {
      console.error('Failed to create new user and organization:', error);
      throw error;
    }
  }

  /**
   * Grant access to a product
   */
  async grantProductAccess(userId, productName, role, clinicId = null) {
    try {
      // Get product ID
      const { data: product, error: productError } = await supabase
        .from('sp_products_x7k9m2')
        .select('id')
        .eq('name', productName)
        .single();

      if (productError) throw productError;

      // Get user's organization
      const { data: user, error: userError } = await supabase
        .from('sp_unified_users_x7k9m2')
        .select('organization_id')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Create access record
      const { error: accessError } = await supabase
        .from('sp_user_product_access_x7k9m2')
        .insert({
          user_id: userId,
          product_id: product.id,
          organization_id: user.organization_id,
          role,
          entity_access: clinicId ? { clinic_ids: [clinicId] } : {}
        });

      if (accessError) throw accessError;
      return true;
    } catch (error) {
      console.error('Failed to grant product access:', error);
      throw error;
    }
  }

  /**
   * Find or create clinic
   */
  async findOrCreateClinic(clinicData, organizationId) {
    try {
      // Try exact name match first
      let { data: clinic, error } = await supabase
        .from('sp_unified_clinics_x7k9m2')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('name', clinicData.name)
        .eq('active', true)
        .single();

      if (!clinic && !error) {
        // Try fuzzy name matching
        const { data: clinics, error: fuzzyError } = await supabase
          .from('sp_unified_clinics_x7k9m2')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('active', true);

        if (!fuzzyError && clinics) {
          clinic = this.findBestMatch(clinicData.name, clinics);
        }
      }

      if (!clinic) {
        // Create new clinic
        const { data: newClinic, error: createError } = await supabase
          .from('sp_unified_clinics_x7k9m2')
          .insert({
            organization_id: organizationId,
            name: clinicData.name,
            address: clinicData.address,
            phone: clinicData.phone,
            email: clinicData.email
          })
          .select()
          .single();

        if (createError) throw createError;
        clinic = newClinic;

        // Create product instance for this clinic
        await this.createProductInstance(clinic.id, this.currentProduct);
      }

      return clinic;
    } catch (error) {
      console.error('Failed to find or create clinic:', error);
      throw error;
    }
  }

  /**
   * Create product instance for clinic
   */
  async createProductInstance(clinicId, productName) {
    try {
      const { data: product, error: productError } = await supabase
        .from('sp_products_x7k9m2')
        .select('id')
        .eq('name', productName)
        .single();

      if (productError) throw productError;

      const { error } = await supabase
        .from('sp_clinic_product_instances_x7k9m2')
        .insert({
          clinic_id: clinicId,
          product_id: product.id,
          active: true
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to create product instance:', error);
      throw error;
    }
  }

  /**
   * Sync user data across products
   */
  async syncUserData(userId, changes, targetProducts = []) {
    try {
      const { data: userProducts, error } = await supabase
        .from('sp_user_product_access_x7k9m2')
        .select('product:sp_products_x7k9m2(name)')
        .eq('user_id', userId)
        .eq('active', true);

      if (error) throw error;

      const productsToSync = targetProducts.length > 0 
        ? targetProducts 
        : userProducts.map(p => p.product.name);

      // Create sync entries for each product
      const syncPromises = productsToSync.map(productName => 
        supabase.rpc('sync_user_data', {
          source_product: this.currentProduct,
          target_product: productName,
          sync_user_id: userId,
          sync_data: changes
        })
      );

      await Promise.all(syncPromises);
      return true;
    } catch (error) {
      console.error('Failed to sync user data:', error);
      throw error;
    }
  }

  /**
   * Find best matching clinic using fuzzy logic
   */
  findBestMatch(targetName, clinics) {
    let bestMatch = null;
    let highestScore = 0;

    for (const clinic of clinics) {
      const score = this.calculateSimilarity(targetName.toLowerCase(), clinic.name.toLowerCase());
      if (score > highestScore && score > 0.8) { // 80% similarity threshold
        highestScore = score;
        bestMatch = clinic;
      }
    }

    return bestMatch;
  }

  /**
   * Calculate string similarity
   */
  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Levenshtein distance calculation
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Get user's product access summary
   */
  async getUserProductSummary(userId) {
    try {
      const { data, error } = await supabase
        .from('sp_user_product_access_x7k9m2')
        .select(`
          role,
          entity_access,
          product:sp_products_x7k9m2(name, version, endpoints),
          clinic:sp_unified_clinics_x7k9m2(name)
        `)
        .eq('user_id', userId)
        .eq('active', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get user product summary:', error);
      return [];
    }
  }
}

// Export singleton instance
export const crossProductService = new CrossProductService();