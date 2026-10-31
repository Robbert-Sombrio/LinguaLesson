# Action plan: seanwatson.coach

Health score today: **57 / 100**. Phases 1 and 2 should bring it into the high 60s. Phase 3 is what gets you found by people who haven't heard of you yet.

Each item lists what it depends on and how you'll know it worked.

---

## Phase 1: this week (about 1 hour total)

### 1. Rewrite the 4 inner-page titles (High)
In Gamma, open each page's settings and change the SEO title:

| Page | New title |
|---|---|
| About | About Sean Watson, TESL-Certified English Communication Coach |
| Coaching | Executive English Coaching: Presence, Pronunciation, Public Speaking |
| Community | The English Edge: Small-Group English Conversation for Professionals |
| Contact | Book a Free Discovery Call \| Sean Watson |

- **Worked if:** a `site:seanwatson.coach` search on Google shows the new titles within 2 to 3 weeks.

### 2. Fix the social and SEO descriptions (Medium)
On each page in Gamma, check that the SEO description and the social preview description are both set and identical. Then test the homepage in the LinkedIn Post Inspector (linkedin.com/post-inspector).
- **Worked if:** the LinkedIn preview shows your clean, single-line description.
- **If it doesn't:** it's a Gamma bug. Send their support this: "The server-rendered `<meta name="description">` and `og:description` use auto-generated text from the first card, not the page's saved SEO description. The saved one only appears after hydration."

### 3. Add alt text to your About-page headshot (Medium)
Alt text: `Sean Watson, English communication coach`
- **Worked if:** Lighthouse stops flagging the image.

---

## Phase 2: weeks 2 to 3

### 4. Expand the schema (High)
Replace what Google Tag Manager currently injects with the version below. Paste it into Gamma's custom-code / head section if that option exists. If it doesn't, keep it in GTM.

Fill in or remove the `[brackets]` before publishing.

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://seanwatson.coach/#person",
      "name": "Sean Watson",
      "jobTitle": "Executive English Communication Coach",
      "url": "https://seanwatson.coach/",
      "image": "[URL of your headshot]",
      "description": "TESL-certified English communication coach and former opera singer. Coaches B2 to C2 senior professionals on executive presence, pronunciation for clarity and public speaking.",
      "knowsAbout": ["Business English", "Executive presence", "English pronunciation", "Accent clarity", "Public speaking", "IELTS Speaking", "CELPIP Speaking"],
      "knowsLanguage": ["en", "fr"],
      "hasCredential": {
        "@type": "EducationalOccupationalCredential",
        "credentialCategory": "certificate",
        "name": "TESL Certification"
      },
      "sameAs": [
        "https://www.linkedin.com/in/sean-watson/",
        "https://www.youtube.com/@fluentedgepodcast",
        "https://podcasts.apple.com/ca/podcast/the-fluent-edge-podcast/id1815545019",
        "https://open.spotify.com/show/3N2bcnmNeyHOowKV13bjpM",
        "https://the-fluent-edge-podcast.captivate.fm/",
        "https://www.skool.com/@sean-watson-5781",
        "[your Substack URL]"
      ]
    },
    {
      "@type": "ProfessionalService",
      "@id": "https://seanwatson.coach/#service",
      "name": "Sean Watson Coaching",
      "url": "https://seanwatson.coach/",
      "description": "1-on-1 executive English communication coaching for senior professionals, delivered worldwide over Zoom.",
      "founder": { "@id": "https://seanwatson.coach/#person" },
      "areaServed": "Worldwide",
      "availableLanguage": "en",
      "address": { "@type": "PostalAddress", "addressCountry": "CA" }
    },
    {
      "@type": "PodcastSeries",
      "@id": "https://seanwatson.coach/#podcast",
      "name": "The Fluent Edge Podcast",
      "url": "https://the-fluent-edge-podcast.captivate.fm/",
      "author": { "@id": "https://seanwatson.coach/#person" }
    }
  ]
}
```

Remove `"fr"` from `knowsLanguage` if you don't coach in French.

- **Depends on:** nothing, but it pays off more once item 5 is done.
- **Worked if:** the Rich Results Test (search.google.com/test/rich-results) shows Person, ProfessionalService and PodcastSeries with no errors.
- **Watch:** over 1 to 3 months, seanwatson.coach should move up in the "Sean Watson English coach" results.

### 5. Make every profile point back to the site (High)
LinkedIn (Contact info and Featured), Skool profile, Captivate show page, YouTube channel "Links" section, Substack "About" page. Each should link to `https://seanwatson.coach`.
- **Worked if:** every public profile has a working link to seanwatson.coach.

### 6. Rewrite the inner-page H1s (Medium)
Keep your voice and add the topic.
- About: "Meet Sean Watson, Your English Communication Coach"
- Contact: "Let's Talk: Book Your Free Discovery Call"
- Community: "The English Edge: Conversation Practice for Professionals"

### 7. Link your newsletter (Low)
Add Substack to the footer next to Listen and Follow.

---

## Phase 3: month 2 onwards (content and authority)

### 8. Start a `/lessons` section on the site (High)
This is the single biggest lever. You already write a lesson, a newsletter issue and a podcast episode every week. Republish 1 a week on seanwatson.coach, edited to answer one specific question.

Starting topics, picked to match what your clients bring to sessions:

1. How to interrupt politely in an English meeting (with 10 real phrases)
2. Why you sound less confident in English than in your first language, and what to do about it
3. Word stress: the pronunciation fix that makes senior professionals easier to understand
4. Executive presence for non-native English speakers: what it actually sounds like
5. 12 phrases for disagreeing with your boss in English without sounding rude
6. French speakers: the 5 English sounds that cause the most misunderstandings
7. How to answer "Tell me about yourself" in a senior-role interview in English
8. From opera to the boardroom: what singers know about speaking with authority

Each piece: 800 to 1,500 words, one clear question in the title, a short direct answer in the first 2 sentences (the part AI tools quote), real examples from your clients' industries, and a link to book a call at the end.

- **Depends on:** item 1 (titles), so the new section doesn't compete with weak core pages.
- **Worked if:** within 8 to 12 weeks, Search Console shows impressions for queries without your name in them.
- **Watch:** non-branded impressions in Search Console, week over week.

### 9. Give pronunciation and accent clarity its own page (Medium)
`/pronunciation-coaching`. Build it around the opera-trained ear and real before-and-after stories, like Emmanuel's French-accent work (with permission). It's your most distinctive service and the easiest to rank for.

### 10. Connect Google Search Console (Medium)
If it isn't connected already, verify seanwatson.coach in Search Console and submit the sitemap. Without it, you can't measure whether any of this is working.

### 11. Add a pricing signal (your call)
Even "Packages from $X CAD" or "Sessions start at..." on the Coaching page. Skip it if hiding pricing is a deliberate sales choice.

---

## Phase 4: ongoing

- **Monthly:** check Search Console for new non-branded queries. Each one is a hint for the next lesson topic.
- **Quarterly:** re-run this audit and compare the score.
- **Later decision:** if `/lessons` grows past roughly 30 pages and mobile speed starts to hurt, look at moving off Gamma to a lighter platform. Not before.
