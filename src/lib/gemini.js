import { GoogleGenerativeAI } from '@google/generative-ai';
import { dbManager } from './database';

// Get API key from multiple sources
const getApiKey = () => {
  // Check window global first (for immediate updates)
  if (typeof window !== 'undefined' && window.__GEMINI_API_KEY__) {
    return window.__GEMINI_API_KEY__;
  }
  
  // Check localStorage
  const localStorageKey = localStorage.getItem('gemini_api_key');
  if (localStorageKey) {
    return localStorageKey;
  }
  
  // Check environment variable
  return import.meta.env.VITE_GEMINI_API_KEY;
};

// Updated model names for current Gemini API v1beta
const MODEL_NAME = localStorage.getItem('gemini_model') || 
                  import.meta.env.VITE_GEMINI_MODEL || 
                  'gemini-2.0-flash-exp'; // Latest model

const GENERATION_CONFIG = {
  temperature: parseFloat(localStorage.getItem('gemini_temperature')) || 
               parseFloat(import.meta.env.VITE_GEMINI_TEMPERATURE) || 0.7,
  topP: 0.8,
  topK: 40,
  maxOutputTokens: parseInt(localStorage.getItem('gemini_maxTokens')) || 
                   parseInt(import.meta.env.VITE_GEMINI_MAX_TOKENS) || 2048,
};

let genAI = null;
let model = null;

// Usage tracking
let usageStats = {
  today: 0,
  month: 0,
  totalRequests: 0,
  totalErrors: 0,
  avgResponseTime: 0,
  lastReset: new Date().toDateString()
};

// Load usage stats from localStorage
const loadUsageStats = () => {
  try {
    const saved = localStorage.getItem('gemini_usage_stats');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Reset daily stats if it's a new day
      if (parsed.lastReset !== new Date().toDateString()) {
        parsed.today = 0;
        parsed.lastReset = new Date().toDateString();
      }
      usageStats = { ...usageStats, ...parsed };
    }
  } catch (error) {
    dbManager.log('error', '❌ Failed to load usage stats', error);
  }
};

// Save usage stats to localStorage
const saveUsageStats = () => {
  try {
    localStorage.setItem('gemini_usage_stats', JSON.stringify(usageStats));
  } catch (error) {
    dbManager.log('error', '❌ Failed to save usage stats', error);
  }
};

// Initialize usage tracking
loadUsageStats();

// Get available models for current API
export const getAvailableModels = async () => {
  const API_KEY = getApiKey();
  if (!API_KEY) return [];

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const models = await genAI.listModels();
    return models.map(model => ({
      name: model.name.replace('models/', ''),
      displayName: model.displayName || model.name.replace('models/', '').replace(/-/g, ' '),
      description: model.description || 'Available model'
    }));
  } catch (error) {
    dbManager.log('error', 'Failed to fetch available models', error);
    // Return known working models as fallback
    return [
      { name: 'gemini-2.0-flash-exp', displayName: 'Gemini 2.0 Flash Experimental', description: 'Latest and fastest model' },
      { name: 'gemini-1.5-flash', displayName: 'Gemini 1.5 Flash', description: 'Fast and efficient model' },
      { name: 'gemini-1.5-pro', displayName: 'Gemini 1.5 Pro', description: 'Most capable model' },
      { name: 'gemini-1.0-pro', displayName: 'Gemini 1.0 Pro', description: 'Stable model' }
    ];
  }
};

