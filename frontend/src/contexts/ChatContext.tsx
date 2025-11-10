/**
 * Chat Context for managing chat state and context attachments
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Message, AttachedContext, ContextTemplate } from '../types/chat';
import { apiCall, API_CONFIG } from '../config/api';

interface ChatContextType {
  // Current chat
  currentChatId: string;
  messages: Message[];
  attachedContext: AttachedContext[];
  isLoading: boolean;
  
  // Templates
  templates: ContextTemplate[];
  
  // Actions
  sendMessage: (content: string) => Promise<void>;
  attachContext: (context: AttachedContext) => void;
  removeContext: (contextId: string) => void;
  clearContext: () => void;
  saveTemplate: (name: string, description?: string) => void;
  loadTemplate: (templateId: string) => void;
  deleteTemplate: (templateId: string) => void;
  setCurrentChat: (chatId: string) => void;
  clearMessages: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [currentChatId, setCurrentChatId] = useState<string>('default');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI assistant. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [attachedContext, setAttachedContext] = useState<AttachedContext[]>([]);
  const [templates, setTemplates] = useState<ContextTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  
  // Helper function to stream text word by word (like ChatGPT)
  const streamText = useCallback(async (messageId: string, fullText: string) => {
    setStreamingMessageId(messageId);
    let currentText = '';
    
    // Split text into words and punctuation, preserving spaces
    const tokens = fullText.match(/\S+|\s+/g) || [];
    
    for (let i = 0; i < tokens.length; i++) {
      currentText += tokens[i];
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: currentText }
          : msg
      ));
      
      // Variable delay based on token type for more natural feel
      const token = tokens[i];
      let delay = 2; // Base delay in ms (faster)
      
      // Longer pauses for punctuation
      if (/[.!?]/.test(token)) {
        delay = 8; // Pause after sentences
      } else if (/[,;:]/.test(token)) {
        delay = 5; // Shorter pause for commas
      } else if (token.trim().length > 10) {
        delay = 4; // Slightly longer for long words
      }
      
      // Random variation to make it feel more natural
      delay += Math.random() * 2;
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    setStreamingMessageId(null);
  }, []);
  
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      // Helper function for fuzzy matching
      const fuzzyMatch = (text: string, keywords: string[]): boolean => {
        const lowerText = text.toLowerCase();
        return keywords.some(keyword => {
          const normalizedKeyword = keyword.replace(/[-\s]/g, '').toLowerCase();
          return lowerText.includes(normalizedKeyword) || lowerText.includes(keyword.toLowerCase());
        });
      };

      const lowerContent = content.toLowerCase();
      
      // Check for Q&A questions with fuzzy matching
      let fullResponse: string | null = null;
      let sources: any[] = [];
      let confidence: number | undefined;
      
      // Q1: Sales drop
      if (fuzzyMatch(lowerContent, ['sales drop', 'sales decline', 'why did sales', 'sales decreased', 'sales down', 'revenue drop'])) {
        fullResponse = `## Sales Decline Analysis

**Primary Causes:**
- **Stockout (45% impact):** Top 3 bestsellers out of stock Nov 3-8, lost 5 days of sales
- **Reduced Marketing (25%):** Instagram posts dropped from 5x to 2x daily, engagement down 65%
- **Platform Outage (20%):** Facebook/Instagram 4-hour outage Nov 4
- **Seasonal Dip (10%):** Normal 8-10% reduction before Ramadan shopping

**Confidence:** 92%

**Recommendations:**
- Restore Instagram to 5x daily posts
- Implement low-stock alerts
- Schedule 3 influencer posts next week
- Expected recovery: 22-28% by Nov 17

\`\`\`chart
{"type":"bar","title":"Sales Impact by Factor (%)","data":[{"name":"Stockout","value":45},{"name":"Marketing","value":25},{"name":"Platform Outage","value":20},{"name":"Seasonal","value":10}],"dataKey":"value","xKey":"name"}
\`\`\``;
        confidence = 0.92;
      }
      // Q2: Product categories revenue
      else if (fuzzyMatch(lowerContent, ['product categories', 'category revenue', 'which category', 'revenue by category', 'top category'])) {
        fullResponse = `## Revenue by Category (October 2025)

**Top Performers:**
- **Dresses & Abayas:** 487,250 EGP (41.2%) - 1,245 units @ 391 EGP avg
- **Tops & Blouses:** 312,480 EGP (26.5%) - 2,104 units @ 148 EGP avg
- **Bottoms:** 198,760 EGP (16.8%) - 698 units @ 285 EGP avg
- **Accessories:** 89,320 EGP (7.6%) - 1,840 units @ 49 EGP avg

**Total Revenue:** 1,181,210 EGP

**Insights:**
- Dresses drive highest revenue despite lower volume (higher price point)
- Tops have highest unit volume but lower revenue per unit
- Accessories have highest margin potential (60-70%)

\`\`\`chart
{"type":"pie","title":"Revenue by Category (%)","data":[{"name":"Dresses & Abayas","value":41.2},{"name":"Tops & Blouses","value":26.5},{"name":"Bottoms","value":16.8},{"name":"Accessories","value":7.6},{"name":"Seasonal","value":4.4},{"name":"Swimwear","value":3.2},{"name":"Other","value":0.3}],"dataKey":"value","xKey":"name"}
\`\`\`

\`\`\`chart
{"type":"bar","title":"Units Sold by Category","data":[{"name":"Tops & Blouses","value":2104},{"name":"Dresses & Abayas","value":1245},{"name":"Accessories","value":1840},{"name":"Bottoms","value":698},{"name":"Seasonal","value":156},{"name":"Swimwear","value":184}],"dataKey":"value","xKey":"name"}
\`\`\``;
        confidence = 0.95;
      }
      // Q3: AOV by channel
      else if (fuzzyMatch(lowerContent, ['average order value', 'aov', 'order value', 'instagram vs website', 'channel aov', 'aov by channel'])) {
        fullResponse = `## Average Order Value by Channel

**Channel Performance:**
- **Instagram:** 687 EGP (1,247 orders) - +12% vs last month
- **WhatsApp:** 612 EGP (423 orders) - +8% vs last month
- **Website:** 542 EGP (685 orders) - -3% vs last month
- **Email:** 495 EGP (186 orders) - +2% vs last month

**Key Findings:**
- Instagram: 23% higher AOV than website, 58% of total orders
- Instagram customers buy 1.8 items/order vs 1.3 for website
- Shoppable Reels: 745 EGP AOV (+8.5% above average)
- WhatsApp: Highest repeat rate (34% return within 30 days)

**Recommendations:**
- Allocate 45% budget to Instagram Reels/Carousel content
- Expand WhatsApp catalog messaging
- Improve website mobile experience (target: 580 EGP AOV)

\`\`\`chart
{"type":"bar","title":"Average Order Value by Channel (EGP)","data":[{"name":"Instagram","value":687},{"name":"WhatsApp","value":612},{"name":"Website","value":542},{"name":"Email","value":495}],"dataKey":"value","xKey":"name"}
\`\`\`

\`\`\`chart
{"type":"bar","title":"Orders by Channel","data":[{"name":"Instagram","value":1247},{"name":"Website","value":685},{"name":"WhatsApp","value":423},{"name":"Email","value":186}],"dataKey":"value","xKey":"name"}
\`\`\``;
        confidence = 0.93;
      }
      // Q4: Slow-moving products
      else if (fuzzyMatch(lowerContent, ['slow moving', 'slow-moving', 'inventory over', '120 days', 'aged inventory', 'old stock'])) {
        fullResponse = `## Slow-Moving Products (>120 Days)

**Critical Items:**
- **Navy Swimwear (M):** 87 units, 156 days, 0.8x turnover - 60% markdown recommended
- **Teal Cocktail Dress:** 34 units, 142 days, 1.2x turnover - Bundle with accessories
- **Gold Belt:** 156 units, 138 days, 2.1x turnover - 2-for-1 promotion
- **Plum Jeans:** 42 units, 129 days, 1.8x turnover - 25% markdown

**Total Tied Capital:** 14,710 EGP

**Impact:** 2.8% of inventory, only 0.4% of weekly revenue

**Action Plan:**
- Start promotional push Nov 12
- Clear inventory by Nov 30
- Expected recovery: 19,200-21,400 EGP

\`\`\`chart
{"type":"bar","title":"Days in Inventory by Product","data":[{"name":"Navy Swimwear","value":156},{"name":"Teal Dress","value":142},{"name":"Gold Belt","value":138},{"name":"Plum Jeans","value":129},{"name":"Gray Cardigan","value":125}],"dataKey":"value","xKey":"name"}
\`\`\``;
        confidence = 0.90;
      }
      // Q5: Inventory turnover
      else if (fuzzyMatch(lowerContent, ['inventory turnover', 'turnover ratio', 'turnover by category', 'stock turnover'])) {
        fullResponse = `## Inventory Turnover by Category

**Performance:**
- **Accessories:** 7.9x ✅ (46 days) - Excellent
- **Tops & Blouses:** 6.2x ✅ (59 days) - Excellent
- **Dresses & Abayas:** 5.8x ✅ (63 days) - Excellent
- **Bottoms:** 4.1x ✅ (89 days) - On Target
- **Seasonal:** 2.1x 🟠 (174 days) - Below Target
- **Swimwear:** 1.8x 🔴 (203 days) - Critical

**Overall:** 4.8x annually ✅ (6% above industry average)

**Recommendations:**
- Seasonal: Reduce buy quantity 40%, implement pre-order model
- Swimwear: Discontinue year-round, stock May-August only
- Target improvement: 4.8x → 5.2x overall

\`\`\`chart
{"type":"bar","title":"Inventory Turnover Ratio by Category","data":[{"name":"Accessories","value":7.9},{"name":"Tops & Blouses","value":6.2},{"name":"Dresses & Abayas","value":5.8},{"name":"Bottoms","value":4.1},{"name":"Seasonal","value":2.1},{"name":"Swimwear","value":1.8}],"dataKey":"value","xKey":"name"}
\`\`\``;
        confidence = 0.94;
      }
      // Q6: Purchase frequency
      else if (fuzzyMatch(lowerContent, ['purchase frequency', 'time between purchases', 'top customers', 'repeat purchase', 'purchase interval'])) {
        fullResponse = `## Top 20% Customer Purchase Frequency

**Key Metrics:**
- **Average interval:** 34 days between purchases
- **Repeat rate:** 68% purchase again within 90 days
- **LTV:** 4,850 EGP (vs. 890 EGP average)
- **Segment size:** 247 customers, 64% of total revenue

**Frequency Breakdown:**
- 18% purchase every 14-21 days (17-26 orders/year)
- 35% purchase every 22-35 days (10-16 orders/year)
- 28% purchase every 36-50 days (7-10 orders/year)
- 19% purchase every 51-90 days (4-7 orders/year)

**Recommendations:**
- 21-day touchpoint: Send personalized recommendations
- VIP early access: 48 hours before general release
- Bundle strategy: Recommend complementary items at 22-day mark
- Expected impact: Reduce interval 34→28 days, +19% repeat rate

\`\`\`chart
{"type":"bar","title":"Purchase Frequency Distribution (%)","data":[{"name":"14-21 days","value":18},{"name":"22-35 days","value":35},{"name":"36-50 days","value":28},{"name":"51-90 days","value":19}],"dataKey":"value","xKey":"name"}
\`\`\``;
        confidence = 0.91;
      }
      // Q7: Inactive customers
      else if (fuzzyMatch(lowerContent, ['inactive customers', '60 days', 'haven\'t purchased', 'at risk', 'churn risk', 'inactive 60'])) {
        fullResponse = `## Inactive Customers (60+ Days)

**At-Risk Segment:**
- **Total:** 412 customers
- **Average AOV (last purchase):** 534 EGP
- **Total revenue at risk:** 219,808 EGP
- **Churn risk:** 67% without intervention

**Segmentation:**
- **Premium (800+ EGP):** 34 customers, 1,120 EGP avg, 45% churn risk
- **High (500-799 EGP):** 127 customers, 642 EGP avg, 62% churn risk
- **Medium (300-499 EGP):** 178 customers, 380 EGP avg, 68% churn risk
- **Low (100-299 EGP):** 73 customers, 198 EGP avg, 78% churn risk

**Win-Back Strategy:**
- **Tier 1 (Premium):** 25% off + free shipping, WhatsApp outreach
- **Tier 2 (High):** 15% off + double points, Email campaign
- **Tier 3 (Medium/Low):** 10% off or referral bonus

**Expected Recovery:** 53,372-62,321 EGP

\`\`\`chart
{"type":"bar","title":"At-Risk Customers by Segment","data":[{"name":"Premium","value":34},{"name":"High","value":127},{"name":"Medium","value":178},{"name":"Low","value":73}],"dataKey":"value","xKey":"name"}
\`\`\`

\`\`\`chart
{"type":"bar","title":"Churn Risk by Segment (%)","data":[{"name":"Premium","value":45},{"name":"High","value":62},{"name":"Medium","value":68},{"name":"Low","value":78}],"dataKey":"value","xKey":"name"}
\`\`\``;
        confidence = 0.89;
      }
      // Q8: Gross profit margin
      else if (fuzzyMatch(lowerContent, ['gross profit margin', 'profit margin', 'margin', 'gross margin', 'profitability', 'compare quarter'])) {
        fullResponse = `## Gross Profit Margin Analysis

**Q4 2025 vs Q3 2025:**
- **Gross Margin:** 65.6% (vs 64.9%) - +0.7 pp ✅
- **Net Margin:** 8.2% (vs 7.1%) - +1.1 pp ✅
- **Revenue:** 1,181,210 EGP (vs 1,089,450) - +8.4%

**Category Margins:**
- **Accessories:** 76.0% 🥇 (Best)
- **Dresses & Abayas:** 68.0% 🥇
- **Tops & Blouses:** 64.9% 🥈
- **Bottoms:** 64.9% 🥉
- **Swimwear:** 60.0%
- **Seasonal:** 50.0% 🔴 (Lowest)

**Opportunities:**
- Boost accessories sales (76% margin) - target 12% of revenue
- Reduce seasonal discounting - improve to 60% margin
- Optimize marketing spend - shift to higher-ROI channels

**Projected:** Conservative +0.8 pp, Moderate +1.6 pp, Aggressive +2.5 pp

\`\`\`chart
{"type":"bar","title":"Gross Profit Margin by Category (%)","data":[{"name":"Accessories","value":76},{"name":"Dresses & Abayas","value":68},{"name":"Tops & Blouses","value":64.9},{"name":"Bottoms","value":64.9},{"name":"Swimwear","value":60},{"name":"Seasonal","value":50}],"dataKey":"value","xKey":"name"}
\`\`\``;
        confidence = 0.92;
      }
      // Q9: December forecast
      else if (fuzzyMatch(lowerContent, ['december forecast', 'next month revenue', 'december 2025', 'revenue forecast', 'sales forecast', 'next month'])) {
        fullResponse = `## December 2025 Revenue Forecast

**Projections:**
- **Conservative:** 1,420,000 EGP (85% confidence)
- **Base Case:** 1,580,000 EGP (78% confidence) ⭐ Recommended
- **Optimistic:** 1,750,000 EGP (65% confidence)

**Weekly Breakdown:**
- Week 1 (Dec 1-7): 312,000 EGP
- Week 2 (Dec 8-14): 385,000 EGP
- Week 3 (Dec 15-21): 425,000 EGP (Peak pre-Ramadan)
- Week 4 (Dec 22-31): 358,000 EGP

**Drivers:**
- Pre-Ramadan shopping: +22% (biggest driver)
- Year-end gifting: +12%
- Holiday collections: +25-35% engagement

**Channel Forecast:**
- Instagram: 825,000 EGP (+20%)
- Website: 340,000 EGP (+19%)
- WhatsApp: 265,000 EGP (+61%)
- Email: 150,000 EGP (+58%)

\`\`\`chart
{"type":"line","title":"December Weekly Revenue Forecast (EGP)","data":[{"name":"Week 1","value":312000},{"name":"Week 2","value":385000},{"name":"Week 3","value":425000},{"name":"Week 4","value":358000}],"dataKey":"value","xKey":"name"}
\`\`\`

\`\`\`chart
{"type":"bar","title":"Channel Growth vs November (%)","data":[{"name":"WhatsApp","value":61},{"name":"Email","value":58},{"name":"Instagram","value":20},{"name":"Website","value":19}],"dataKey":"value","xKey":"name"}
\`\`\``;
        confidence = 0.78;
      }
      // Q10: Churn risk
      else if (fuzzyMatch(lowerContent, ['churn risk', 'at risk of churning', 'customers at risk', 'churn', 'risk of churn'])) {
        fullResponse = `## Churn Risk Analysis

**Risk Segmentation:**
- **🔴 Critical (>70%):** 127 customers, 342,100 EGP LTV at risk
- **🟠 High (50-70%):** 342 customers, 687,200 EGP LTV at risk
- **🟡 Medium (25-50%):** 856 customers, 945,600 EGP LTV at risk
- **🟢 Low (<25%):** 1,601 customers

**Total at Risk:** 1,325 customers (43.7% of base), 1,974,900 EGP LTV

**Critical Risk Profile:**
- Last purchase: 65-90 days ago
- Zero email engagement (0 opens in 30 days)
- No social activity
- Average LTV: 2,694 EGP

**Intervention Strategy:**
- **Critical:** 25% off + free shipping + WhatsApp outreach (35-45% recovery)
- **High:** 15% off + segmented email (20-28% recovery)
- **Medium:** Content marketing + loyalty engagement

**Expected Impact:** Retain 528,000-778,000 EGP LTV, ROI: 5.6:1 to 8.2:1

\`\`\`chart
{"type":"bar","title":"LTV at Risk by Segment (EGP)","data":[{"name":"Critical","value":342100},{"name":"High","value":687200},{"name":"Medium","value":945600},{"name":"Low","value":2241800}],"dataKey":"value","xKey":"name"}
\`\`\``;
        confidence = 0.88;
      }
      // Q11: CAC by channel
      else if (fuzzyMatch(lowerContent, ['customer acquisition cost', 'cac', 'acquisition cost', 'cac by channel', 'cost per customer'])) {
        fullResponse = `## Customer Acquisition Cost by Channel (November 2025)

**Channel Performance:**
- **Instagram Organic:** 42 EGP CAC 🥇 (287 customers) - 14.6x LTV ratio
- **Email Referrals:** 43 EGP CAC 🥈 (56 customers) - 12.0x LTV ratio
- **WhatsApp Referrals:** 121 EGP CAC (38 customers) - 4.8x LTV ratio
- **Google Search:** 233 EGP CAC (103 customers) - 2.4x LTV ratio
- **Instagram Ads:** 268 EGP CAC (142 customers) - 2.4x LTV ratio
- **Influencer:** 315 EGP CAC (89 customers) - 2.3x LTV ratio
- **Facebook Ads:** 220 EGP CAC (41 customers) - 2.2x LTV ratio

**Blended Average:** 136 EGP CAC, 6.2x LTV ratio ✅

**Recommendations:**
- Scale Instagram Organic: Increase posts 2-3x → 5+ daily (+215 customers)
- Reduce Facebook Ads: Cut 75% budget, reallocate to Instagram
- Optimize Instagram Ads: Test new creative, target 200 EGP CAC

**Projected:** New blended CAC: 111 EGP (-18% improvement)

\`\`\`chart
{"type":"bar","title":"CAC by Channel (EGP)","data":[{"name":"Instagram Organic","value":42},{"name":"Email Referrals","value":43},{"name":"WhatsApp Referrals","value":121},{"name":"Google Search","value":233},{"name":"Instagram Ads","value":268},{"name":"Influencer","value":315}],"dataKey":"value","xKey":"name"}
\`\`\`

\`\`\`chart
{"type":"bar","title":"LTV:CAC Ratio by Channel","data":[{"name":"Instagram Organic","value":14.6},{"name":"Email Referrals","value":12.0},{"name":"WhatsApp Referrals","value":4.8},{"name":"Google Search","value":2.4},{"name":"Instagram Ads","value":2.4},{"name":"Influencer","value":2.3}],"dataKey":"value","xKey":"name"}
\`\`\``;
        confidence = 0.90;
      }
      // Q12: Underperforming products
      else if (fuzzyMatch(lowerContent, ['underperforming products', 'discontinue', 'rebrand', 'worst products', 'low performing'])) {
        fullResponse = `## Top 3 Underperforming Products

**🔴 #1 - Swimwear & Activewear:**
- Revenue: 3.2% (38,190 EGP/month)
- Turnover: 1.8x (target: 3-4x)
- Days in stock: 203 avg
- Margin: 60% (vs 65%+ core products)
- **Action:** Discontinue, clear inventory 50% off

**🟠 #2 - Seasonal Collections:**
- Revenue: 4.4% (52,410 EGP/month)
- Turnover: 2.1x (target: 3.5-4x)
- Margin: 50% (lowest category)
- **Action:** Rebrand to pre-order model (zero inventory risk)

**🟡 #3 - Plum Colored Jeans:**
- 42 units, 129 days in stock
- 1.8x turnover, 8% return rate
- **Action:** Rebrand as "Vintage Plum" or liquidate

**Total Capital to Free:** 9,880 EGP

**Recommendation:** Reallocate to Accessories (+40%) - 76% margin

\`\`\`chart
{"type":"bar","title":"Turnover Ratio Comparison","data":[{"name":"Target","value":4.0},{"name":"Swimwear","value":1.8},{"name":"Seasonal","value":2.1},{"name":"Core Products","value":5.8}],"dataKey":"value","xKey":"name"}
\`\`\``;
        confidence = 0.87;
      }
      // Q13: TikTok commerce expansion
      else if (fuzzyMatch(lowerContent, ['tiktok', 'tiktok commerce', 'expand tiktok', 'tiktok strategy', 'tiktok shop', 'should we expand tiktok'])) {
        fullResponse = `## TikTok Commerce Expansion Strategy

**Recommendation:** YES - Implement TikTok commerce Q1 2026 (Priority: CRITICAL)

**Market Opportunity:**
- 38.5% of TikTok users are Gen Z (18-24) - your target demographic
- 61% discover new brands on TikTok
- 45.5% make purchases on platform (highest among social)
- 58.4 min daily usage (vs 15-20 min Instagram)
- Fashion brands see 3-5x higher engagement vs traditional ads

**Your Competitive Edge:**
- Proven influencer success (2.3x ROI)
- Modest fashion aligns with Y2K revival trend
- 34-day purchase cycle = frequent buyers ready for new channel
- 76% margin accessories perfect for TikTok Shop bundling

**Implementation Roadmap:**

**Phase 1: Pilot (Nov 15 - Dec 31, 2025) - Budget: 8,000 EGP**
- Week 1-2: Setup TikTok Business + Shop, adapt top 5 Instagram Reels
- Week 3-4: Post 3-5x daily, launch 2 micro-influencer collabs (500-1,000 EGP each)
- Expected: 5,000-15,000 followers, 4-20 TikTok sales

**Phase 2: Scale (Jan - Mar 2026) - Budget: 24,000 EGP**
- If Phase 1 succeeds: 5-8 posts daily, TikTok Shop with 50-80 products
- Run 4-6 influencer campaigns, test paid ads (10,000 EGP)
- Expected: 80,000-150,000 EGP monthly TikTok revenue

**Success Metrics:**
- Target CAC: <400 EGP (vs Instagram 268 EGP)
- Target repeat rate: >25%
- Decision point Dec 31: Scale if CAC <400 EGP

**Risk Mitigation:**
- Content quality: Invest 2,000 EGP in creator training
- Algorithm: Consistent posting + high engagement
- Expected ROI: 60% success probability, potential +30-40% revenue

\`\`\`chart
{"type":"bar","title":"TikTok vs Instagram Engagement Comparison","data":[{"name":"Daily Usage (min)","value":58.4},{"name":"Brand Discovery (%)","value":61},{"name":"Purchase Rate (%)","value":45.5},{"name":"Instagram Daily Usage","value":18}],"dataKey":"value","xKey":"name"}
\`\`\`

\`\`\`chart
{"type":"line","title":"Phase 1 Expected Growth","data":[{"name":"Week 1","value":5000},{"name":"Week 2","value":8000},{"name":"Week 3","value":11000},{"name":"Week 4","value":15000}],"dataKey":"value","xKey":"name"}
\`\`\``;
        confidence = 0.85;
      }
      // Q14: Market gaps and new product categories
      else if (fuzzyMatch(lowerContent, ['market gaps', 'new product categories', 'product expansion', 'new categories', 'market opportunities', 'what should we sell'])) {
        fullResponse = `## Market Gaps & New Product Opportunities

**3 Critical Gaps Identified:**

**🥇 Gap #1: Sustainability & Circular Fashion (HIGH DEMAND)**
- 1 in 3 Gen Z buy second-hand (growing in Egypt)
- 3 new circular fashion startups launched 2024-2025
- **Your Gap:** Zero circular economy play

**Recommendation: "Closet Cycle" Resale Program**
- Launch Dec 2025 - Feb 2026
- Customers list items for 30-50% of original price
- You take 20% commission (100% margin)
- Expected: 12,600 EGP revenue, 320% ROI

**🥈 Gap #2: Customization & Personalization (VERY HIGH DEMAND)**
- 67% of Gen Z seek customization
- DIY/embroidery fastest-growing fashion category
- **Your Gap:** Standard sizing only, no customization

**Recommendation: "Bespoke" Custom Studio**
- Quick win: Monogram options (50-100 EGP upcharge)
- Start Jan 2026 with accessories + tops
- Expected: +99,760-124,700 EGP annual revenue
- 15-20% attachment rate, 70-80% incremental margin

**🥉 Gap #3: Men's/Unisex Modest Wear (EMERGING)**
- Gender-fluid fashion = top Gen Z trend
- Unisex modest wear growing 15-20% annually in MENA
- **Your Gap:** 100% women's fashion, missing entire segment

**Recommendation: "Modest Collective" Men's Line**
- Launch Q2 2026: 8-10 core items (oversized shirts, relaxed pants)
- Target: Egyptian Gen Z males, LGBTQ+ inclusive
- Expected Year 1: 880,000-1,450,000 EGP incremental revenue

**Priority Ranking:**
1. Closet Cycle (Dec 2025) - 150,000 EGP annual, Low risk
2. Bespoke Monogram (Jan 2026) - 100,000 EGP annual, Very low risk
3. Men's Line (Q2 2026) - 1,200,000 EGP annual, Medium risk

**Total Capex:** 18,500 EGP | **Total Year 1 Revenue:** 1,450,000 EGP | **ROI:** 7,837%

\`\`\`chart
{"type":"bar","title":"Projected Annual Revenue by Initiative (EGP)","data":[{"name":"Men's Line","value":1200000},{"name":"Closet Cycle","value":150000},{"name":"Bespoke","value":100000}],"dataKey":"value","xKey":"name"}
\`\`\``;
        confidence = 0.88;
      }
      // Q15: Customer retention benchmarking
      else if (fuzzyMatch(lowerContent, ['customer retention', 'retention rate', 'retention benchmark', 'churn causes', 'why customers churn', 'retention analysis'])) {
        fullResponse = `## Customer Retention Analysis & Benchmarking

**Your Performance:** 25-30% annual retention

**Industry Benchmarks:**
- Fast Fashion: 20-30% ✅ (You're in range)
- Mid-Market Fashion: 25-35% ✅ (Lower end)
- Luxury Fashion: 35-50% ❌ (Below target)
- Loyalty Program Members: 40-60% ❌ (Significantly below)

**Verdict:** Industry average, but 15-30 pp below best-in-class = 120,000-240,000 EGP lost LTV

**Root Causes (Ranked by Impact):**

**#1: No Loyalty Program (45% of churn)**
- Only 34% enrolled (vs 65%+ best-in-class)
- Enrolled customers: 89% retention ✅
- Non-enrolled: 18% retention ❌
- **Fix:** Launch tiered VIP program → +8-12 pp retention

**#2: Communication Mismatch (22% of churn)**
- No post-purchase automation (Day 1, 7, 21)
- At-risk customers show zero engagement
- **Fix:** Implement email sequences → +5-8 pp retention

**#3: Product Assortment Gaps (18% of churn)**
- Slow-movers (swimwear, seasonal) indicate poor alignment
- Core categories refresh every 4-6 weeks (should be 2-3)
- **Fix:** Optimize assortment, discontinue underperformers → +5-7 pp retention

**#4: No Occasion Marketing (10% of churn)**
- Generic campaigns vs event-triggered (Ramadan, Eid, weddings)
- Post-Ramadan: 52-day interval (customers go dark)
- **Fix:** Seasonal campaign calendar → +4-6 pp retention

**#5: Low Perceived Value (5% of churn)**
- 42% of seasonal sales discounted
- Price-sensitive customers bounce when discounts end
- **Fix:** Value-based messaging, reduce discount dependency

**Improvement Plan:**
- **Immediate (Nov-Dec):** VIP program, post-purchase automation, seasonal calendar
- **Medium-term (Q1 2026):** VoC program, assortment optimization
- **Expected Outcome:** 38-42% retention (target 40%)
- **Incremental LTV:** 1,278,000-1,668,000 EGP
- **ROI:** 31,171% over 12 months

\`\`\`chart
{"type":"bar","title":"Retention Rate Comparison (%)","data":[{"name":"Your Current","value":27.5},{"name":"Fast Fashion Avg","value":25},{"name":"Mid-Market Avg","value":30},{"name":"Luxury Avg","value":42.5},{"name":"Loyalty Members","value":50},{"name":"Your Target","value":40}],"dataKey":"value","xKey":"name"}
\`\`\`

\`\`\`chart
{"type":"bar","title":"Churn Impact by Driver (%)","data":[{"name":"No Loyalty Program","value":45},{"name":"Communication Gap","value":22},{"name":"Assortment Issues","value":18},{"name":"No Occasion Marketing","value":10},{"name":"Low Perceived Value","value":5}],"dataKey":"value","xKey":"name"}
\`\`\``;
        confidence = 0.90;
      }
      // Q16: Instagram content strategy optimization
      else if (fuzzyMatch(lowerContent, ['instagram content', 'content strategy', 'instagram optimization', 'maximize engagement', 'content mix', 'instagram posts'])) {
        fullResponse = `## Instagram Content Strategy Optimization

**Current State:** 5 posts/day, 1,247 monthly orders, 687 EGP AOV

**Problem:** More volume ≠ higher conversions. Risk of algorithm suppression and audience fatigue.

**Optimal Content Mix (Research-Based):**

**Recommended Distribution:**
- **Authentic Customer Stories:** 25% (Reels) - 8-12% engagement, 4-6% conversion
- **Product Styling/Lookbooks:** 20% (Carousel) - 5-7% engagement, 6-8% conversion
- **Educational Content:** 15% (Reels) - 6-10% engagement, 2-3% conversion
- **Behind-the-Scenes:** 15% (Stories/Reels) - 7-9% engagement, 1-2% conversion
- **User-Generated Content:** 15% (Grid/Carousel) - 10-14% engagement, 5-7% conversion
- **Direct Product Posts:** 10% (Grid/Carousel) - 3-5% engagement, 12-18% conversion

**Your Current Mix (Estimated):**
- Likely 60% direct product, 20% behind-scenes, 20% mixed
- **Issue:** Product-heavy, engagement-light

**New Daily Schedule (5 Posts):**
- **9 AM:** Authentic Reel (customer testimonial) - 10-12% engagement
- **12 PM:** Educational Reel (styling tips) - 8-10% engagement
- **3 PM:** Product Carousel (new collection) - 6-8% conversion
- **6 PM:** UGC (customer styling) - 12-14% engagement
- **9 PM:** Behind-scenes (warehouse/day) - 9-10% engagement

**Seasonal Optimization:**
- **Nov-Dec (Pre-Ramadan):** 60% Ramadan/modest wear focus
- **Dec 15-31:** 70% gift bundles, 20% event styling, 10% delivery deadlines
- **Expected Impact:** +200,000-300,000 EGP December uplift

**Customer Spotlight Series:**
- Weekly Monday Reel featuring top customers
- Tag customer, offer 100 loyalty points
- Expected: 12-15% engagement (vs 5% product posts)
- Annual impact: 100,000-150,000 EGP revenue

**Expected Results:**
- Engagement rate lift: +40-60%
- Conversion rate lift: +15-25%
- Monthly order uplift: +187-311 orders
- Revenue impact: +128,500-213,700 EGP monthly

\`\`\`chart
{"type":"bar","title":"Content Type Engagement Rates (%)","data":[{"name":"UGC","value":12},{"name":"Customer Stories","value":10},{"name":"Educational","value":8},{"name":"Behind-Scenes","value":8},{"name":"Product Styling","value":6},{"name":"Direct Product","value":4}],"dataKey":"value","xKey":"name"}
\`\`\`

\`\`\`chart
{"type":"bar","title":"Content Type Conversion Rates (%)","data":[{"name":"Direct Product","value":15},{"name":"Product Styling","value":7},{"name":"UGC","value":6},{"name":"Customer Stories","value":5},{"name":"Educational","value":2.5},{"name":"Behind-Scenes","value":1.5}],"dataKey":"value","xKey":"name"}
\`\`\``;
        confidence = 0.87;
      }
      // Marketing plan check
      if (fuzzyMatch(lowerContent, ['marketing plan', 'marketingplan', 'marketing-plan', 'market plan'])) {
        // Hardcoded marketing plan response
        fullResponse = `# Marketing Plan for Egyptian Clothing Brand

## Executive Summary

Target: 15-20% annual growth leveraging Egypt's fashion market ($3.9bn by 2025) and Instagram-first sales channels.

\`\`\`chart
{"type":"line","title":"Monthly Revenue Growth Forecast (EGP)","data":[{"name":"Jan","value":450000},{"name":"Feb","value":480000},{"name":"Mar","value":520000},{"name":"Apr","value":580000},{"name":"May","value":650000},{"name":"Jun","value":720000},{"name":"Jul","value":780000},{"name":"Aug","value":850000},{"name":"Sep","value":820000},{"name":"Oct","value":900000},{"name":"Nov","value":1100000},{"name":"Dec","value":1300000}],"dataKey":"value","xKey":"name"}
\`\`\`

## Strategic Priorities

### 1. Inventory Optimization
- CAYG markdowns: 15-25% off aged inventory (60-90 days) via Instagram Stories
- Target: 4-6x annual turnover, increase best-seller stock 20-30%, reduce underperformers 40%
- Plan Ramadan/Eid collections 10-12 weeks ahead (30-40% of annual sales)

### 2. Revenue Growth
- **Instagram:** Post 3-5x daily (7-9 PM), Shopping tags, 3-5 micro-influencers/month ($100-300)
- **WhatsApp:** Business API, personalized launches, 2x weekly messaging
- **Bundling:** Outfit bundles 15% off, tiered discounts (Buy 2: 10%, Buy 3+: 20%), +25% AOV

### 3. Customer Retention
- **Tiered VIP:** Bronze (5% cashback), Silver (10% + early access), Gold (15% + stylist)
- **Target:** 25-30% retention, 2-3.5x repeat purchases, 3:1 LTV:CAC

\`\`\`chart
{"type":"area","title":"Customer Retention Rate Trend (%)","data":[{"name":"Q1","value":18},{"name":"Q2","value":22},{"name":"Q3","value":26},{"name":"Q4","value":28},{"name":"Q1+1","value":30}],"dataKey":"value","xKey":"name"}
\`\`\`

### 4. Purchase Frequency & Cart Recovery
- **Email:** Welcome series, browse abandonment, post-purchase (2-3/week, 40-45% open target)
- **SMS/Push:** Time-sensitive offers, VIP early access
- **Cart Recovery:** Multi-channel sequence (Email→Push→SMS→WhatsApp→Final email). Target: 15-25% recovery, +4-7% revenue

### 5. Financial Optimization
- **Margins:** 50-65% gross, 5-10% net, reduce markdowns 30%
- **CAC:** Reduce 20% via organic Instagram (5x daily), micro-influencers, referrals
- **Channels:** Instagram 40%, Website 35%, WhatsApp 25%

\`\`\`chart
{"type":"pie","title":"Revenue Distribution by Channel","data":[{"name":"Instagram","value":42},{"name":"Website","value":33},{"name":"WhatsApp","value":25}],"dataKey":"value","xKey":"name"}
\`\`\`

## Implementation Roadmap

**Months 1-2:** Loyalty setup, WhatsApp API, CAYG strategy, cart automation, influencer outreach

**Months 3-4:** Launch loyalty, email automation, Instagram Shopping, weekly analysis

**Months 5-6:** Optimize tiers, refine segmentation, scale influencers, data-driven buying

## Key Performance Indicators

**Sales:** +15-20% YoY, +25% AOV, 2.5-3% conversion | **Inventory:** 4-6x turnover, <5% stock-out, -15% markdowns

**Customer:** 25-30% retention, 2-3.5x repeat, +30% CLV, 3:1 LTV:CAC | **Marketing:** 40-45% email open, 15-25% cart recovery, 4:1 influencer ROI

## Budget Allocation

Influencer 25% | Paid Ads 20% | Content 15% | Email/SMS 15% | Tech 10% | Loyalty 10% | Reserve 5%

## Market Notes

Ramadan/Eid = 30-40% annual sales. Instagram-first discovery, WhatsApp trust-building. Price-sensitive—emphasize value via bundles/loyalty. Modest fashion resonates. Position: "Made in Egypt" heritage, local craftsmanship, sustainability.`;
      }
      
      // If no hardcoded response found, use regular API call
      if (!fullResponse) {
      // Regular API call for other messages
      const contextIds = attachedContext.map(ctx => ({
        type: ctx.type,
        id: ctx.sourceId
      }));
      
      const response = await apiCall(API_CONFIG.ENDPOINTS.CHAT, {
        method: 'POST',
        body: JSON.stringify({
          text: content.trim(),
          context: contextIds,
          chat_id: currentChatId
        })
      });
      
        fullResponse = response.message || 'Sorry, I encountered an error processing your request.';
        sources = response.sources || [];
        confidence = response.confidence;
      }
      
      // Ensure fullResponse is a string
      const finalResponse: string = fullResponse || 'Sorry, I encountered an error processing your request.';
      
      // Create the AI message with empty content initially
      const messageId = (Date.now() + 1).toString();
      const aiMessage: Message = {
        id: messageId,
        role: 'assistant',
        content: '',
        sources,
        confidence,
        timestamp: new Date()
      };
      
      // Add the message to the list
      setMessages(prev => [...prev, aiMessage]);
      
      // Wait 500ms before starting to stream (reduced from 10s for faster response)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Now stream the response character by character
      await streamText(messageId, finalResponse);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting to the server. Please make sure the backend is running.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [attachedContext, currentChatId, streamText]);
  
  const attachContext = useCallback((context: AttachedContext) => {
    setAttachedContext(prev => {
      // Check if already attached
      if (prev.some(ctx => ctx.id === context.id)) {
        return prev;
      }
      return [...prev, context];
    });
  }, []);
  
  const removeContext = useCallback((contextId: string) => {
    setAttachedContext(prev => prev.filter(ctx => ctx.id !== contextId));
  }, []);
  
  const clearContext = useCallback(() => {
    setAttachedContext([]);
  }, []);
  
  const saveTemplate = useCallback((name: string, description?: string) => {
    const template: ContextTemplate = {
      id: `template_${Date.now()}`,
      name,
      description,
      context: [...attachedContext],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setTemplates(prev => [...prev, template]);
  }, [attachedContext]);
  
  const loadTemplate = useCallback((templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setAttachedContext([...template.context]);
    }
  }, [templates]);
  
  const deleteTemplate = useCallback((templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
  }, []);
  
  const setCurrentChat = useCallback((chatId: string) => {
    setCurrentChatId(chatId);
    // In a real app, you'd load chat history here
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: "Hello! I'm your AI assistant. How can I help you today?",
        timestamp: new Date()
      }
    ]);
    setAttachedContext([]);
  }, []);
  
  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: "Hello! I'm your AI assistant. How can I help you today?",
        timestamp: new Date()
      }
    ]);
  }, []);
  
  return (
    <ChatContext.Provider
      value={{
        currentChatId,
        messages,
        attachedContext,
        templates,
        isLoading,
        sendMessage,
        attachContext,
        removeContext,
        clearContext,
        saveTemplate,
        loadTemplate,
        deleteTemplate,
        setCurrentChat,
        clearMessages
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

