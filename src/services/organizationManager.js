import supabase from '../lib/supabase';

export class OrganizationManager {
  /**
   * Get organization by domain
   */
  async getByDomain(domain) {
    try {
      const { data, error } = await supabase
        .from('sp_organizations_x7k9m2')
        .select('*')
        .eq('domain', domain)
        .single();

      return error ? null : data;
    } catch (error) {
      console.error('Failed to get organization by domain:', error);
      return null;
    }
  }

  /**
   * Create new organization
   */
  async createOrganization(organizationData) {
    try {
      const { data, error } = await supabase
        .from('sp_organizations_x7k9m2')
        .insert({
          name: organizationData.name,
          domain: organizationData.domain,
          subscription_tier: organizationData.tier || 'basic',
          settings: organizationData.settings || {}
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to create organization:', error);
      throw error;
    }
  }

  /**
   * Add user to organization with role
   */
  async addUserToOrganization(userId, organizationId, role = 'clinic_user') {
    try {
      const { error } = await supabase
        .from('sp_unified_users_x7k9m2')
        .update({ 
          organization_id: organizationId,
          primary_role: role,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to add user to organization:', error);
      throw error;
    }
  }

  /**
   * Get organization's active products
   */
  async getOrganizationProducts(organizationId) {
    try {
      const { data, error } = await supabase
        .from('sp_clinic_product_instances_x7k9m2')
        .select(`
          *,
          product:sp_products_x7k9m2(*),
          clinic:sp_unified_clinics_x7k9m2(*)
        `)
        .eq('active', true)
        .in('clinic_id', 
          supabase.from('sp_unified_clinics_x7k9m2')
            .select('id')
            .eq('organization_id', organizationId)
        );

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get organization products:', error);
      return [];
    }
  }

  /**
   * Get organization users with their roles
   */
  async getOrganizationUsers(organizationId) {
    try {
      const { data, error } = await supabase
        .from('sp_unified_users_x7k9m2')
        .select(`
          *,
          product_access:sp_user_product_access_x7k9m2(
            role,
            product:sp_products_x7k9m2(name)
          )
        `)
        .eq('organization_id', organizationId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get organization users:', error);
      return [];
    }
  }

  /**
   * Update organization settings
   */
  async updateSettings(organizationId, settings) {
    try {
      const { data, error } = await supabase
        .from('sp_organizations_x7k9m2')
        .update({ 
          settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', organizationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to update organization settings:', error);
      throw error;
    }
  }

  /**
   * Get organization analytics
   */
  async getAnalytics(organizationId) {
    try {
      // Get basic counts
      const [usersResult, clinicsResult, productsResult] = await Promise.all([
        supabase
          .from('sp_unified_users_x7k9m2')
          .select('id', { count: 'exact' })
          .eq('organization_id', organizationId),
        
        supabase
          .from('sp_unified_clinics_x7k9m2')
          .select('id', { count: 'exact' })
          .eq('organization_id', organizationId)
          .eq('active', true),
        
        supabase
          .from('sp_clinic_product_instances_x7k9m2')
          .select('product_id', { count: 'exact' })
          .eq('active', true)
          .in('clinic_id', 
            supabase.from('sp_unified_clinics_x7k9m2')
              .select('id')
              .eq('organization_id', organizationId)
          )
      ]);

      return {
        totalUsers: usersResult.count || 0,
        totalClinics: clinicsResult.count || 0,
        activeProducts: productsResult.count || 0,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get organization analytics:', error);
      return {
        totalUsers: 0,
        totalClinics: 0,
        activeProducts: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Search organizations (for admin tools)
   */
  async searchOrganizations(query, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('sp_organizations_x7k9m2')
        .select('*')
        .or(`name.ilike.%${query}%,domain.ilike.%${query}%`)
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to search organizations:', error);
      return [];
    }
  }
}

export const organizationManager = new OrganizationManager();