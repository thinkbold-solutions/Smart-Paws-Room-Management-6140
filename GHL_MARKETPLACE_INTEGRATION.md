# 🔗 GoHighLevel Marketplace App Integration for Smart Paws

## 🎯 **Overview**
This guide walks through integrating your GHL Marketplace App with Smart Paws to enable seamless contact synchronization between veterinary clinics and GoHighLevel sub-accounts.

## 📋 **Prerequisites**
- ✅ Smart Paws application deployed and running
- ✅ GoHighLevel Marketplace Developer Account
- ✅ Domain with SSL certificate for redirect URLs

## 🏗️ **Step 1: GoHighLevel Marketplace App Setup**

### **1.1 Create Marketplace App**
1. **Login to [GHL Marketplace](https://marketplace.gohighlevel.com/)**
2. **Navigate to "Developer" section**
3. **Click "Create New App"**
4. **Fill in App Details:**

```javascript
App Information:
├── App Name: "Smart Paws Veterinary Management"
├── App Description: "Seamless veterinary clinic management with automated contact sync"
├── App Category: "CRM & Contacts"
├── App Icon: [Upload your Smart Paws logo]
├── Developer Name: [Your Company Name]
├── Support Email: support@smartpaws.com
└── Privacy Policy URL: https://yourdomain.com/privacy
```

### **1.2 OAuth 2.0 Configuration**
```javascript
OAuth Settings:
├── Redirect URIs: 
│   ├── https://yourdomain.com/agency/ghl-callback
│   ├── https://yourdomain.com/auth/ghl/callback
│   └── http://localhost:3000/agency/ghl-callback (for development)
├── Scopes Required:
│   ├── locations.readonly (View locations)
│   ├── contacts.readonly (Read contacts)
│   ├── contacts.write (Create/update contacts)
│   ├── calendars.readonly (View calendars - future feature)
│   └── opportunities.readonly (View opportunities - future feature)
└── Webhook URLs:
    ├── https://yourdomain.com/api/webhooks/ghl/contacts
    └── https://yourdomain.com/api/webhooks/ghl/locations
```

### **1.3 App Permissions & Features**
```javascript
Required Permissions:
├── Sub-Account Access: ✅ (Essential for multi-location)
├── Contact Management: ✅ (Core feature)
├── Location Management: ✅ (Clinic mapping)
├── Webhook Subscriptions: ✅ (Real-time sync)
└── API Rate Limits: Standard (60 requests/minute)

App Features to Highlight:
├── 🏥 Multi-clinic veterinary management
├── 🔄 Bidirectional contact synchronization
├── 📊 Real-time sync monitoring
├── 🛡️ HIPAA-compliant data handling
├── 📈 Analytics and reporting
└── 🎯 Automated workflow triggers
```

## 🔑 **Step 2: Get Your Credentials**

After app approval, you'll receive:

```env
# Add these to your .env file
VITE_GHL_CLIENT_ID=your-marketplace-app-client-id
VITE_GHL_CLIENT_SECRET=your-marketplace-app-client-secret
VITE_GHL_REDIRECT_URI=https://yourdomain.com/agency/ghl-callback

# Optional: Webhook verification
VITE_GHL_WEBHOOK_SECRET=your-webhook-secret
```

## 🔧 **Step 3: Update Smart Paws Configuration**

### **3.1 Enhanced OAuth Service**
```javascript
// Update src/services/ghlApiService.js
export class GHLApiService {
  constructor() {
    this.baseURL = 'https://rest.gohighlevel.com/v1';
    this.marketplaceBaseURL = 'https://marketplace.gohighlevel.com';
    this.clientId = import.meta.env.VITE_GHL_CLIENT_ID;
    this.clientSecret = import.meta.env.VITE_GHL_CLIENT_SECRET;
    this.redirectUri = import.meta.env.VITE_GHL_REDIRECT_URI;
  }

  // Enhanced OAuth flow for marketplace apps
  async initiateMarketplaceOAuth() {
    const state = this.generateSecureState(); // CSRF protection
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
      console.error('GHL Marketplace OAuth token exchange failed:', error);
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
      console.error('Failed to store GHL marketplace tokens:', error);
      throw error;
    }
  }
}
```

### **3.2 Enhanced Callback Handler**
```javascript
// Create src/components/auth/GHLCallback.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ghlApiService } from '../../services/ghlApiService';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const GHLCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    try {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        throw new Error(`OAuth Error: ${error}`);
      }

      if (!code) {
        throw new Error('No authorization code received');
      }

      setStatus('exchanging_token');
      
      // Exchange code for tokens
      const tokenData = await ghlApiService.exchangeCodeForToken(code, state);
      
      setStatus('discovering_locations');
      
      // Discover and store sub-accounts
      await ghlApiService.discoverSubAccounts();
      
      setStatus('success');
      
      toast.success('🎉 GoHighLevel connected successfully!');
      
      // Redirect to GHL integration page
      setTimeout(() => {
        navigate('/agency/ghl-integration');
      }, 2000);
      
    } catch (error) {
      console.error('OAuth callback error:', error);
      setStatus('error');
      toast.error(`Connection failed: ${error.message}`);
      
      setTimeout(() => {
        navigate('/agency/ghl-integration');
      }, 3000);
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'processing':
        return 'Processing authorization...';
      case 'exchanging_token':
        return 'Exchanging authorization code...';
      case 'discovering_locations':
        return 'Discovering your GHL locations...';
      case 'success':
        return 'Successfully connected to GoHighLevel!';
      case 'error':
        return 'Connection failed. Redirecting...';
      default:
        return 'Processing...';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔗</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Connecting to GoHighLevel
          </h2>
          <p className="text-gray-600">
            {getStatusMessage()}
          </p>
        </div>
        
        {status !== 'error' && <LoadingSpinner size="medium" />}
        
        {status === 'success' && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">
              ✅ Connection established successfully!
            </p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">
              ❌ Connection failed. Please try again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GHLCallback;
```

### **3.3 Add Callback Route**
```javascript
// Update src/App.jsx to include the callback route
import GHLCallback from './components/auth/GHLCallback';

// Add this route in your Routes
<Route path="/agency/ghl-callback" element={
  <ProtectedRoute allowedRoles={['agency_admin']}>
    <GHLCallback />
  </ProtectedRoute>
} />
```

## 🎮 **Step 4: Enhanced Integration Interface**

### **4.1 Update GHL Integration Component**
```javascript
// Update src/components/dashboards/agency/GHLIntegration.jsx
const initiateMarketplaceConnection = () => {
  // Use the enhanced OAuth flow
  ghlApiService.initiateMarketplaceOAuth();
};

// Update the connection button
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  onClick={initiateMarketplaceConnection}
  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
>
  <SafeIcon icon={FiExternalLink} />
  <span>Connect GoHighLevel Marketplace App</span>
</motion.button>
```

## 🔒 **Step 5: Security Enhancements**

### **5.1 Environment Variables Validation**
```javascript
// Add to src/config/validation.js
export const validateGHLConfig = () => {
  const required = [
    'VITE_GHL_CLIENT_ID',
    'VITE_GHL_CLIENT_SECRET', 
    'VITE_GHL_REDIRECT_URI'
  ];
  
  const missing = required.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing GHL configuration: ${missing.join(', ')}`);
  }
  
  // Validate redirect URI format
  const redirectUri = import.meta.env.VITE_GHL_REDIRECT_URI;
  if (!redirectUri.startsWith('https://') && !redirectUri.includes('localhost')) {
    throw new Error('GHL redirect URI must use HTTPS in production');
  }
  
  return true;
};
```

### **5.2 Enhanced Error Handling**
```javascript
// Enhanced error handling for marketplace integration
export const handleGHLError = (error) => {
  const errorMappings = {
    'invalid_client': {
      message: 'Invalid marketplace app credentials',
      action: 'Check your Client ID and Secret in environment variables',
      severity: 'high'
    },
    'invalid_grant': {
      message: 'Authorization code expired or invalid',
      action: 'Please restart the connection process',
      severity: 'medium'
    },
    'insufficient_scope': {
      message: 'App lacks required permissions',
      action: 'Update your marketplace app scope configuration',
      severity: 'high'
    },
    'access_denied': {
      message: 'User denied authorization',
      action: 'User must approve the connection to continue',
      severity: 'low'
    }
  };

  for (const [key, value] of Object.entries(errorMappings)) {
    if (error.message?.includes(key)) {
      return value;
    }
  }

  return {
    message: 'GHL connection failed',
    action: 'Check your internet connection and try again',
    severity: 'medium'
  };
};
```

## 📋 **Step 6: Testing Your Integration**

### **6.1 Development Testing**
```bash
# 1. Start your development server
npm run dev