// Initialize Gemini with proper error handling and model validation
const initializeGemini = async (apiKey = null, modelName = null) => {
  const API_KEY = apiKey || getApiKey();
  const MODEL = modelName || MODEL_NAME;
  
  if (!API_KEY) {
    dbManager.log('warn', '🤖 Gemini API key not configured - AI features disabled');
    return { success: false, error: 'API key not configured' };
  }

  try {
    genAI = new GoogleGenerativeAI(API_KEY);
    
    // First, try to list available models to validate API key
    try {
      const models = await genAI.listModels();
      const availableModelNames = models.map(m => m.name.replace('models/', ''));
      
      dbManager.log('info', '✅ Available models:', availableModelNames);
      
      // Check if our desired model is available
      let modelToUse = MODEL;
      if (!availableModelNames.includes(MODEL)) {
        // Fallback priority: 2.0 flash -> 1.5 flash -> 1.5 pro -> first available
        if (availableModelNames.includes('gemini-2.0-flash-exp')) {
          modelToUse = 'gemini-2.0-flash-exp';
        } else if (availableModelNames.includes('gemini-1.5-flash')) {
          modelToUse = 'gemini-1.5-flash';
        } else if (availableModelNames.includes('gemini-1.5-pro')) {
          modelToUse = 'gemini-1.5-pro';
        } else if (availableModelNames.includes('gemini-1.0-pro')) {
          modelToUse = 'gemini-1.0-pro';
        } else if (availableModelNames.length > 0) {
          modelToUse = availableModelNames[0];
        } else {
          throw new Error('No available models found');
        }
        
        dbManager.log('warn', `Model ${MODEL} not available, using ${modelToUse}`);
        
        // Save the working model
        localStorage.setItem('gemini_model', modelToUse);
      }
      
      model = genAI.getGenerativeModel({
        model: modelToUse,
        generationConfig: GENERATION_CONFIG,
      });

      dbManager.log('info', '✅ Gemini AI initialized successfully', {
        model: modelToUse,
        temperature: GENERATION_CONFIG.temperature,
        maxTokens: GENERATION_CONFIG.maxOutputTokens,
        availableModels: availableModelNames.length
      });
      
      return { success: true, model: modelToUse, availableModels: availableModelNames };
    } catch (modelError) {
      // If listing models fails, try with the latest known working models
      dbManager.log('warn', 'Could not list models, trying with default models');
      
      const fallbackModels = ['gemini-2.0-flash-exp', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro'];
      
      for (const fallbackModel of fallbackModels) {
        try {
          model = genAI.getGenerativeModel({
            model: fallbackModel,
            generationConfig: GENERATION_CONFIG,
          });
          
          // Test the model with a simple request
          const testResult = await model.generateContent('test');
          await testResult.response.text();
          
          dbManager.log('info', `✅ Using fallback model: ${fallbackModel}`);
          localStorage.setItem('gemini_model', fallbackModel);
          
          return { success: true, model: fallbackModel, warning: 'Using fallback model' };
        } catch (fallbackError) {
          dbManager.log('warn', `Fallback model ${fallbackModel} failed:`, fallbackError.message);
          continue;
        }
      }
      
      throw new Error('All fallback models failed');
    }
  } catch (error) {
    dbManager.log('error', '❌ Failed to initialize Gemini AI', error);
    return { success: false, error: error.message };
  }
};

// Initialize on module load
let initializationResult = null;
(async () => {
  initializationResult = await initializeGemini();
})();

// API Key validation with model checking
export const validateApiKey = async (apiKey) => {
  try {
    if (!apiKey || typeof apiKey !== 'string') {
      return {
        valid: false,
        message: 'API key is required',
        security: 'missing'
      };
    }

    // Basic format validation
    if (!apiKey.startsWith('AIza') || apiKey.length < 30) {
      return {
        valid: false,
        message: 'API key format appears invalid',
        security: 'invalid_format'
      };
    }

    // Test the key with model listing and generation
    const testAI = new GoogleGenerativeAI(apiKey);
    
    try {
      // First try to list models
      const models = await testAI.listModels();
      const availableModels = models.map(m => m.name.replace('models/', ''));
      
      if (availableModels.length === 0) {
        throw new Error('No models available with this API key');
      }
      
      // Try to use the first available model for a test
      let testModel;
      if (availableModels.includes('gemini-2.0-flash-exp')) {
        testModel = testAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      } else if (availableModels.includes('gemini-1.5-flash')) {
        testModel = testAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      } else {
        testModel = testAI.getGenerativeModel({ model: availableModels[0] });
      }
      
      const result = await testModel.generateContent('Test');
      const response = await result.response;
      const text = response.text();
      
      if (text) {
        return {
          valid: true,
          message: 'API key is valid and working',
          security: 'secure',
          availableModels: availableModels,
          testedModel: availableModels.includes('gemini-2.0-flash-exp') ? 'gemini-2.0-flash-exp' : 
                       availableModels.includes('gemini-1.5-flash') ? 'gemini-1.5-flash' : availableModels[0]
        };
      }
      
      throw new Error('Empty response received');
    } catch (modelError) {
      return {
        valid: false,
        message: `API key validation failed: ${modelError.message}`,
        security: 'error',
        error: modelError.message
      };
    }
  } catch (error) {
    let message = 'API key validation failed';
    let security = 'error';

    if (error.message?.includes('API_KEY_INVALID')) {
      message = 'Invalid API key';
      security = 'invalid';
    } else if (error.message?.includes('PERMISSION_DENIED')) {
      message = 'API key lacks required permissions';
      security = 'insufficient_permissions';
    } else if (error.message?.includes('QUOTA_EXCEEDED')) {
      message = 'API quota exceeded';
      security = 'quota_exceeded';
    }

    return {
      valid: false,
      message,
      security,
      error: error.message
    };
  }
};

// Enhanced error handling and retry logic
const callGeminiWithRetry = async (prompt, maxRetries = 3, apiKey = null, modelName = null) => {
  // Reinitialize if API key provided
  if (apiKey && (!model || !initializationResult?.success)) {
    initializationResult = await initializeGemini(apiKey, modelName);
  }
  
  // Try to reinitialize if not initialized
  if (!model && (!initializationResult || !initializationResult.success)) {
    initializationResult = await initializeGemini();
  }
  
  if (!model || !initializationResult?.success) {
    throw new Error('Gemini AI not initialized - check API key configuration');
  }

  const startTime = Date.now();
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      dbManager.log('debug', `🤖 Gemini API call attempt ${attempt}/${maxRetries}`);

      // Update usage stats
      usageStats.today++;
      usageStats.totalRequests++;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text || text.trim().length === 0) {
        throw new Error('Empty response from Gemini API');
      }

      // Update response time stats
      const responseTime = Date.now() - startTime;
      usageStats.avgResponseTime = usageStats.avgResponseTime === 0 
        ? responseTime 
        : (usageStats.avgResponseTime + responseTime) / 2;

      saveUsageStats();

      dbManager.log('info', `✅ Gemini API call successful (attempt ${attempt})`, {
        responseTime: `${responseTime}ms`,
        promptLength: prompt.length,
        responseLength: text.length,
        model: initializationResult.model
      });

      return text;
    } catch (error) {
      usageStats.totalErrors++;
      saveUsageStats();

      dbManager.log('warn', `⚠️ Gemini API attempt ${attempt} failed:`, error.message);

      // Check for specific error types
      if (error.message?.includes('API_KEY_INVALID')) {
        throw new Error('Invalid Gemini API key - please check your configuration');
      }

      if (error.message?.includes('QUOTA_EXCEEDED')) {
        throw new Error('Gemini API quota exceeded - please check your billing');
      }

      if (error.message?.includes('404') || error.message?.includes('not found') || error.message?.includes('not supported')) {
        // Model not found error - try to reinitialize with a different model
        if (attempt === 1) {
          dbManager.log('info', '🔄 Model not found, trying to reinitialize with available models...');
          initializationResult = await initializeGemini();
          if (initializationResult?.success) {
            continue; // Retry with new model
          }
        }
        throw new Error('Model not available - please check available models in your API configuration');
      }

      if (error.message?.includes('RATE_LIMIT_EXCEEDED') || error.message?.includes('429')) {
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          dbManager.log('info', `⏳ Rate limited, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw new Error('Gemini API rate limit exceeded - please try again later');
      }

      // For connection errors, retry with backoff
      if (attempt < maxRetries && (
        error.message?.includes('fetch') ||
        error.message?.includes('network') ||
        error.message?.includes('timeout') ||
        error.message?.includes('ECONNRESET')
      )) {
        const delay = attempt * 2000; // Linear backoff for network issues
        dbManager.log('info', `🔄 Network error, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Last attempt or non-retryable error
      if (attempt === maxRetries) {
        throw error;
      }
    }
  }
};

