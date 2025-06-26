# 🤖 Google Gemini AI Setup Guide for Smart Paws

## 🎯 **Overview**

This guide will help you set up Google Gemini AI to enable live AI-powered insights, recommendations, and analytics in Smart Paws.

## 🔑 **Step 1: Get Your Gemini API Key**

### **Option A: Google AI Studio (Recommended)**
1. **Visit [Google AI Studio](https://ai.google.dev/)**
2. **Sign in** with your Google account
3. **Click "Get API key"** in the top navigation
4. **Create a new API key** or use existing one
5. **Copy the API key** - it looks like: `AIzaSyC...`

### **Option B: Google Cloud Console**
1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
2. **Create or select a project**
3. **Enable the Generative AI API**
4. **Go to Credentials > Create Credentials > API Key**
5. **Copy your API key**

## ⚙️ **Step 2: Configure Smart Paws**

### **Environment Variables**
Create or update your `.env` file:
```env
# Required: Your Gemini API Key
VITE_GEMINI_API_KEY=AIzaSyC_your_actual_api_key_here

# Optional: Advanced Configuration
VITE_GEMINI_MODEL=gemini-2.0-flash-exp
VITE_GEMINI_TEMPERATURE=0.7
VITE_GEMINI_MAX_TOKENS=2048
```

### **Production Deployment**
For production environments, set the environment variable:
```bash
# Vercel
vercel env add VITE_GEMINI_API_KEY

# Netlify
netlify env:set VITE_GEMINI_API_KEY "your-api-key"

# Heroku
heroku config:set VITE_GEMINI_API_KEY="your-api-key"

# Railway
railway variables set VITE_GEMINI_API_KEY="your-api-key"
```

## 🧪 **Step 3: Test the Integration**

### **In Smart Paws:**
1. **Navigate to Agency > AI Configuration**
2. **Enter your API key** in the configuration form
3. **Click "Test Connection"** button
4. **Look for green checkmarks** indicating successful connection
5. **Click "Save Configuration"** to persist settings

### **Expected Results:**
- ✅ **API Key Present**: Confirms key is loaded
- ✅ **Properly Configured**: Validates key format
- ✅ **Connection Successful**: Tests actual API call
- ✅ **AI Features Active**: All features operational

## 🚀 **Step 4: Enable Live Features**

### **Available AI Features:**
1. **Room Efficiency Analysis** - Optimize room utilization
2. **Staff Optimization** - Improve scheduling and performance
3. **Client Flow Predictions** - Reduce wait times
4. **Predictive Scheduling** - Forecast demand patterns
5. **Financial Analysis** - Revenue and cost optimization

### **Usage:**
- **AI Insights Page**: Generate comprehensive analytics
- **Predictive Analytics**: Future planning and forecasting
- **Real-time Recommendations**: Live operational suggestions

## 🆕 **Model Updates**

### **Current Available Models:**
- **gemini-2.0-flash-exp** (Latest) - Fastest and most advanced model
- **gemini-1.5-flash** (Recommended) - Fast and efficient
- **gemini-1.5-pro** - Most capable model
- **gemini-1.0-pro** (Stable) - Reliable model

### **Automatic Model Detection:**
The system will automatically detect available models with your API key and update the dropdown in the AI Configuration interface.

## 💰 **Pricing & Limits**

### **Google AI Studio (Free Tier):**
- **60 requests per minute**
- **1,500 requests per day**
- **Perfect for testing and small clinics**

### **Google Cloud (Paid):**
- **Pay-per-use pricing**
- **Higher rate limits**
- **Enterprise features**
- **Production recommended**

### **Cost Estimation:**
```
Small Clinic (10 requests/day): ~$0.50/month
Medium Clinic (50 requests/day): ~$2.50/month
Large Clinic (200 requests/day): ~$10/month
```

## 🔧 **Advanced Configuration**

### **Custom Model Settings:**
```javascript
// In AI Configuration interface
const GENERATION_CONFIG = {
  temperature: 0.7,        // Creativity level (0-1)
  topP: 0.8,              // Nucleus sampling
  topK: 40,               // Top-k sampling
  maxOutputTokens: 2048,  // Response length
};
```

### **Rate Limiting & Retries:**
- **Automatic retry logic** with exponential backoff
- **Rate limit handling** with intelligent delays
- **Error recovery** with fallback to cached insights
- **Production-ready** error handling

## 🛡️ **Security Best Practices**

### **API Key Security:**
- ✅ **Never commit API keys** to version control
- ✅ **Use environment variables** only
- ✅ **Rotate keys regularly** (monthly recommended)
- ✅ **Restrict API key usage** to your domain

### **Production Hardening:**
```env
# Production settings
VITE_ENVIRONMENT=production
VITE_DEBUG_MODE=false
VITE_ERROR_REPORTING=true
```

## 🔍 **Troubleshooting**

### **Common Issues:**

#### **❌ "Model not found" (404 Error)**
```
Solution:
1. Model names have been updated - the system now uses "gemini-2.0-flash-exp" by default
2. The system will automatically detect and use available models
3. Update your model selection in AI Configuration if needed
```

#### **❌ "API Key Invalid"**
```
Solution:
1. Check API key is correctly copied
2. Ensure no extra spaces/characters
3. Verify key has Generative AI permissions
```

#### **❌ "Quota Exceeded"**
```
Solution:
1. Check Google AI Studio usage dashboard
2. Upgrade to paid tier if needed
3. Wait for quota reset (daily)
```

#### **❌ "Rate Limited"**
```
Solution:
1. Automatic retry after delay
2. Reduce request frequency
3. Upgrade to higher tier
```

#### **❌ "Connection Failed"**
```
Solution:
1. Check internet connectivity
2. Verify API key permissions
3. Check firewall settings
4. Try different model selection
```

### **Debug Mode:**
Enable detailed logging:
```env
VITE_DEBUG_MODE=true
```
Then check browser console for detailed error information.

## 📊 **Monitoring & Analytics**

### **Built-in Monitoring:**
- **Connection status** - Real-time API health
- **Response times** - Performance tracking
- **Error rates** - Reliability metrics
- **Usage statistics** - Request counting
- **Model detection** - Available models

### **Integration Health Check:**
The system automatically monitors:
- API connectivity every 5 minutes
- Response quality validation
- Fallback system activation
- Performance benchmarking
- Model availability

## 🎯 **Success Verification**

### **✅ Complete Setup Checklist:**
- [ ] API key obtained from Google
- [ ] Environment variable configured
- [ ] Application restarted/redeployed
- [ ] Green status in AI Configuration page
- [ ] Test connection successful
- [ ] Live insights generating
- [ ] Recommendations updating
- [ ] Latest model selected (gemini-2.0-flash-exp)

### **🚀 You're Ready!**
Once all checks pass, your Smart Paws installation will have:
- **Live AI insights** instead of demo data
- **Real-time recommendations** based on your actual clinic data
- **Predictive analytics** for strategic planning
- **Intelligent reporting** with actionable suggestions

## 📞 **Support**

### **Need Help?**
1. **Check the troubleshooting section** above
2. **Enable debug mode** for detailed logs
3. **Test with minimal data** to isolate issues
4. **Verify API key permissions** in Google Console
5. **Try different model selection** if one fails

### **Resources:**
- [Google AI Studio Documentation](https://ai.google.dev/docs)
- [Gemini API Reference](https://ai.google.dev/api)
- [Google Cloud AI Platform](https://cloud.google.com/ai-platform)

---

**🎉 Congratulations!** Your Smart Paws installation now has enterprise-grade AI capabilities powered by Google's latest Gemini 2.0 models. The system will provide intelligent insights to help optimize your clinic operations and improve patient care.