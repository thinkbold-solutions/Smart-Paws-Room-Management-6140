import supabase from '../lib/supabase';
import { dbManager } from '../lib/database';

export class GHLApiService {
  constructor() {
    this.baseURL = 'https://rest.gohighlevel.com/v1';
    this.marketplaceBaseURL = 'https://marketplace.gohighlevel.com';
    this.clientId = import.meta.env.VITE_GHL_CLIENT_ID;
    this.clientSecret = import.meta.env.VITE_GHL_CLIENT_SECRET;
    this.redirectUri = import.meta.env.VITE_GHL_REDIRECT_URI;
    this.rateLimitDelay = 1000; // 1 second between requests
    this.maxRetries = 3;
  }

  // Generate secure state for CSRF protection
  generateSecureState() {
    return btoa(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
  }

  // Enhanced OAuth flow for marketplace apps
  async initiateMarketplaceOAuth() {
    // Check if environment variables are configured
    if (!import.meta.env.VITE_GHL_CLIENT_ID || !import.meta.env.VITE_GHL_CLIENT_SECRET) {
      toast.error('GHL Marketplace App not configured. Please add your Client ID and Secret to environment variables.');
      return;
    }

    const state = this.generateSecureState();
    const scopes = [
      'locations.readonly',
      'contacts.readonly', 
      'contacts.write',
      'calendars.readonly',
      'opportunities.readonly'
    ].join(' ');

    const authUrl = new URL('https://marketplace.gohighlevel.com/oauth/chooselocation');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', this.clientId);
    authUrl.searchParams.set('redirect_uri', this.redirectUri);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('state', state);

    // Store state for verification
    localStorage.setItem('ghl_oauth_state', state);
    
    window.location.href = authUrl.toString();
  }

  // Legacy OAuth for backward compatibility
  async initiateOAuth(redirectUri) {
    return this.initiateMarketplaceOAuth();
  }

  // Enhanced token exchange with marketplace endpoints
  async exchangeCodeForToken(code, state) {
    // Verify state for CSRF protection
    const storedState = localStorage.getItem('ghl_oauth_state');
    if (state !== storedState) {
      throw new Error('Invalid OAuth state - possible CSRF attack');
    }

    try {
      const response = await fetch('https://marketplace.gohighlevel.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: this.redirectUri,
        }),
      });

      const tokenData = await response.json();
      
      if (tokenData.access_token) {
        await this.storeMarketplaceTokens(tokenData);
        localStorage.removeItem('ghl_oauth_state'); // Cleanup
        return tokenData;
      }
      