# 2. Navigate to GHL Integration
# http://localhost:3000/agency/ghl-integration

# 3. Click "Connect GoHighLevel Marketplace App"

# 4. Complete OAuth flow on GHL

# 5. Verify callback handling
# Should redirect to: http://localhost:3000/agency/ghl-callback
```

### **6.2 Production Deployment**
```bash
# 1. Deploy to your production domain
npm run build

# 2. Update environment variables with production values
VITE_GHL_REDIRECT_URI=https://yourdomain.com/agency/ghl-callback

# 3. Test OAuth flow with production URLs
```

## 🚀 **Step 7: App Store Submission**

### **7.1 Marketplace Submission Checklist**
- ✅ App functionality fully tested
- ✅ OAuth flow working correctly
- ✅ Error handling implemented
- ✅ User documentation created
- ✅ Privacy policy published
- ✅ Support contact information provided
- ✅ App icon and screenshots prepared

### **7.2 App Description Template**
```markdown
# Smart Paws Veterinary Management

Transform your veterinary practice with Smart Paws - the complete clinic management solution that seamlessly integrates with GoHighLevel.

## 🏥 Key Features:
- **Multi-Clinic Management**: Handle multiple locations from one dashboard
- **Automated Contact Sync**: Bidirectional sync between Smart Paws and GHL
- **Real-Time Room Management**: Live room status and appointment tracking  
- **AI-Powered Analytics**: Intelligent insights for clinic optimization
- **HIPAA Compliant**: Secure handling of veterinary client data