// Enhanced prompt templates with better context
const createPrompt = (type, data, context = {}) => {
  const baseContext = `
You are an AI consultant specializing in veterinary clinic operations and efficiency optimization.
Provide practical, actionable insights based on the following data.
Keep responses concise but comprehensive, focusing on specific recommendations.
`;

  const prompts = {
    room_efficiency: `${baseContext}

**ROOM EFFICIENCY ANALYSIS**

Analyze this veterinary clinic room usage data:
${JSON.stringify(data, null, 2)}

Provide insights on:
1. **Current Performance**: Room utilization rates and bottlenecks
2. **Wait Time Analysis**: Average wait times and peak congestion periods  
3. **Staff Allocation**: Optimal staff-to-room assignments
4. **Improvement Opportunities**: Specific actions to increase efficiency
5. **Predicted Impact**: Expected improvements from recommendations

Focus on actionable recommendations with measurable outcomes.`,

    staff_optimization: `${baseContext}

**STAFF OPTIMIZATION ANALYSIS**

Analyze this staff performance and scheduling data:
${JSON.stringify(data, null, 2)}

Provide recommendations on:
1. **Performance Insights**: Individual and team efficiency metrics
2. **Scheduling Optimization**: Optimal shift patterns and coverage
3. **Workload Distribution**: Balancing caseloads and responsibilities
4. **Training Needs**: Skills gaps and development opportunities
5. **Cost Efficiency**: Staff cost vs productivity analysis

Include specific metrics and implementation timelines.`,

    client_flow: `${baseContext}

**CLIENT FLOW OPTIMIZATION**

Analyze this client flow and waiting queue data:
${JSON.stringify(data, null, 2)}

Provide improvements for:
1. **Check-in Process**: Streamlining client arrival procedures
2. **Queue Management**: Reducing wait times and improving experience
3. **Appointment Scheduling**: Optimal booking patterns and spacing
4. **Communication**: Client updates and expectation management
5. **Satisfaction Metrics**: Measuring and improving client experience

Focus on practical solutions that can be implemented immediately.`,

    predictive_scheduling: `${baseContext}

**PREDICTIVE SCHEDULING ANALYSIS**

Based on this historical data and patterns:
${JSON.stringify(data, null, 2)}

Predict and recommend:
1. **Demand Forecasting**: Expected appointment volumes by time/season
2. **Resource Planning**: Staffing and room requirements for peak periods
3. **Proactive Scheduling**: Optimal appointment distribution
4. **Seasonal Adjustments**: Preparing for busy/slow periods
5. **Capacity Planning**: Long-term growth and expansion recommendations

Include specific dates, numbers, and actionable preparation steps.`,

    financial_analysis: `${baseContext}

**FINANCIAL PERFORMANCE ANALYSIS**

Analyze this clinic financial and operational data:
${JSON.stringify(data, null, 2)}

Provide insights on:
1. **Revenue Optimization**: Maximizing income per hour/appointment
2. **Cost Efficiency**: Reducing operational costs without compromising care
3. **Profitability Analysis**: Most/least profitable services and time periods
4. **Growth Opportunities**: Expansion and service enhancement recommendations
5. **Financial Health**: Key metrics and benchmarking

Focus on profit-increasing recommendations with ROI calculations.`
  };

  return prompts[type] || prompts.room_efficiency;
};

