# Launch checklist (A–Z)

Saved on 2026-11-08 at the owner's request, for review **after the next full check**. Items are unchecked on purpose: none has been assessed against this list yet. When a full verification runs, mark each item with evidence (✅ verified, ⚠ partial, ❌ missing, ⏳ needs owner input) and report the result to the owner.

## A. Architecture & Planning
- [ ] Business goals and measurable KPIs
- [ ] Target audience and user personas
- [ ] Competitor and market research
- [ ] Website sitemap and information architecture
- [ ] Page hierarchy and URL structure
- [ ] Technology stack and hosting architecture
- [ ] Content management strategy
- [ ] Environment separation: local, staging, production
- [ ] Scalability, maintenance and technical documentation
- [ ] Acceptance criteria and project scope

## B. Branding & UI Design
- [ ] Brand identity, logo and visual guidelines
- [ ] Color system and contrast ratios
- [ ] Typography and responsive type scale
- [ ] Design tokens and reusable components
- [ ] Consistent headers, footers and navigation
- [ ] Buttons, forms and interaction states
- [ ] Desktop, tablet and mobile layouts
- [ ] Dark/light mode where appropriate
- [ ] Professional imagery, icons and illustrations
- [ ] Visual quality and brand consistency review

## C. Content & Copywriting
- [ ] Unique content for each important page
- [ ] Clear value proposition and headlines
- [ ] Service and product descriptions
- [ ] Conversion-focused calls to action
- [ ] Proof, testimonials and verified case studies
- [ ] FAQ content addressing real questions
- [ ] Grammar, readability and localization
- [ ] Image captions and descriptive alternative text
- [ ] Content ownership and editorial workflow
- [ ] Content freshness and review schedule

## D. Domain, DNS & Delivery
- [ ] Domain ownership and renewal controls
- [ ] DNS records verified
- [ ] HTTPS certificates and automatic renewal
- [ ] Canonical www or non-www redirects
- [ ] DNSSEC where supported
- [ ] CDN configuration
- [ ] Correct HTTP redirects and status codes
- [ ] Staging and production domain isolation
- [ ] Domain email authentication: SPF, DKIM, DMARC
- [ ] Domain and DNS recovery procedures

## E. Experience & Accessibility
- [ ] Keyboard navigation
- [ ] Visible focus indicators
- [ ] Semantic HTML and landmark structure
- [ ] Proper heading hierarchy
- [ ] Accessible labels and error messages
- [ ] Screen reader compatibility
- [ ] Touch target sizing
- [ ] Reduced-motion support
- [ ] Color contrast and zoom testing
- [ ] WCAG 2.2 AA assessment

## F. Forms & Functional QA
- [ ] All forms submit successfully
- [ ] Server-side validation
- [ ] Required field and format checks
- [ ] Spam and abuse prevention
- [ ] Rate limiting
- [ ] Success and error feedback
- [ ] Duplicate submission protection
- [ ] Email and CRM delivery verification
- [ ] Broken link and button testing
- [ ] End-to-end critical user journey tests

## G. Google Search & Indexing
- [ ] Google Search Console setup
- [ ] Domain property verification
- [ ] XML sitemap generation and submission
- [ ] robots.txt validation
- [ ] Indexable pages return HTTP 200
- [ ] No accidental noindex or X-Robots-Tag blocks
- [ ] Correct canonical tags
- [ ] Internal links to important pages
- [ ] Index coverage and crawl issue monitoring
- [ ] URL Inspection for priority pages

## H. Hosting & Infrastructure
- [ ] Hosting platform selection
- [ ] Production environment configuration
- [ ] Staging or preview deployments
- [ ] Secrets and environment variable management
- [ ] Build and deployment reliability
- [ ] Caching and compression
- [ ] Regional availability and latency
- [ ] Resource limits and scaling
- [ ] Uptime and incident monitoring
- [ ] Infrastructure documentation

