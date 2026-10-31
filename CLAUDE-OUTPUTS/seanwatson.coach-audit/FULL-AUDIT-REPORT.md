# SEO audit: seanwatson.coach

Audited 31 October 2026 with Claude SEO v2.5.0. All 5 pages in the sitemap were checked: Home, About, Coaching, Community, Contact.

## Executive summary

**SEO health score: 56 / 100**

| Category | Weight | Score |
|---|---|---|
| Technical SEO | 22% | 72 |
| Content quality | 23% | 55 |
| On-page SEO | 20% | 62 |
| Schema / structured data | 10% | 35 |
| Performance (Core Web Vitals) | 10% | 40 |
| AI search readiness | 10% | 50 |
| Images | 5% | 60 |

**Business type:** online professional service (1-on-1 coaching, delivered worldwide over Zoom). This isn't a local business, so local SEO checks were skipped.

The foundations are sound. Google can crawl and index every page, the copy is sharp, and the offer is clear within 5 seconds of landing.

The problem is reach. The site has 5 pages and about 1,900 words, and every page is about you. There's nothing on it that matches what a stranger types into Google before they've heard of you. So right now it only ranks for your name, and even there it comes 5th.

### Top 5 issues

1. **teachersean.ca has an expired security certificate** (since 21 June 2026). Anyone who clicks an old link gets a browser security warning instead of your site.
2. **You come 5th in Google for "Sean Watson English coach".** Your podcast episode, LinkedIn and YouTube all rank above the site, and a US ADHD coach called Sean Watson is in the same results.
3. **There's no content for strangers to find.** No articles, no lessons, no pages built around a problem a professional would search for.
4. **Search engines and link previews see a messier description than visitors do.** Gamma sends one description in the page code, then swaps in your good one with JavaScript. LinkedIn previews, Bing and AI crawlers get the messy one.
5. **Every page loads about 4.8 MB of Gamma's JavaScript.** That's a platform limit you can't fix from inside Gamma, but it costs you on mobile.

### Top 5 quick wins

1. Renew the teachersean.ca certificate, or point the domain at a host that does it automatically, and redirect it to seanwatson.coach. (30 minutes)
2. Rewrite the 4 inner-page titles so each one says what the page is about. (15 minutes)
3. Expand the homepage schema with links to your LinkedIn, YouTube, podcast and Skool profiles so Google ties them all to one Sean Watson. (30 minutes)
4. Add alt text to your headshot on the About page. (2 minutes)
5. Fix the social-preview description in Gamma so LinkedIn shares show clean text. (10 minutes)

---

## Technical SEO (72)

### What works

- HTTPS everywhere. `http://` and `www.` both 301-redirect to `https://seanwatson.coach/`.
- robots.txt allows everything and points to the sitemap.
- The sitemap lists all 5 pages with current `lastmod` dates.
- Every page has a self-referencing canonical and `index, follow`.
- Gamma renders the page text on the server, so crawlers that don't run JavaScript still read your copy. (Plenty of site builders fail this.)
- Unknown URLs return a real 404.

### Findings

**High: teachersean.ca certificate expired on 21 June 2026.**
Certificate Transparency logs show Let's Encrypt renewed it every 90 days until March 2026, then stopped. `http://teachersean.ca` redirects to `https://`, which now fails with "certificate has expired". Any link from an old newsletter, directory listing, LinkedIn post or student bookmark lands on a browser warning page, and Google can't pass that link's value to your new domain.
*Fix:* renew the certificate (or move DNS to a host that renews automatically) and set a 301 redirect from every teachersean.ca URL to the matching seanwatson.coach page, or to the homepage.
*How you'll know it worked:* `https://teachersean.ca` loads without a warning and lands on seanwatson.coach.

**Medium: the description in the page code doesn't match the one visitors see.**
Gamma stores your good description ("Advanced English coaching for senior professionals: clarity, executive presence, and the confidence to speak up in any room. Book your free discovery call.") but sends a different, auto-generated one in the HTML:

> Coaching by Sean Watson [line break] Executive Communication Coach for Senior Professionals [line break] Advanced English coaching for senior professionals at B2 and beyond... (305 characters)

JavaScript swaps in the good one after the page loads. Google runs JavaScript, so it usually sees the right one. But LinkedIn, WhatsApp, Bing and the AI crawlers (ChatGPT, Claude, Perplexity) mostly read the raw HTML. The `og:description` used for social previews is the messy version even after JavaScript runs. The Coaching, Community and Contact pages have the same problem, with button text ("Book Your Free Discovery Call") stuck on the end.
*Fix:* in each page's settings in Gamma, check the SEO description and the social preview description and make them match. If they're already set correctly, this is a Gamma bug worth reporting to their support.
*How you'll know it worked:* paste seanwatson.coach into the LinkedIn Post Inspector and the preview shows your clean description.

