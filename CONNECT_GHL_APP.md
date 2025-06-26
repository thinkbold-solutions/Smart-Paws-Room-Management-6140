# 🚀 Connect Your GHL Marketplace App - Step by Step

## 🔑 **Step 1: Get Your App Credentials**

From your GHL Marketplace App dashboard, copy these values:

```javascript
📋 You'll need these 3 values:
├── Client ID: (looks like: 5f4dcc3b5aa765d61d8327deb882cf99)
├── Client Secret: (looks like: 25f9e794323b453885f5181f1b624d0b)
└── Redirect URI: https://yourdomain.com/agency/ghl-callback
```

## ⚙️ **Step 2: Add Environment Variables**

**Option A: If you have a `.env` file:**
```env
# Add these lines to your .env file
VITE_GHL_CLIENT_ID=your-client-id-here
VITE_GHL_CLIENT_SECRET=your-client-secret-here
VITE_GHL_REDIRECT_URI=https://yourdomain.com/agency/ghl-callback
```

**Option B: If deploying to hosting platforms:**

### **Vercel:**
```bash
vercel env add VITE_GHL_CLIENT_ID
vercel env add VITE_GHL_CLIENT_SECRET
vercel env add VITE_GHL_REDIRECT_URI
```

### **Netlify:**
```bash
netlify env:set VITE_GHL_CLIENT_ID "your-client-id"
netlify env:set VITE_GHL_CLIENT_SECRET "your-client-secret"
netlify env:set VITE_GHL_REDIRECT_URI "https://yourdomain.com/agency/ghl-callback"
```

### **Railway:**
```bash
railway variables set VITE_GHL_CLIENT_ID=your-client-id
railway variables set VITE_GHL_CLIENT_SECRET=your-client-secret
railway variables set VITE_GHL_REDIRECT_URI=https://yourdomain.com/agency/ghl-callback
```

### **Heroku:**
```bash
heroku config:set VITE_GHL_CLIENT_ID="your-client-id"
heroku config:set VITE_GHL_CLIENT_SECRET="your-client-secret"
heroku config:set VITE_GHL_REDIRECT_URI="https://yourdomain.com/agency/ghl-callback"
```

## 🔄 **Step 3: Restart Your Application**

**Local Development:**
```bash
# Stop your dev server (Ctrl+C)
# Then restart:
npm run dev
```

**Production:**
- **Redeploy your application** after adding environment variables
- Most platforms auto-redeploy when you update environment variables

## 🎮 **Step 4: Connect in Smart Paws Admin**

### **4.1 Navigate to GHL Integration**
1. **Login to Smart Paws** as an agency admin
2. **Go to:** Agency → GHL Integration
3. **You should see the connection interface**

### **4.2 Initiate Connection**
Look for this button and click it:

```javascript
🔗 Connect GoHighLevel Marketplace App
```

### **4.3 Complete OAuth Flow**
1. **You'll be redirected** to GoHighLevel
2. **Choose your location** from the dropdown
3. **Click "Authorize"** to grant permissions
4. **You'll be redirected back** to Smart Paws automatically

### **4.4 Verify Connection**
After successful connection, you should see:
- ✅ **Green connection status**
- 📍 **Your GHL locations** discovered automatically
- 🏥 **Clinic mapping options** available

## 🔍 **Step 5: Troubleshooting**

### **❌ "Missing GHL configuration" Error**
**Solution:** Environment variables not loaded
```bash
# Check if variables are set (in browser console):
console.log(import.meta.env.VITE_GHL_CLIENT_ID);

# Should show your client ID, not undefined
```

### **❌ "Invalid client" Error**
**Solution:** Wrong Client ID/Secret
- Double-check your credentials from GHL Marketplace
- Ensure no extra spaces when copying

### **❌ "Redirect URI mismatch" Error**  
**Solution:** Update redirect URI in GHL app
1. Go to your GHL Marketplace App settings
2. Update Redirect URIs to match your domain:
   - `https://yourdomain.com/agency/ghl-callback`
   - `http://localhost:3000/agency/ghl-callback` (for development)

### **❌ Connection button doesn't appear**
**Solution:** Check user permissions
- Must be logged in as `agency_admin` role
- Regular clinic users won't see this option

## ✅ **Step 6: Test the Integration**

### **6.1 Quick Test**
1. **Click "Connect GoHighLevel"**
2. **Complete OAuth flow**
3. **Check for success message:** "🎉 GoHighLevel connected successfully!"

### **6.2 Verify Features Work**
After connection, test these features:
- **Location Discovery:** See your GHL locations listed
- **Clinic Mapping:** Map a clinic to a GHL location
- **Contact Sync:** Try a test sync operation

## 🎯 **Expected Results**

### **✅ Successful Connection Shows:**
```javascript
Connection Status: ✅ Connected
Available Locations: [Your GHL locations]
Active Mappings: 0 (initially)
Ready for Sync: ✅ Yes
```

### **📊 Integration Dashboard:**
- **Overview Tab:** Connection status and quick stats
- **Locations Tab:** All your GHL locations with mapping options
- **Sync Logs Tab:** Track sync activity (empty initially)

## 🔐 **Security Notes**

### **Environment Variables Security:**
- ✅ **Client Secret** is stored securely in environment variables
- ✅ **Never commit** credentials to version control
- ✅ **CSRF protection** with state verification
- ✅ **Token encryption** in database storage

### **Production Checklist:**
- [ ] HTTPS enabled on your domain
- [ ] Environment variables set in hosting platform
- [ ] Redirect URI matches your production domain
- [ ] GHL Marketplace App approved and published

## 🆘 **Need Help?**

### **Debug Information:**
Enable debug mode to see detailed logs:
```env
VITE_DEBUG_MODE=true
```

Then check browser console for detailed connection information.

### **Common Issues:**
1. **Environment variables not loading** → Restart application
2. **Wrong redirect URI** → Update in GHL Marketplace App
3. **Invalid credentials** → Double-check Client ID/Secret
4. **Permission denied** → Ensure user has agency_admin role

### **Contact Support:**
- Check browser console for error details
- Verify all environment variables are set
- Test with development credentials first
- Ensure GHL Marketplace App is approved