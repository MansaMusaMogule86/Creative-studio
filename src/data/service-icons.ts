// One meaningful Lucide icon per service (lucide.dev, ISC licence).
// Keyed by service slug from src/data/divisions.ts.
import IAppWindow from '@lucide/astro/icons/app-window';
import IBookOpen from '@lucide/astro/icons/book-open';
import IBookOpenText from '@lucide/astro/icons/book-open-text';
import IBot from '@lucide/astro/icons/bot';
import IBox from '@lucide/astro/icons/box';
import IBriefcaseBusiness from '@lucide/astro/icons/briefcase-business';
import ICamera from '@lucide/astro/icons/camera';
import IChartColumnBig from '@lucide/astro/icons/chart-column-big';
import IChartPie from '@lucide/astro/icons/chart-pie';
import IClapperboard from '@lucide/astro/icons/clapperboard';
import ICodeXml from '@lucide/astro/icons/code-xml';
import ICog from '@lucide/astro/icons/cog';
import ICompass from '@lucide/astro/icons/compass';
import IContact from '@lucide/astro/icons/contact';
import ICpu from '@lucide/astro/icons/cpu';
import IFileText from '@lucide/astro/icons/file-text';
import IFilm from '@lucide/astro/icons/film';
import IFlaskConical from '@lucide/astro/icons/flask-conical';
import IGauge from '@lucide/astro/icons/gauge';
import IGem from '@lucide/astro/icons/gem';
import IHandCoins from '@lucide/astro/icons/hand-coins';
import IImages from '@lucide/astro/icons/images';
import ILayers from '@lucide/astro/icons/layers';
import ILayoutTemplate from '@lucide/astro/icons/layout-template';
import ILightbulb from '@lucide/astro/icons/lightbulb';
import IMagnet from '@lucide/astro/icons/magnet';
import IMail from '@lucide/astro/icons/mail';
import IMapPin from '@lucide/astro/icons/map-pin';
import IMegaphone from '@lucide/astro/icons/megaphone';
import IMessageSquareText from '@lucide/astro/icons/message-square-text';
import IMic from '@lucide/astro/icons/mic';
import IMousePointer2 from '@lucide/astro/icons/mouse-pointer-2';
import IMousePointerClick from '@lucide/astro/icons/mouse-pointer-click';
import INetwork from '@lucide/astro/icons/network';
import IOrbit from '@lucide/astro/icons/orbit';
import IPackage from '@lucide/astro/icons/package';
import IPalette from '@lucide/astro/icons/palette';
import IPenTool from '@lucide/astro/icons/pen-tool';
import IPlug from '@lucide/astro/icons/plug';
import IPuzzle from '@lucide/astro/icons/puzzle';
import IRefreshCw from '@lucide/astro/icons/refresh-cw';
import IRocket from '@lucide/astro/icons/rocket';
import IScanEye from '@lucide/astro/icons/scan-eye';
import ISearch from '@lucide/astro/icons/search';
import IShare2 from '@lucide/astro/icons/share-2';
import IShoppingCart from '@lucide/astro/icons/shopping-cart';
import ISmartphone from '@lucide/astro/icons/smartphone';
import ISparkles from '@lucide/astro/icons/sparkles';
import IStore from '@lucide/astro/icons/store';
import IUsers from '@lucide/astro/icons/users';
import IWandSparkles from '@lucide/astro/icons/wand-sparkles';
import IWorkflow from '@lucide/astro/icons/workflow';

export const SERVICE_ICONS = {
  'premium-websites': ILayoutTemplate,
  'web-applications': IAppWindow,
  'mobile-applications': ISmartphone,
  'e-commerce': IShoppingCart,
  'saas-platforms': ILayers,
  'ux-ui-design': IPalette,
  'custom-software': ICodeXml,
  'api-integrations': IPlug,
  'digital-product-development': IPackage,
  'ai-agents': IBot,
  'ai-voice-assistants': IMic,
  'intelligent-chatbots': IMessageSquareText,
  'workflow-automation': IWorkflow,
  'business-process-automation': ICog,
  'ai-crm': IContact,
  'knowledge-assistants': IBookOpen,
  'computer-vision': IScanEye,
  'custom-ai-integrations': IPuzzle,
  'ai-transformation': ISparkles,
  'seo': ISearch,
  'local-seo': IMapPin,
  'google-business-profile': IStore,
  'social-media-management': IShare2,
  'paid-advertising': IMegaphone,
  'performance-marketing': IGauge,
  'conversion-optimization': IMousePointerClick,
  'lead-generation': IMagnet,
  'marketing-automation': IMail,
  'analytics-attribution': IChartColumnBig,
  'content-strategy': IFileText,
  'growth-experimentation': IFlaskConical,
  'brand-identity': IGem,
  'logo-design': IPenTool,
  'creative-direction': ILightbulb,
  'motion-graphics': IFilm,
  '3d-visual-design': IBox,
  'campaign-concepts': IClapperboard,
  'digital-storytelling': IBookOpenText,
  'content-production': ICamera,
  'social-media-creative': IImages,
  'brand-experiences': IWandSparkles,
  'interactive-experiences': IMousePointer2,
  'business-consulting': IBriefcaseBusiness,
  'digital-transformation': IRefreshCw,
  'product-strategy': ICompass,
  'technology-consulting': ICpu,
  'startup-strategy': IRocket,
  'business-model-development': IChartPie,
  'cx-strategy': IUsers,
  'revenue-optimization': IHandCoins,
  'systems-architecture': INetwork,
  'digital-ecosystem-planning': IOrbit,
} as const;
export type ServiceIcon = (typeof SERVICE_ICONS)[keyof typeof SERVICE_ICONS];