// Main insight generation function
export const generateInsights = async (data, type = 'room_efficiency', context = {}) => {
  if (!isGeminiConfigured()) {
    dbManager.log('warn', '🤖 Gemini not configured, returning mock insights');
    return getMockInsights(type, data);
  }

  try {
    dbManager.log('info', `🤖 Generating ${type} insights...`);
    const prompt = createPrompt(type, data, context);
    const insights = await callGeminiWithRetry(prompt);

    dbManager.log('info', `✅ Generated ${type} insights successfully`);
    return insights;
  } catch (error) {
    dbManager.log('error', `❌ Failed to generate ${type} insights:`, error.message);
    // Return mock data as fallback
    dbManager.log('info', '🔄 Falling back to mock insights');
    return getMockInsights(type, data);
  }
};

// Enhanced recommendations with specific action items
export const generateRecommendations = async (clinicData, metrics, context = {}) => {
  if (!isGeminiConfigured()) {
    dbManager.log('warn', '🤖 Gemini not configured, returning mock recommendations');
    return getMockRecommendations(clinicData, metrics);
  }

  try {
    dbManager.log('info', '🎯 Generating actionable recommendations...');
    const prompt = `${createPrompt('recommendations', clinicData)}

**CLINIC METRICS CONTEXT:**
${JSON.stringify(metrics, null, 2)}

**ADDITIONAL CONTEXT:**
${JSON.stringify(context, null, 2)}

Provide a structured action plan with:

**🏆 TOP 3 PRIORITY IMPROVEMENTS:**
For each improvement, include:
- Specific action steps (numbered list)
- Timeline for implementation
- Expected impact (quantified where possible)
- Resource requirements (staff time, budget, tools)
- Success metrics to track

**📊 QUICK WINS (This Week):**
- 3-5 immediate actions that can be implemented within 7 days
- Minimal resource requirements
- High impact potential

**🔮 STRATEGIC INITIATIVES (Next 3 Months):**
- Longer-term improvements requiring planning
- Investment requirements
- Expected ROI

**📈 SUCCESS METRICS:**
- Key Performance Indicators to track
- Target values and benchmarks
- Monitoring frequency

Make all recommendations specific, measurable, and actionable.`;

    const recommendations = await callGeminiWithRetry(prompt);

    dbManager.log('info', '✅ Generated recommendations successfully');
    return recommendations;
  } catch (error) {
    dbManager.log('error', '❌ Failed to generate recommendations:', error.message);
    // Return mock data as fallback
    dbManager.log('info', '🔄 Falling back to mock recommendations');
    return getMockRecommendations(clinicData, metrics);
  }
};

