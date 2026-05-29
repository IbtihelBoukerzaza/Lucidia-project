const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function getToken() {
  return localStorage.getItem("access");
}

async function request(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
}

// ------------------------------------------------------------------
// Auth endpoints
// ------------------------------------------------------------------
export const api = {
  login: (email, password) =>
    request("/api/accounts/login/", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () => request("/api/accounts/me/"),

  logout: (refresh) =>
    request("/api/accounts/logout/", {
      method: "POST",
      body: JSON.stringify({ refresh }),
    }),

  requestAccess: (formData) =>
    request("/api/accounts/request-access/", {
      method: "POST",
      body: JSON.stringify(formData),
    }),

  verifyActivation: (data) =>
    request("/api/accounts/activation/verify/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  setPassword: (data) =>
    request("/api/accounts/activation/set-password/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  inviteMember: (data) =>
    request("/api/accounts/invite/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMembers: (companyId) =>
    request(`/api/companies/${companyId}/members/`),  
  getKeywords: (companyId) =>
    request(`/api/companies/${companyId}/keywords/`),

  addKeyword: (companyId, keyword) =>
    request(`/api/companies/${companyId}/keywords/`, {
      method: "POST",
      body: JSON.stringify({ keyword }),
    }),

  deleteKeyword: (companyId, keywordId) =>
    request(`/api/companies/${companyId}/keywords/${keywordId}/`, {
      method: "DELETE",
    }),

  getSocialProfiles: (companyId) =>
    request(`/api/companies/${companyId}/social-profiles/`),

  addSocialProfile: (companyId, platform, url) =>
    request(`/api/companies/${companyId}/social-profiles/`, {
      method: "POST",
      body: JSON.stringify({ platform, url }),
    }),

  deleteSocialProfile: (companyId, profileId) =>
    request(`/api/companies/${companyId}/social-profiles/${profileId}/`, {
      method: "DELETE",
    }),
  triggerIngestion: (companyId) =>
  request(`/api/companies/${companyId}/ingest/`, { method: "POST" }),
 getPosts: (companyId, { page = 1, source = "", platform = "", search = "" } = {}) => {
  const params = new URLSearchParams({ company: companyId, page });
  if (source) params.append("source", source);
  if (platform) params.append("platform", platform);
  if (search) params.append("search", search);
  return request(`/api/posts/?${params.toString()}`);
},
  getSentimentDashboard: (companyId) =>
    request(`/api/sentiment/dashboard/?company=${companyId}`),

  getSentimentTimeline: (companyId, days = 30) =>
    request(`/api/sentiment/timeline/?company=${companyId}&days=${days}`),

  getSentimentPosts: (companyId, { page = 1, sentiment = "", source = "" } = {}) => {
    const params = new URLSearchParams({ company: companyId, page });
    if (sentiment) params.append("sentiment", sentiment);
    if (source) params.append("source", source);
    return request(`/api/sentiment/posts/?${params.toString()}`);
  },

    getSentimentKeywords: (companyId, top = 10) =>
    request(`/api/sentiment/keywords/?company=${companyId}&top=${top}`),
    // ── Topics ────────────────────────────────────────────────────────────────
getTopKeywords: (companyId, top = 20) =>
  request(`/api/topics/top/?company=${companyId}&top=${top}`),

getKeywordTrends: (companyId, days = 30, top = 10) =>
  request(`/api/topics/trends/?company=${companyId}&days=${days}&top=${top}`),

getKeywordsBySource: (companyId, top = 10) =>
  request(`/api/topics/by-source/?company=${companyId}&top=${top}`),

getCoOccurrence: (companyId, top = 15) =>
  request(`/api/topics/co-occurrence/?company=${companyId}&top=${top}`),

  // ── Alert Rules ────────────────────────────────────────────────────
  getAlertRules: (companyId) =>
    request(`/api/alerts/rules/?company=${companyId}`),

  createAlertRule: (companyId, data) =>
    request(`/api/alerts/rules/?company=${companyId}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteAlertRule: (ruleId) =>
    request(`/api/alerts/rules/${ruleId}/`, { method: "DELETE" }),

  toggleAlertRule: (ruleId) =>
    request(`/api/alerts/rules/${ruleId}/`, { method: "PATCH" }),

  // ── Notifications ──────────────────────────────────────────────────
  getAlerts: (companyId) =>
    request(`/api/alerts/notifications/?company=${companyId}`),

  getUnreadCount: (companyId) =>
    request(`/api/alerts/notifications/unread-count/?company=${companyId}`),

  markAlertRead: (alertId) =>
    request(`/api/alerts/notifications/${alertId}/read/`, { method: "PATCH" }),

  markAllAlertsRead: (companyId) =>
    request(`/api/alerts/notifications/read-all/?company=${companyId}`, {
      method: "PATCH",
    }),
    // ── Surveys ────────────────────────────────────────────────────────────────
  getSurveys: (companyId) =>
    request(`/api/surveys/?company=${companyId}`),

  createSurvey: (companyId, data) =>
    request(`/api/surveys/?company=${companyId}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getSurvey: (surveyId) =>
    request(`/api/surveys/${surveyId}/`),

  updateSurvey: (surveyId, data) =>
    request(`/api/surveys/${surveyId}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteSurvey: (surveyId) =>
    request(`/api/surveys/${surveyId}/`, { method: "DELETE" }),

  getSurveyQuestions: (surveyId) =>
    request(`/api/surveys/${surveyId}/questions/`),

  addSurveyQuestion: (surveyId, data) =>
    request(`/api/surveys/${surveyId}/questions/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteSurveyQuestion: (surveyId, questionId) =>
    request(`/api/surveys/${surveyId}/questions/${questionId}/`, {
      method: "DELETE",
    }),

  getSurveyResponses: (surveyId) =>
    request(`/api/surveys/${surveyId}/responses/`),

  getSurveyAnalytics: (surveyId) =>
    request(`/api/surveys/${surveyId}/analytics/`),

  // Public — no auth
  getPublicSurvey: (token) =>
    request(`/api/surveys/public/${token}/`),

  submitPublicSurvey: (token, data) =>
    request(`/api/surveys/public/${token}/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
     // Engagement
getEngagement: (companyId, platform = "", page = 1) =>
  request(`/api/engagement/?company=${companyId}&platform=${platform}&page=${page}`),

getEngagementStats: (companyId) =>
  request(`/api/engagement/stats/?company=${companyId}`),

getEngagementTop: (companyId, metric = "like_count", limit = 10, platform = "") =>
  request(`/api/engagement/top/?company=${companyId}&metric=${metric}&limit=${limit}&platform=${platform}`),

triggerEngagementScrape: (companyId) =>
  request(`/api/engagement/scrape/?company=${companyId}`, { method: "POST" }),
// Feedback
getMyFeedback:      ()     => request("/api/feedback/mine/"),
submitFeedback:     (data) => request("/api/feedback/mine/", { method: "POST", body: JSON.stringify(data) }),
getTestimonials:    ()     => request("/api/feedback/testimonials/"),
getFeedbackStats:   ()     => request("/api/feedback/stats/"),

// Insights
  generateInsight: (companyId, periodDays = 30, lang = "ar") =>
  request(`/api/insights/generate/?company=${companyId}&period_days=${periodDays}&lang=${lang}`, { method: "POST" }),

  getLatestInsight: (companyId) =>
    request(`/api/insights/latest/?company=${companyId}`),

  getInsightHistory: (companyId) =>
    request(`/api/insights/history/?company=${companyId}`),
  // Chatbot
  chatMessage: (data) =>
    request("/api/chatbot/message/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