## 🔗 Integration Benefits:
- **Seamless Contact Management**: Automatically sync veterinary clients with GHL contacts
- **Marketing Automation**: Leverage GHL's marketing tools with vet client data
- **Unified Communication**: Single source of truth for client information
- **Automated Workflows**: Trigger marketing campaigns based on appointment data

## 📊 Perfect For:
- Veterinary clinics using GoHighLevel for marketing
- Multi-location veterinary practices
- Clinics wanting to automate client communication
- Practices looking to improve operational efficiency

## 🛡️ Security & Compliance:
- HIPAA-compliant data handling
- Encrypted data transmission
- Secure OAuth 2.0 authentication
- Regular security audits

Get started today and revolutionize your veterinary practice management!
```

## 🎯 **Expected Results**

After completing this integration:

1. **✅ Secure OAuth Connection**: Users can connect their GHL account through the marketplace
2. **✅ Automatic Location Discovery**: Smart Paws discovers all GHL sub-accounts
3. **✅ Clinic Mapping**: Easy mapping of veterinary clinics to GHL locations  
4. **✅ Bidirectional Sync**: Full contact synchronization between systems
5. **✅ Real-Time Monitoring**: Live sync status and activity logging
6. **✅ Error Recovery**: Robust error handling and user feedback

## 📞 **Support & Next Steps**

### **Need Help?**
1. **GHL Marketplace Support**: marketplace@gohighlevel.com
2. **Smart Paws Documentation**: [Your docs URL]
3. **Developer Community**: [Your Discord/Slack]

### **Coming Next:**
- 📅 **Appointment Sync**: Two-way appointment synchronization
- 🔔 **Webhook Integration**: Real-time updates via webhooks
- 📊 **Advanced Analytics**: Cross-platform reporting
- 🎯 **Marketing Automation**: Triggered campaigns based on vet visits