// Test Gemini API connection with proper model detection
export const testGeminiConnection = async () => {
  const API_KEY = getApiKey();
  
  if (!API_KEY) {
    return {
      success: false,
      error: 'Gemini API key not configured'
    };
  }

  try {
    dbManager.log('info', '🧪 Testing Gemini API connection...');
    
    // Force reinitialize with current API key
    const initResult = await initializeGemini(API_KEY);
    
    if (!initResult.success) {
      throw new Error(initResult.error || 'Failed to initialize Gemini');
    }
    
    const testPrompt = 'Respond with exactly: "Gemini API connection test successful"';
    const result = await callGeminiWithRetry(testPrompt, 1, API_KEY); // Single attempt for testing

    const isValid = result.includes('successful') || result.includes('Gemini') || result.includes('test');

    if (isValid) {
      dbManager.log('info', '✅ Gemini API connection test passed');
      return {
        success: true,
        message: 'Connection successful',
        responseTime: usageStats.avgResponseTime,
        model: initResult.model,
        availableModels: initResult.availableModels
      };
    } else {
      throw new Error('Unexpected response from Gemini API');
    }
  } catch (error) {
    dbManager.log('error', '❌ Gemini API connection test failed:', error.message);
    return {
      success: false,
      error: error.message,
      details: handleGeminiError(error)
    };
  }
};

// Get usage statistics
export const getUsageStats = async () => {
  loadUsageStats(); // Refresh from localStorage
  return {
    ...usageStats,
    successRate: usageStats.totalRequests > 0 
      ? ((usageStats.totalRequests - usageStats.totalErrors) / usageStats.totalRequests * 100).toFixed(1)
      : '100',
    avgResponseTime: usageStats.avgResponseTime > 0 
      ? `${Math.round(usageStats.avgResponseTime)}ms` 
      : 'N/A'
  };
};

// Generate specific clinic report
export const generateClinicReport = async (clinicData, reportType = 'comprehensive') => {
  if (!isGeminiConfigured()) {
    return getMockReport(clinicData, reportType);
  }

  try {
    const prompt = `Generate a ${reportType} clinic performance report based on this data:
${JSON.stringify(clinicData, null, 2)}

Include executive summary, key metrics, trends, and specific recommendations.
Format as a professional report suitable for clinic management.`;

    return await callGeminiWithRetry(prompt);
  } catch (error) {
    dbManager.log('error', 'Failed to generate clinic report:', error.message);
    return getMockReport(clinicData, reportType);
  }
};

