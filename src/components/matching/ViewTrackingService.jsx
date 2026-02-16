import { base44 } from '@/api/base44Client';

/**
 * View tracking service for analytics
 * Tracks when case managers/guardians view provider content
 */

const VIEW_TRACKING_CACHE_KEY = 'view_tracking_cache';
const DEDUP_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

export const ViewTrackingService = {
  /**
   * Track a view event with deduplication
   */
  async trackView({
    entityType,
    entityId,
    providerOrgId,
    viewerUserId,
    viewerRole,
    viewerCounty,
    referrer = 'direct'
  }) {
    try {
      // Generate cache key for deduplication
      const cacheKey = `${entityType}_${entityId}_${viewerUserId || 'anon'}`;
      const cache = this.getCache();
      const lastViewed = cache[cacheKey];
      const now = Date.now();

      // Check if viewed within dedup window
      if (lastViewed && (now - lastViewed) < DEDUP_WINDOW_MS) {
        return null; // Skip duplicate
      }

      // Create view record
      const viewRecord = await base44.entities.ProfileView.create({
        entity_type: entityType,
        entity_id: entityId,
        provider_org_id: providerOrgId,
        viewer_user_id: viewerUserId || null,
        viewer_role: viewerRole,
        viewer_county: viewerCounty || null,
        referrer,
        session_id: this.getSessionId()
      });

      // Update cache
      cache[cacheKey] = now;
      this.setCache(cache);

      return viewRecord;
    } catch (error) {
      console.error('Failed to track view:', error);
      return null;
    }
  },

  /**
   * Track opening view
   */
  async trackOpeningView(opening, user, referrer = 'search') {
    if (!opening || !opening.organization_id) return;

    return this.trackView({
      entityType: 'opening',
      entityId: opening.id,
      providerOrgId: opening.organization_id,
      viewerUserId: user?.id,
      viewerRole: this.getUserRole(user),
      viewerCounty: user?.county || null,
      referrer
    });
  },

  /**
   * Track provider profile view
   */
  async trackProviderView(providerId, user, referrer = 'direct') {
    return this.trackView({
      entityType: 'provider_profile',
      entityId: providerId,
      providerOrgId: providerId,
      viewerUserId: user?.id,
      viewerRole: this.getUserRole(user),
      viewerCounty: user?.county || null,
      referrer
    });
  },

  /**
   * Track site view
   */
  async trackSiteView(site, user, referrer = 'direct') {
    if (!site || !site.organization_id) return;

    return this.trackView({
      entityType: 'site',
      entityId: site.id,
      providerOrgId: site.organization_id,
      viewerUserId: user?.id,
      viewerRole: this.getUserRole(user),
      viewerCounty: user?.county || null,
      referrer
    });
  },

  /**
   * Get analytics for a provider
   */
  async getProviderAnalytics(providerOrgId, daysBack = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const views = await base44.entities.ProfileView.filter({
      provider_org_id: providerOrgId
    });

    const recentViews = views.filter(v => 
      new Date(v.created_date) >= cutoffDate
    );

    return {
      total_views: recentViews.length,
      unique_viewers: new Set(recentViews.filter(v => v.viewer_user_id).map(v => v.viewer_user_id)).size,
      by_entity_type: this.groupBy(recentViews, 'entity_type'),
      by_county: this.groupBy(recentViews.filter(v => v.viewer_county), 'viewer_county'),
      by_referrer: this.groupBy(recentViews, 'referrer'),
      recent_views: recentViews.slice(0, 50)
    };
  },

  // Helper methods
  getUserRole(user) {
    if (!user) return 'unknown';
    if (user.role === 'admin') return 'admin';
    // Determine from user metadata or role field
    return user.user_type || 'case_manager';
  },

  getSessionId() {
    let sessionId = sessionStorage.getItem('view_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('view_session_id', sessionId);
    }
    return sessionId;
  },

  getCache() {
    try {
      const cache = localStorage.getItem(VIEW_TRACKING_CACHE_KEY);
      return cache ? JSON.parse(cache) : {};
    } catch {
      return {};
    }
  },

  setCache(cache) {
    try {
      localStorage.setItem(VIEW_TRACKING_CACHE_KEY, JSON.stringify(cache));
    } catch {
      // Ignore localStorage errors
    }
  },

  groupBy(array, key) {
    return array.reduce((acc, item) => {
      const val = item[key] || 'unknown';
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});
  }
};

export default ViewTrackingService;