      throw new Error('Failed to get access token');
    } catch (error) {
      dbManager.log('error', 'GHL Marketplace OAuth token exchange failed', error);
      throw error;
    }
  }

  // Enhanced token storage with marketplace metadata
  async storeMarketplaceTokens(tokenData) {
    try {
      const { data, error } = await supabase
        .from('ghl_agency_credentials')
        .upsert({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: new Date(Date.now() + tokenData.expires_in * 1000),
          token_type: tokenData.token_type,
          scope: tokenData.scope,
          location_id: tokenData.location_id, // Specific to chosen location
          user_id: tokenData.user_id, // GHL user who authorized
          company_id: tokenData.company_id, // GHL company ID
          updated_at: new Date(),
        });

      if (error) throw error;
      return data;
    } catch (error) {
      dbManager.log('error', 'Failed to store GHL marketplace tokens', error);
      throw error;
    }
  }

  // Legacy token storage for backward compatibility
  async storeTokens(tokenData) {
    return this.storeMarketplaceTokens(tokenData);
  }

  // Get valid access token (refresh if needed)
  async getValidToken() {
    try {
      const { data: credentials, error } = await supabase
        .from('ghl_agency_credentials')
        .select('*')
        .single();

      if (error || !credentials) {
        throw new Error('No GHL credentials found');
      }

      // Check if token is expired
      if (new Date(credentials.expires_at) <= new Date()) {
        return await this.refreshToken(credentials.refresh_token);
      }

      return credentials.access_token;
    } catch (error) {
      dbManager.log('error', 'Failed to get valid GHL token', error);
      throw error;
    }
  }

  // Refresh access token
  async refreshToken(refreshToken) {
    try {
      const response = await fetch('https://marketplace.gohighlevel.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      });

      const tokenData = await response.json();
      
      if (tokenData.access_token) {
        await this.storeMarketplaceTokens(tokenData);
        return tokenData.access_token;
      }
      
      throw new Error('Failed to refresh token');
    } catch (error) {
      dbManager.log('error', 'GHL token refresh failed', error);
      throw error;
    }
  }

  // Make authenticated API request with rate limiting
  async makeRequest(endpoint, options = {}) {
    await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
    
    let retries = 0;
    while (retries < this.maxRetries) {
      try {
        const token = await this.getValidToken();
        
        const response = await fetch(`${this.baseURL}${endpoint}`, {
          ...options,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        if (response.status === 429) {
          // Rate limited, wait and retry
          await new Promise(resolve => setTimeout(resolve, 5000));
          retries++;
          continue;
        }

        if (!response.ok) {
          throw new Error(`GHL API error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        retries++;
        if (retries >= this.maxRetries) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }
  }

  // Discover all sub-accounts
  async discoverSubAccounts() {
    try {
      dbManager.log('info', '🔍 Starting GHL sub-account discovery...');
      
      const response = await this.makeRequest('/locations');
      const locations = response.locations || [];
      
      dbManager.log('info', `✅ Found ${locations.length} GHL locations`);

      // Store discovered sub-accounts
      for (const location of locations) {
        await this.storeSubAccount(location);
      }

      return locations;
    } catch (error) {
      dbManager.log('error', 'Sub-account discovery failed', error);
      throw error;
    }
  }

  // Store sub-account in database
  async storeSubAccount(location) {
    try {
      const { data, error } = await supabase
        .from('ghl_sub_accounts')
        .upsert({
          ghl_location_id: location.id,
          name: location.name,
          business_name: location.businessName,
          phone: location.phone,
          email: location.email,
          website: location.website,
          address: location.address,
          city: location.city,
          state: location.state,
          postal_code: location.postalCode,
          country: location.country,
          timezone: location.timezone,
          active: true,
          last_synced: new Date(),
        });

      if (error) throw error;
      return data;
    } catch (error) {
      dbManager.log('error', 'Failed to store sub-account', error);
      throw error;
    }
  }

  // Get contacts from specific location
  async getLocationContacts(locationId, limit = 100, startAfter = null) {
    try {
      let endpoint = `/locations/${locationId}/contacts?limit=${limit}`;
      if (startAfter) {
        endpoint += `&startAfter=${startAfter}`;
      }

      const response = await this.makeRequest(endpoint);
      return response.contacts || [];
    } catch (error) {
      dbManager.log('error', `Failed to get contacts for location ${locationId}`, error);
      throw error;
    }
  }

  // Create contact in GHL
  async createContact(locationId, contactData) {
    try {
      const response = await this.makeRequest(`/locations/${locationId}/contacts`, {
        method: 'POST',
        body: JSON.stringify({
          firstName: contactData.firstName,
          lastName: contactData.lastName,
          email: contactData.email,
          phone: contactData.phone,
          address1: contactData.address,
          city: contactData.city,
          state: contactData.state,
          postalCode: contactData.postalCode,
          country: contactData.country,
          source: 'Smart Paws Vet Management',
          tags: contactData.tags || ['veterinary-client'],
          customFields: contactData.customFields || {}
        })
      });

      return response.contact;
    } catch (error) {
      dbManager.log('error', `Failed to create contact in location ${locationId}`, error);
      throw error;
    }
  }

  // Update contact in GHL
  async updateContact(locationId, contactId, contactData) {
    try {
      const response = await this.makeRequest(`/locations/${locationId}/contacts/${contactId}`, {
        method: 'PUT',
        body: JSON.stringify(contactData)
      });

      return response.contact;
    } catch (error) {
      dbManager.log('error', `Failed to update contact ${contactId}`, error);
      throw error;
    }
  }

  // Test API connection
  async testConnection() {
    try {
      await this.makeRequest('/locations?limit=1');
      return { success: true, message: 'GHL API connection successful' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export const ghlApiService = new GHLApiService();