// Configuration check
export const isGeminiConfigured = () => {
  const API_KEY = getApiKey();
  return !!API_KEY && API_KEY.length > 30;
};

// Get API status
export const getGeminiStatus = () => {
  const API_KEY = getApiKey();
  const configured = isGeminiConfigured();
  
  return {
    configured,
    apiKeyPresent: !!API_KEY,
    modelInitialized: !!model,
    model: initializationResult?.model || MODEL_NAME,
    temperature: GENERATION_CONFIG.temperature,
    maxTokens: GENERATION_CONFIG.maxOutputTokens,
    lastInitialized: initializationResult?.success ? new Date().toISOString() : null,
    usageStats: usageStats,
    availableModels: initializationResult?.availableModels || []
  };
};

// Mock data functions for fallback
const getMockInsights = (type, data) => {
  const mockInsights = {
    room_efficiency: `**ROOM EFFICIENCY ANALYSIS**

✅ **Current Performance Overview:**
Your clinic shows strong operational metrics with room utilization averaging 78%. Based on the data analysis:

**🏠 Room Utilization Insights:**
- **Room 1**: 85% utilization - Optimal performance
- **Room 2**: 92% utilization - High efficiency, potential bottleneck during peak hours
- **Room 3**: 64% utilization - Underutilized, opportunity for improvement

**⏱️ Wait Time Analysis:**
- Average wait time: 12 minutes (industry benchmark: 15 minutes)
- Peak congestion: 10:00 AM - 12:00 PM and 2:00 PM - 4:00 PM
- Longest delays occur on Tuesdays and Thursdays

**👥 Staff Allocation Recommendations:**
1. **Redistribute during peak hours**: Assign your most efficient staff to Room 2 during 10-12 AM
2. **Cross-train technicians**: Enable flexible room assignments to reduce bottlenecks
3. **Implement 15-minute check-ins**: Staff should update room status every 15 minutes

**📈 Improvement Opportunities:**
1. **Room 3 Optimization**: Consider equipment upgrade or specialized use (estimated 25% efficiency gain)
2. **Appointment Spacing**: Add 5-minute buffers between complex procedures (reduce wait times by 18%)
3. **Digital Check-in**: Implement mobile check-in to reduce front desk congestion (30% improvement)

**🎯 Predicted Impact:**
- **Short-term (1 month)**: 15% reduction in wait times
- **Medium-term (3 months)**: 22% increase in daily appointment capacity
- **Long-term (6 months)**: 35% improvement in overall efficiency`,

    staff_optimization: `**STAFF OPTIMIZATION ANALYSIS**

👥 **Current Team Performance:**
Your team demonstrates above-average efficiency with a collective score of 89%. Here's the detailed analysis:

**🌟 Top Performers:**
- **Dr. Smith**: 94% efficiency, handles complex cases excellently
- **Sarah (Tech)**: 91% efficiency, exceptional client communication
- **Mike (Reception)**: 88% efficiency, excellent scheduling management

**📊 Performance Insights:**
- **Morning shift**: 15% more productive than afternoon
- **Wednesday-Friday**: Peak performance days
- **Complex procedures**: Dr. Smith completes 20% faster than average

**⚡ Optimization Recommendations:**
1. **Mentorship Program**: Pair Dr. Smith with developing staff members
2. **Shift Optimization**: Schedule top performers during peak hours (10 AM - 2 PM)
3. **Skill Specialization**: Assign staff to their strongest competencies
4. **Workload Balancing**: Redistribute complex cases to prevent burnout

**📈 Implementation Plan:**
- **Week 1**: Implement new scheduling based on performance data
- **Week 2**: Start mentorship pairings
- **Week 3**: Introduce specialization assignments
- **Month 2**: Review and adjust based on results

**🎯 Expected Improvements:**
- **Team Efficiency**: Increase from 89% to 95%+ within 8 weeks
- **Staff Satisfaction**: Improve work-life balance through optimized scheduling
- **Client Experience**: Reduce service variations through better skill matching`,

    client_flow: `**CLIENT FLOW OPTIMIZATION**

🚶‍♂️ **Current Flow Analysis:**
Your clinic processes clients efficiently with an average wait time of 11.7 minutes, which is above industry standards.

**📋 Check-in Process Insights:**
- **Digital adoption**: 35% of clients use online check-in
- **Peak arrival times**: 9:00-9:30 AM and 1:30-2:00 PM
- **Processing time**: Average 3.2 minutes per check-in

**⏰ Queue Management Analysis:**
- **Longest waits**: Emergency appointments disrupting schedule
- **Shortest waits**: Routine checkups and vaccinations
- **Client satisfaction**: 4.8/5.0 (excellent rating)

**🔧 Optimization Strategies:**
1. **Express Lane**: Create separate check-in for routine visits
2. **Emergency Buffer**: Reserve 2 slots daily for urgent cases
3. **Mobile Updates**: Send real-time wait time notifications
4. **Comfort Enhancements**: Improve waiting area amenities

**📱 Digital Transformation:**
1. **Mobile App**: Implement comprehensive appointment management
2. **Text Notifications**: Automated reminders and updates
3. **Online Forms**: Pre-visit paperwork completion
4. **Digital Payments**: Contactless payment options

**🎯 Expected Results:**
- **Wait Time Reduction**: From 11.7 to 8 minutes average
- **Client Satisfaction**: Increase to 4.9/5.0
- **No-Show Reduction**: Decrease by 40% through better communication
- **Efficiency Gain**: 25% increase in appointment throughput`
  };

  return mockInsights[type] || mockInsights.room_efficiency;
};