**Low: `/about/` (with a trailing slash) returns 404.**
It should redirect to `/about`. People type it that way and some sites link that way. Gamma controls this, so it may not be fixable. Mention it if you contact their support.

**Low: no security headers** (HSTS, Content-Security-Policy). Gamma controls these. They don't affect rankings directly.

**Low: Privacy Policy and Terms live on separate `gamma.site` subdomains.** They'd look more trustworthy at `seanwatson.coach/privacy` and `/terms`.

---

## Content quality (55)

### What works

- The audience is unmistakable: B2+ senior professionals. The "This may not be for you if..." block is a confident move, and it filters out bad-fit leads before they book.
- Strong credibility signals: TESL certification, 15+ years, 1,000+ clients, named employers (Google, Microsoft, Deloitte, Deutsche Bank, KPMG), and the opera background as a real differentiator.
- The testimonials name a role, country and type of coaching. That's much better than "Great teacher! – M."
- The stats on the About page cite their sources (ETS, Pearson, Preply/Leanlab).

### Findings

**High: no content that matches what people search for.**
About 1,900 words across the whole site, all of it about you and your services. Your ideal client doesn't search "Sean Watson". They search something like "how to sound more confident in English meetings", "executive presence for non-native speakers" or "French accent English pronunciation coach". The site has nothing for those searches.

You already make this content every week: lessons for The English Edge, podcast episodes with Howie, newsletter issues. None of it lives on seanwatson.coach.
*Fix:* add a `/lessons` or `/insights` section and republish 1 piece a week from what you already make. Start with the topics your clients actually ask about (meetings, presentations, accent clarity, interviews). See the action plan for a starting list.
*How you'll know it worked:* in Google Search Console, the number of queries that don't include your name starts rising within 8 to 12 weeks.

**Medium: services are one paragraph each.**
Pronunciation for clarity, executive presence, public speaking, interview coaching, IELTS and CELPIP all share one page, with 1 to 2 sentences each. A dedicated page for your strongest service gives Google something specific to rank.
*Best candidates:* **pronunciation and accent clarity**, because the opera-trained ear is a story no competitor can tell, and **accent clarity for French speakers**, given your Quebec clients and the Emmanuel testimonial. CELPIP Speaking is a real search market, but Preply, CELPIP's own prep programs and test-prep companies own those results, and it pulls toward a lower-level audience than you want.

**Medium: no pricing signal.**
"How much does executive English coaching cost" is a real search, and visitors who can't find a price often leave rather than book a call to ask. You don't need to list $50 CAD/hour. Even "Sessions from $X" or "Packages start at..." helps. This one's your call: some coaches hide pricing on purpose.

**Low: the About page is mostly stats about the English market.**
The "Why invest in your English?" stats are fine, but they're about the world, not you. A short paragraph on how you work (how you diagnose someone in the first session, what changes for clients after 3 months) would carry more weight with Google and with readers. Where did you get your TESL certification? Which opera companies did you sing with? Specifics like that build trust.

**Low: no link to your newsletter.** Substack is your most regular piece of writing, and the site doesn't mention it.

---

## On-page SEO (62)

### What works

- Homepage title (51 characters) is strong: `Sean Watson | Executive English Communication Coach`.
- Every page has exactly 1 H1.
- Internal links are consistent. Every page links to every other page, and the booking link appears 2 to 3 times per page.

### Findings

**High: inner-page titles waste the most important line on the page.**

| Page | Current title | Suggested title |
|---|---|---|
| About | About \| Sean Watson (19 chars) | About Sean Watson, TESL-Certified English Communication Coach |
| Coaching | Coaching \| Sean Watson (22) | Executive English Coaching: Presence, Pronunciation, Public Speaking |
| Community | Community \| Sean Watson (23) | The English Edge: Small-Group English Conversation for Professionals |
| Contact | Contact \| Sean Watson (21) | Book a Free Discovery Call \| Sean Watson |

**Medium: inner-page H1s don't say what the page is.**
"Meet Your Coach", "Let's Talk" and "The English Edge" read well as headlines but tell Google nothing. Keep the voice and add the topic, e.g. "Meet Sean Watson, Your English Communication Coach".

**Low: heading levels skip** (H2 straight to H4 on the homepage). It's a Gamma template issue. Low impact.

---

## Schema / structured data (35)

### What works

- The homepage has `Person` and `ProfessionalService` schema, linked to each other with `@id`. That's the right structure.

