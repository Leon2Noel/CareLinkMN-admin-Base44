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
import AuditLogs from './pages/AuditLogs';
import Capabilities from './pages/Capabilities';
import Compliance from './pages/Compliance';
import Funding from './pages/Funding';
import LicenseMapping from './pages/LicenseMapping';
import LicenseTaxonomy from './pages/LicenseTaxonomy';
import Licenses from './pages/Licenses';
import Marketplace from './pages/Marketplace';
import Matching from './pages/Matching';
import MatchingConfig from './pages/MatchingConfig';
import MatchingDashboard from './pages/MatchingDashboard';
import MatchingSimulation from './pages/MatchingSimulation';
import Openings from './pages/Openings';
import Overview from './pages/Overview';
import Programs from './pages/Programs';
import ProviderDetail from './pages/ProviderDetail';
import Providers from './pages/Providers';
import Settings from './pages/Settings';
import Sites from './pages/Sites';
import SubscriptionGating from './pages/SubscriptionGating';
import Subscriptions from './pages/Subscriptions';
import UsersRoles from './pages/UsersRoles';
import ProviderRegister from './pages/ProviderRegister';
import ProviderPortal from './pages/ProviderPortal';
import Home from './pages/Home';
import CaseManagerSearch from './pages/CaseManagerSearch';
import OpeningDetail from './pages/OpeningDetail';
import ReferralBuilder from './pages/ReferralBuilder';
import ProviderLicenses from './pages/ProviderLicenses';
import GetStarted from './pages/GetStarted';
import Register from './pages/Register';
import ReferralTracking from './pages/ReferralTracking';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AuditLogs": AuditLogs,
    "Capabilities": Capabilities,
    "Compliance": Compliance,
    "Funding": Funding,
    "LicenseMapping": LicenseMapping,
    "LicenseTaxonomy": LicenseTaxonomy,
    "Licenses": Licenses,
    "Marketplace": Marketplace,
    "Matching": Matching,
    "MatchingConfig": MatchingConfig,
    "MatchingDashboard": MatchingDashboard,
    "MatchingSimulation": MatchingSimulation,
    "Openings": Openings,
    "Overview": Overview,
    "Programs": Programs,
    "ProviderDetail": ProviderDetail,
    "Providers": Providers,
    "Settings": Settings,
    "Sites": Sites,
    "SubscriptionGating": SubscriptionGating,
    "Subscriptions": Subscriptions,
    "UsersRoles": UsersRoles,
    "ProviderRegister": ProviderRegister,
    "ProviderPortal": ProviderPortal,
    "Home": Home,
    "CaseManagerSearch": CaseManagerSearch,
    "OpeningDetail": OpeningDetail,
    "ReferralBuilder": ReferralBuilder,
    "ProviderLicenses": ProviderLicenses,
    "GetStarted": GetStarted,
    "Register": Register,
    "ReferralTracking": ReferralTracking,
}

export const pagesConfig = {
    mainPage: "Overview",
    Pages: PAGES,
    Layout: __Layout,
};