const getMockRecommendations = (clinicData, metrics) => {
  return `**🎯 SMART PAWS OPTIMIZATION RECOMMENDATIONS**

**🏆 TOP 3 PRIORITY IMPROVEMENTS:**

**1. Dynamic Scheduling System Implementation**
**Action Steps:**
1. Install AI-powered scheduling software (Week 1-2)
2. Train staff on new system features (Week 3)
3. Configure automatic appointment optimization (Week 4)
4. Monitor and adjust algorithms (Ongoing)

**Timeline:** 4 weeks implementation
**Expected Impact:** 25% reduction in wait times, 18% increase in appointment capacity
**Resource Requirements:**
- Software cost: $200/month
- Staff training: 8 hours total
- IT setup: 4 hours

**Success Metrics:**
- Average wait time: Target <8 minutes
- Room utilization: Target >90%
- Client satisfaction: Target >4.9/5.0

**2. Staff Cross-Training & Specialization Program**
**Action Steps:**
1. Assess current skill gaps and strengths (Week 1)
2. Create specialized role definitions (Week 2)
3. Implement cross-training schedule (Weeks 3-8)
4. Establish performance tracking system (Week 4)
5. Regular skill assessment and feedback (Monthly)

**Timeline:** 8 weeks initial implementation
**Expected Impact:** 30% improvement in staff flexibility, 20% reduction in bottlenecks
**Resource Requirements:**
- Training materials: $500
- Staff time: 2 hours/week per person
- Supervisor oversight: 4 hours/week

**Success Metrics:**
- Staff efficiency: Target >92%
- Cross-training completion: 100%
- Emergency coverage capability: 95%

**3. Client Experience Enhancement Initiative**
**Action Steps:**
1. Deploy mobile check-in system (Week 1-2)
2. Install digital waiting room displays (Week 2)
3. Implement text notification system (Week 3)
4. Create comfort improvement plan (Week 4)
5. Launch client feedback program (Week 5)

**Timeline:** 5 weeks rollout
**Expected Impact:** 40% improvement in satisfaction, 15% reduction in no-shows
**Resource Requirements:**
- Technology setup: $1,200
- Staff training: 6 hours
- Monthly software fees: $150

**📊 QUICK WINS (This Week):**
1. **Add 5-minute buffers** between complex appointments
2. **Create emergency appointment slots** (2 per day)
3. **Implement color-coded room status** indicators
4. **Set up automated appointment reminders**
5. **Optimize lunch break scheduling** to maintain coverage

**🔮 STRATEGIC INITIATIVES (Next 3 Months):**

**Month 1: Technology Foundation**
- Complete mobile app deployment
- Integrate payment processing
- Setup analytics dashboard

**Month 2: Process Optimization**
- Implement lean clinic workflows
- Establish performance benchmarks
- Create standard operating procedures

**Month 3: Growth Preparation**
- Evaluate capacity expansion options
- Develop staff development programs
- Plan equipment upgrades

**📈 SUCCESS METRICS TO TRACK:**

**Weekly Metrics:**
- Average wait time (Target: <8 minutes)
- Room utilization rate (Target: >90%)
- Staff efficiency score (Target: >92%)
- Client satisfaction rating (Target: >4.9/5.0)

**Monthly Metrics:**
- Revenue per hour (Target: +20%)
- No-show rate (Target: <5%)
- Staff turnover (Target: <10% annually)
- New client acquisition (Target: +15%)

**Quarterly Reviews:**
- ROI on technology investments
- Staff development progress
- Client retention rates
- Competitive positioning analysis

**💰 Investment Summary:**
- **Total Initial Investment:** $3,200
- **Monthly Recurring Costs:** $350
- **Expected ROI:** 300% within 6 months
- **Payback Period:** 3.5 months

**🎯 Implementation Priority:**
1. **High Impact, Low Cost:** Quick wins and process improvements
2. **Medium Impact, Medium Cost:** Technology implementations
3. **High Impact, High Cost:** Strategic initiatives and expansion

This plan will transform your clinic into a highly efficient, client-focused operation while maintaining the quality care your patients deserve.`;
};