## I. Images, Media & Assets
- [ ] Modern image formats where suitable
- [ ] Responsive image sizes and srcset
- [ ] Lazy loading below-the-fold media
- [ ] Hero image loading priority
- [ ] Image compression and dimension attributes
- [ ] Optimized fonts and font loading
- [ ] Video compression and poster images
- [ ] 3D fallback images
- [ ] Asset licensing and attribution register
- [ ] Media accessibility and mobile performance

## J. JavaScript & Frontend Quality
- [ ] TypeScript or equivalent type checks
- [ ] Linting and code formatting
- [ ] Avoid unnecessary client-side JavaScript
- [ ] Code splitting and lazy loading
- [ ] Error boundaries where relevant
- [ ] No browser console errors
- [ ] Hydration and rendering correctness
- [ ] Cross-browser testing
- [ ] Memory leak and event cleanup checks
- [ ] Dependency version and compatibility review

## K. Keywords & Search Intent
- [ ] Primary and secondary keyword research
- [ ] Keyword-to-page mapping
- [ ] Search intent classification
- [ ] Unique title tags and meta descriptions
- [ ] One descriptive main heading per page
- [ ] Descriptive URL slugs
- [ ] Internal linking and anchor text
- [ ] Topic clusters and supporting content
- [ ] Keyword cannibalization checks
- [ ] Search performance and ranking measurement

## L. Local SEO
- [ ] Google Business Profile where eligible
- [ ] Accurate business name, address and phone
- [ ] Relevant service categories
- [ ] Service areas and location landing pages
- [ ] Consistent local citations
- [ ] Business hours and contact details
- [ ] Review acquisition and response process
- [ ] LocalBusiness structured data where applicable
- [ ] Local keyword research
- [ ] Location page quality and duplication checks

## M. Mobile Optimization
- [ ] Responsive layouts across screen sizes
- [ ] No horizontal overflow
- [ ] Mobile menu and navigation behavior
- [ ] Sticky header and safe-area handling
- [ ] Touch-friendly forms and controls
- [ ] Readable typography without zoom
- [ ] Mobile image and video optimization
- [ ] Real-device performance testing
- [ ] Mobile 3D and animation fallback
- [ ] Portrait and landscape checks

## N. Navigation & Internal Links
- [ ] Logical primary navigation
- [ ] Clear service and product hierarchy
- [ ] Footer navigation
- [ ] Breadcrumbs where appropriate
- [ ] Contextual internal linking
- [ ] No broken internal or external links
- [ ] No orphaned important pages
- [ ] Descriptive anchor text
- [ ] 404 page with recovery paths
- [ ] Search or filters for larger websites

## O. On-Page SEO & Structured Data
- [ ] Unique metadata per indexable page
- [ ] Canonical URL implementation
- [ ] Open Graph and social metadata
- [ ] Twitter/X card metadata
- [ ] Organization and WebSite structured data where relevant
- [ ] BreadcrumbList schema where applicable
- [ ] Product, Article, FAQ or Service markup only when appropriate
- [ ] JSON-LD validation
- [ ] Hreflang for multilingual regional alternatives
- [ ] No misleading or unsupported rich-result markup

## P. Performance & Core Web Vitals
- [ ] LCP target at or below 2.5 seconds
- [ ] INP target at or below 200 milliseconds
- [ ] CLS target at or below 0.1
- [ ] Real-user field data monitoring
- [ ] PageSpeed Insights and Lighthouse review
- [ ] Bundle size and third-party script budgets
- [ ] Critical CSS and resource priorities
- [ ] Caching and CDN effectiveness
- [ ] Slow-network and low-end-device testing
- [ ] Performance regression testing

## Q. Quality Assurance & Testing
- [ ] Unit tests for critical logic
- [ ] Integration tests
- [ ] End-to-end browser tests
- [ ] Responsive visual regression tests
- [ ] Accessibility automated and manual tests
- [ ] Cross-browser compatibility
- [ ] Broken link scans
- [ ] Form and payment journey tests
- [ ] Error state and empty state tests
- [ ] Release acceptance and regression checklist