### Findings

**High: the schema is too thin to tell Google which Sean Watson you are.**
Right now it says your name, job title and a one-line description. Nothing ties the site to your LinkedIn, YouTube, podcast or Skool profiles, and those are the pages beating you in search. Add `sameAs` links, an `image`, `knowsAbout`, `hasCredential` (TESL), `areaServed` and `knowsLanguage`. A ready-to-paste version is in ACTION-PLAN.md.

**Medium: the schema only exists on the homepage and is injected by Google Tag Manager.**
Google can read schema added by JavaScript, but AI crawlers mostly can't. If Gamma's custom-code setting puts code straight into the page HTML, move it there. Then add `Service` schema to the Coaching page and `PodcastSeries` for The Fluent Edge.

**Info: the Coaching page has an FAQ section without FAQPage schema.** That's fine. Google retired FAQ rich results for all sites in May 2026, so adding it wouldn't change anything in search results.

---

## Performance (40)

| Page | LCP desktop | LCP mobile | CLS |
|---|---|---|---|
| Home | 5.7 s | 3.7 s | 0.00 |
| About | 3.3 s | 3.0 s | 0.00 |
| Coaching | 3.6 s | 3.4 s | 0.01 |
| Community | 2.9 s | 4.0 s | 0.00 |
| Contact | 2.7 s | 2.8 s | 0.00 |

*These are lab measurements from a cloud server and run slower than a real visit. Use them to compare pages, not as Google's numbers. Google's free PageSpeed API had hit its daily limit, so field data from real Chrome users wasn't available.*

A full Lighthouse mobile run on the homepage scored **Performance 27, Accessibility 95, Best Practices 79, SEO 100**.

### Findings

**Medium: Gamma loads about 4.8 MB of JavaScript on every page,** mostly its own editor code (one file alone is 1.8 MB). Lighthouse found 2.6 MB of it unused. The page weighs 5.4 MB in total. Your images (about 200 KB) are not the problem.

You can't fix this from inside Gamma. Layout stability is perfect (CLS 0), and the text is readable before the JavaScript finishes, which softens the hit. But on a mid-range phone on 4G, the page will feel slow to respond to taps.

*Decision for later:* if the site becomes a real content hub (see Content), consider moving it to a lighter platform such as Framer, Webflow or a static site. Not urgent for a 5-page site.

**Low: Google Tag Manager adds 119 KB.** Fine if you use it. If it only injects the schema, moving the schema into the page lets you drop GTM entirely.

---

## AI search readiness (50)

### What works

- robots.txt allows every AI crawler. GPTBot, ClaudeBot and PerplexityBot all get a 200 response.
- Your copy is in the raw HTML, so AI crawlers can read it.
- Your podcast is on Captivate, YouTube, Spotify and Apple. AI tools pick up podcast episode pages, and one already ranks #1 for your name.

### Findings

**High: nothing on the site is quotable.**
When someone asks ChatGPT or Perplexity "how can a non-native speaker build executive presence in English meetings?", the AI cites pages that answer that exact question in plain language. Your site describes services but doesn't answer any questions. The content hub fixes this too.

**Medium: AI tools can't tell which Sean Watson you are** (same cause as the schema finding). Fix the `sameAs` links and make sure your LinkedIn, Skool and podcast bios all link back to seanwatson.coach.

**Low: no `/llms.txt` file.** No AI company has confirmed it uses llms.txt. Skip it until the site has real content.

---

## Images (60)

- Images are served as WebP through Gamma's image proxy. Good.
- **Medium: your headshot on the About page has no alt attribute at all.** Use: `Sean Watson, English communication coach`.
- **Low:** the 2 homepage photos and the community photo have empty alt text. Fine if they're decorative. Give them short descriptions if they show something specific.
- **Low:** images don't declare width and height. Gamma controls this, and layout shift is already 0.

---

## How this audit was run

- Rendered all 5 pages in headless Chromium at desktop (1366px) and mobile (390px) widths, then checked titles, descriptions, canonicals, headings, links, images and schema.
- Compared the raw server HTML with the rendered page to catch JavaScript-only content.
- Ran Lighthouse 12.6 (mobile) on the homepage.
- Checked robots.txt, the sitemap, redirects, 404 handling and AI crawler access.
- Checked teachersean.ca's certificate history in public Certificate Transparency logs.
- Ran 2 Google searches: "Sean Watson English coach" and "CELPIP speaking coach online one-on-one".

**Not covered:** backlink data, Google Search Console traffic and indexing data, and field Core Web Vitals. These need a Search Console connection or API keys.