const getMockReport = (clinicData, reportType) => {
  return `**SMART PAWS CLINIC PERFORMANCE REPORT**

**Executive Summary:**
Your clinic demonstrates strong operational performance with opportunities for strategic improvements.

**Key Metrics:**
- Overall Efficiency: 87%
- Client Satisfaction: 4.8/5.0  
- Revenue Growth: +15% YoY
- Staff Retention: 92%

**Recommendations:**
1. Implement digital check-in system
2. Optimize staff scheduling during peak hours
3. Enhance client communication protocols

**Next Steps:**
Focus on technology adoption and process optimization to achieve 95%+ efficiency targets.`;
};

// Enhanced error handling for production
export const handleGeminiError = (error) => {
  const errorMappings = {
    'API_KEY_INVALID': {
      message: 'Invalid API key configuration',
      action: 'Please verify your Gemini API key in settings',
      severity: 'high'
    },
    'QUOTA_EXCEEDED': {
      message: 'API quota limit reached',
      action: 'Check your Google Cloud billing and usage limits',
      severity: 'high'
    },
    'RATE_LIMIT_EXCEEDED': {
      message: 'Too many requests',
      action: 'Please wait a moment before trying again',
      severity: 'medium'
    },
    'PERMISSION_DENIED': {
      message: 'API access denied',
      action: 'Verify your API key has the correct permissions',
      severity: 'high'
    },
    '404': {
      message: 'Model not available',
      action: 'The selected AI model is not available. The system will auto-select a working model.',
      severity: 'high'
    },
    'not found': {
      message: 'Model not available',
      action: 'The selected AI model is not available. Try updating the model selection.',
      severity: 'high'
    },
    'not supported': {
      message: 'Model not supported',
      action: 'The selected AI model is not supported for this operation. Try a different model.',
      severity: 'high'
    }
  };

  for (const [key, value] of Object.entries(errorMappings)) {
    if (error.message?.includes(key)) {
      return value;
    }
  }

  return {
    message: 'AI service temporarily unavailable',
    action: 'Using cached insights. Please try again later.',
    severity: 'low'
  };
};

// Export configuration for external use
export const GEMINI_CONFIG = {
  MODEL_NAME,
  GENERATION_CONFIG,
  isConfigured: isGeminiConfigured(),
  status: getGeminiStatus()
};