## R. Robots, Crawling & Redirects
- [ ] Production robots.txt permits intended crawling
- [ ] Staging environments blocked from public indexing
- [ ] XML sitemap contains only canonical indexable URLs
- [ ] 301/308 permanent redirects where appropriate
- [ ] 404 and 410 responses used correctly
- [ ] No redirect chains or loops
- [ ] Canonicalization across URL variants
- [ ] Faceted URL and parameter controls
- [ ] No soft 404 pages
- [ ] Server-rendered content available to crawlers

## S. Security & Privacy
- [ ] TLS and HTTPS enforcement
- [ ] Security headers including CSP and HSTS
- [ ] Authentication and authorization controls
- [ ] Server-side input validation and output encoding
- [ ] CSRF protection where applicable
- [ ] XSS, injection and SSRF defenses
- [ ] Secrets management and key rotation
- [ ] Dependency and supply-chain scanning
- [ ] Access logging, monitoring and incident response
- [ ] Privacy policy, retention and consent controls

## T. Technical SEO
- [ ] Crawlable HTML and links
- [ ] Correct HTTP status codes
- [ ] Server-side rendering or static rendering strategy
- [ ] Duplicate content controls
- [ ] Canonical URL consistency
- [ ] Pagination and faceted navigation strategy
- [ ] Structured data consistency with visible content
- [ ] Mobile-first rendering parity
- [ ] International SEO and hreflang where needed
- [ ] Technical crawl audit before launch

## U. UX & Conversion Optimization
- [ ] Clear above-the-fold proposition
- [ ] Obvious primary calls to action
- [ ] Minimal-friction lead capture
- [ ] Trust and credibility signals
- [ ] Readable content hierarchy
- [ ] Accessible interactive feedback
- [ ] Conversion funnel mapping
- [ ] Booking and contact journeys
- [ ] A/B test hypotheses
- [ ] Behavioral analytics with privacy controls

## V. Version Control & Deployment
- [ ] Git repository and protected branches
- [ ] Pull request and code review workflow
- [ ] CI checks for builds and tests
- [ ] Dependency lockfiles
- [ ] Reproducible production builds
- [ ] Preview environments
- [ ] Automated deployment where appropriate
- [ ] Rollback strategy
- [ ] Release notes and change tracking
- [ ] Production deployment approval gates

## W. Web Analytics & Automation
- [ ] Privacy-compliant analytics setup
- [ ] Search Console integration
- [ ] Conversion event tracking
- [ ] Tag management governance
- [ ] CRM lead capture integration
- [ ] Workflow and notification automation
- [ ] Attribution and UTM tracking
- [ ] Consent-aware tracking behavior
- [ ] Error and funnel dashboards
- [ ] Lead delivery and automation failure alerts

## X. XML, APIs & Integrations
- [ ] XML sitemap and feed validation
- [ ] API authentication and authorization
- [ ] API input/output schema validation
- [ ] Rate limits and abuse controls
- [ ] Webhook signature verification
- [ ] Idempotent webhook and payment handling
- [ ] Timeouts, retries and backoff
- [ ] Third-party API error handling
- [ ] Integration contract tests
- [ ] API versioning and deprecation monitoring

## Y. Year-Round Maintenance
- [ ] Regular security patching
- [ ] Dependency updates
- [ ] Automated backups and restore tests
- [ ] Domain and certificate renewal checks
- [ ] Uptime and error monitoring
- [ ] SEO crawl and indexing reviews
- [ ] Content freshness reviews
- [ ] Performance and accessibility regression checks
- [ ] Periodic access and permission audits
- [ ] Incident drills and disaster recovery testing

## Z. Zero-Defect Launch Gate
- [ ] No known critical security vulnerabilities
- [ ] No broken critical user journeys
- [ ] No accidental production indexing blocks
- [ ] No exposed secrets
- [ ] Verified backups and rollback path
- [ ] Verified form, CRM and notification delivery
- [ ] Core Web Vitals and accessibility reviewed
- [ ] Legal notices and consent reviewed
- [ ] Monitoring and ownership assigned
- [ ] Documented go/no-go approval and post-launch checks
