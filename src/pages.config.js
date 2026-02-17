/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AIAssistant from './pages/AIAssistant';
import AdminAnalytics from './pages/AdminAnalytics';
import AuditLogs from './pages/AuditLogs';
import CMAnalytics from './pages/CMAnalytics';
import CMOverview from './pages/CMOverview';
import CMReferralsDashboard from './pages/CMReferralsDashboard';
import Capabilities from './pages/Capabilities';
import CaseManagerSearch from './pages/CaseManagerSearch';
import Compliance from './pages/Compliance';
import DemoSetup from './pages/DemoSetup';
import FamilyOverview from './pages/FamilyOverview';
import Funding from './pages/Funding';
import GetStarted from './pages/GetStarted';
import Home from './pages/Home';
import HospitalOverview from './pages/HospitalOverview';
import LicenseMapping from './pages/LicenseMapping';
import LicenseTaxonomy from './pages/LicenseTaxonomy';
import Licenses from './pages/Licenses';
import Marketplace from './pages/Marketplace';
import Matching from './pages/Matching';
import MatchingConfig from './pages/MatchingConfig';
import MatchingDashboard from './pages/MatchingDashboard';
import MatchingSimulation from './pages/MatchingSimulation';
import NotificationPreferences from './pages/NotificationPreferences';
import Notifications from './pages/Notifications';
import OpeningDetail from './pages/OpeningDetail';
import Openings from './pages/Openings';
import Overview from './pages/Overview';
import Programs from './pages/Programs';
import ProviderAnalytics from './pages/ProviderAnalytics';
import ProviderDetail from './pages/ProviderDetail';
import ProviderLicenses from './pages/ProviderLicenses';
import ProviderOnboarding from './pages/ProviderOnboarding';
import ProviderOverview from './pages/ProviderOverview';
import ProviderPortal from './pages/ProviderPortal';
import ProviderRegister from './pages/ProviderRegister';
import Providers from './pages/Providers';
import ReferralBuilder from './pages/ReferralBuilder';
import ReferralTracking from './pages/ReferralTracking';
import Register from './pages/Register';
import Settings from './pages/Settings';
import Sites from './pages/Sites';
import SubscriptionGating from './pages/SubscriptionGating';
import Subscriptions from './pages/Subscriptions';
import UsersRoles from './pages/UsersRoles';
import ProviderOpeningsManager from './pages/ProviderOpeningsManager';
import ProviderReferralsView from './pages/ProviderReferralsView';
import ProviderProfileSettings from './pages/ProviderProfileSettings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIAssistant": AIAssistant,
    "AdminAnalytics": AdminAnalytics,
    "AuditLogs": AuditLogs,
    "CMAnalytics": CMAnalytics,
    "CMOverview": CMOverview,
    "CMReferralsDashboard": CMReferralsDashboard,
    "Capabilities": Capabilities,
    "CaseManagerSearch": CaseManagerSearch,
    "Compliance": Compliance,
    "DemoSetup": DemoSetup,
    "FamilyOverview": FamilyOverview,
    "Funding": Funding,
    "GetStarted": GetStarted,
    "Home": Home,
    "HospitalOverview": HospitalOverview,
    "LicenseMapping": LicenseMapping,
    "LicenseTaxonomy": LicenseTaxonomy,
    "Licenses": Licenses,
    "Marketplace": Marketplace,
    "Matching": Matching,
    "MatchingConfig": MatchingConfig,
    "MatchingDashboard": MatchingDashboard,
    "MatchingSimulation": MatchingSimulation,
    "NotificationPreferences": NotificationPreferences,
    "Notifications": Notifications,
    "OpeningDetail": OpeningDetail,
    "Openings": Openings,
    "Overview": Overview,
    "Programs": Programs,
    "ProviderAnalytics": ProviderAnalytics,
    "ProviderDetail": ProviderDetail,
    "ProviderLicenses": ProviderLicenses,
    "ProviderOnboarding": ProviderOnboarding,
    "ProviderOverview": ProviderOverview,
    "ProviderPortal": ProviderPortal,
    "ProviderRegister": ProviderRegister,
    "Providers": Providers,
    "ReferralBuilder": ReferralBuilder,
    "ReferralTracking": ReferralTracking,
    "Register": Register,
    "Settings": Settings,
    "Sites": Sites,
    "SubscriptionGating": SubscriptionGating,
    "Subscriptions": Subscriptions,
    "UsersRoles": UsersRoles,
    "ProviderOpeningsManager": ProviderOpeningsManager,
    "ProviderReferralsView": ProviderReferralsView,
    "ProviderProfileSettings": ProviderProfileSettings,
}

export const pagesConfig = {
    mainPage: "Overview",
    Pages: PAGES,
    Layout: __Layout,
};