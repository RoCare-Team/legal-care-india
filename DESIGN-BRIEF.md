# Justiceland — Complete Design Brief

A full inventory of every page and feature in the product, written to be handed
to a design tool (ChatGPT, Figma AI, v0) as the source of truth for generating
screen designs.

**Product:** Justiceland — an online platform to find verified lawyers across
India and consult them instantly by chat, audio or video, anonymously.

---

## 1. Brand system

| Token | Value | Used for |
|---|---|---|
| Primary (navy) | `#1E3A5F` | Buttons, links, headings, active states |
| Primary light | `#34557F` | Hover, gradients |
| Primary dark | `#142842` | Footer, dark hero, admin sidebar |
| Secondary / Ink | `#0F172A` | Body text, dark surfaces |
| Accent (gold) | `#D4AF37` | Highlights, eyebrows, price, CTA accents |
| Surface | `#FFFFFF` | Cards, bars |
| Muted | `#F1F5F9` | Page background, chips |

- **Display font:** Lora (serif) — headings, brand voice
- **Body font:** Inter (sans) — UI, paragraphs
- **Theme:** Light only. Navy + gold on white. **No orange, no dark mode.**
- **Logo:** book-and-scales emblem + "JUSTICELAND" wordmark, as one lockup
- **Language:** English (India), ₹ INR, Indian cities and legal terms
- **Feel:** professional law firm — trustworthy and calm, not startup-playful

**Global chrome on every public page**

- Sticky header: logo, 5 nav links (Home / Find Lawyers / Legal Services / Blogs / Contact), location picker, Log in, "Register as Lawyer" CTA. On the home page it floats as a rounded white capsule over the dark hero.
- Mobile: hamburger drawer with the same nav, location and auth buttons.
- Footer: brand + description + 2 emails, 4 link columns, contact column (phone, WhatsApp, address), social icons, copyright, disclaimer.
- Floating contact widget (WhatsApp + call bubbles), scroll-to-top button.

---

## 2. Page inventory

### A. Public / marketing

**A1. Home `/`**
Hero (dark photo background, H1 "Get Anonymous Legal Help in Just 10 Minutes",
subtitle, dual search bar [legal service + city] with Search button,
popular-search chips, 3 trust badges) → legal service category grid (icon tiles)
→ stats counters (verified lawyers, consultations, cities, rating) → lawyer
listing band (sort dropdown, "Find all lawyers" button, prev/next arrows, 3×2
card grid on desktop and a sliding rail on mobile) → How It Works (3 numbered
steps) → anonymous-consultation band → popular cities rail → popular legal areas
→ testimonials carousel → lawyer-recruitment banner → closing CTA.

**A2. Lawyer listing `/lawyers`**
Two columns. Left, a filter sidebar: Location dropdown, Practice Area checkboxes,
Consultation Type (Chat / Audio / Video / In-Person), Availability (Available
Now), fee-per-minute range slider (₹0–₹500+), Language. Right, a result header
("Showing 245 lawyers near New Delhi") with a Sort by dropdown, then the cards.
Each card carries a photo with a green Online dot, name, specialisation, years of
experience and court, rating with review count, practice-area chips, languages,
per-minute rate pills (Chat ₹20 / Call ₹30) and a "Consult Now" button.
Pagination at the foot.

**A3. Lawyer profile `/lawyers/[slug]`**
Back-to-search bar. Header card: large photo with a thumbnail strip, name with a
verified tick, specialisation, rating, experience, court, location with distance,
Online badge, languages. Sticky right rail: Chat / Audio Call / Video Call
buttons showing per-minute rates, a large "Consult Now" CTA, an outlined
"Book Appointment", and a "100% Secure & Private" note. Tabs: About, Experience,
Specializations, Reviews, Gallery. Body sections: About, specialization chips,
Client Reviews (rating breakdown, review cards, "Write a Review"), Education,
Credentials, Legal Services, office details, office timings, FAQ, related
lawyers. On mobile the actions become a sticky bottom bar.

**A4. Legal services `/legal-services`** — grid of all 12 practice areas.
**A5. Service page `/legal-services/[slug]`** — one practice area: hero, what it
covers, sub-service grid, lawyers in that area, FAQ, city links.
**A6. Sub-service `/legal-services/[slug]/[sub]`**
**A7. Sub-service in a city `/legal-services/[slug]/[sub]/[city]`**

**A8. Cities `/cities`** — city tiles with landmark photos and lawyer counts.

**A9. SEO dynamic routes `/[slug]`** — a single route renders five page types:

- `/mumbai` → **City home** — the homepage scoped to one city
- `/criminal-lawyer` → **Service page**
- `/bail-matters-lawyer` → **Matter page**
- `/criminal-lawyer-in-mumbai` → **City + service**
- `/bail-matters-lawyer-in-mumbai` → **City + matter**

Shared blocks: hero carrying the city or service name, fact strip, lawyer
sidebar, content sections, matter grid, city slider.

**A10. Blogs `/blogs`** — article cards with cover image, category, date, read time.
**A11. Article `/blogs/[slug]`** — cover, title, meta line, body, related articles.

**A12. About `/about`** · **A13. Contact `/contact`** (form, map, details) ·
**A14. Careers `/careers`** · **A15. Success stories `/success-stories`** ·
**A16. Pricing `/pricing`** · **A17. Verification `/verification`** (how lawyers
are verified) · **A18–A21. Legal pages** — `/privacy`, `/terms`, `/disclaimer`,
`/refund`.

### B. Location picker (site-wide modal)

Header with icon, "Choose your location" and a close button. Primary button:
"Use my current location — Detected from your device". An "OR SEARCH" divider.
Search input (area, locality or pincode; minimum 3 characters) with a live
results list. Popular city chips. Footer: "Currently set to <place>" with Clear.
Choosing a city that has a page navigates straight to that city page.

### C. Auth

**C1. User login `/user/login`** — mobile number and OTP, with Google and Apple options.
**C2. User signup `/user/signup`** — a 3-step wizard:

1. Mobile → OTP
2. Details — full name, email (optional), gender
3. Location — search, popular city chips, map preview, and a "Why location
   matters" side panel

Left brand panel: logo, tagline, four benefit bullets. Right: a testimonial photo card.

**C3. Lawyer login `/login`** — mobile and OTP.
**C4. Lawyer registration `/register`** — a 4-step wizard: Mobile → Details →
Verification (bar council number, documents) → Location. Same split layout with a
lawyer-facing brand panel ("Join Our Legal Network").
**C5. Profile setup `/setup`** — post-registration stepper to complete the profile.

### D. User area `/account`

Sidebar tabs:

- **Overview** — greeting, search, category shortcuts, wallet balance card with
  "Add Money", next-appointment card with "Join Now", recommended lawyers nearby
- **Consultations** — past and upcoming, with transcripts
- **Wallet** — balance, add money, transaction history
- **Profile** — edit details

### E. Lawyer dashboard `/dashboard`

Sidebar group 1, **Overview**: Dashboard, Consultations, Edit Profile, Your Plan, Settings.
Sidebar group 2, **Profile Sections** (anchors into Edit Profile): Legal Services,
Office Details, Office Timing, Contact Details, Bookable Slots, Fees, Education,
Experience, Languages, Certificates, Awards, Gallery, Social Links.

- **E1. `/dashboard`** — welcome card, availability toggle (Online / Offline),
  profile-completion meter, stat cards, recent consultations, pending-resume card
- **E2. `/dashboard/consultations`** — list, filters, open conversation, transcripts
- **E3. `/dashboard/enquiries`** — enquiry list with a status dropdown
- **E4. `/dashboard/profile`** — a long editable form split into the 13 sections
  above, with image upload, repeatable lists and an AI "generate about" helper
- **E5. `/dashboard/plan`** — membership plans, upgrade modal, payment
- **E6. `/dashboard/settings`** — account details, delete account

### F. Consultation (chat / audio / video)

- **Booking modals** on the profile: Book Consultation, Video Consult, Audio
  Consult, slot picker, and an auth gate for signed-out visitors
- **Chat panel** — two columns: conversation list on the left, thread on the
  right. Message bubbles with timestamps, file attachments (a PDF card showing
  size), and an input with attach, mic and send. Header: lawyer avatar, name,
  Online state, call and video icons
- **Video call overlay** — full-bleed remote video, self-view picture-in-picture
  top right, call timer, control bar (mic, camera, flip, end call in red)
- **Audio call** — the same stack, audio only
- **Incoming call card** for the lawyer, with a ringing state and accept/decline
- **Minimized call bar** so the user can keep browsing while connected
- **Per-minute billing** — every consultation charges ₹/min for the minutes
  actually used, settled from the wallet when the session ends

### G. Admin panel `/admin`

A dark navy sidebar rail (logo with an ADMIN badge, section links, the signed-in
email, Back to site, Log out). Sections:

Overview (metric trend cards) · Lawyers (table, approve/reject, detail page,
profile preview, phone editor, impersonation) · Users (table and detail) ·
Consultations (table and detail) · Payments (transactions, Razorpay key card,
live-mode toggle) · Contact (message inbox) · Phone Calls · Cities (add, delete) ·
Blogs (write, edit, publish, delete, restore removed built-ins) · Testimonials.

Shared: a data table with search, sort and pagination; a horizontal nav on mobile.

### H. System

404 Not Found · error page · loading skeletons.

---

## 3. Feature list

**Discovery** — dual search (service + city), 12 practice areas each with
sub-services, city landing pages, service×city SEO combinations, filters
(location, practice area, consultation type, availability, fee range, language),
five sort orders, and GPS or manual location with an automatic city-page redirect.

**Lawyer profiles** — verified badge, photo gallery, ratings and reviews,
per-minute rates for chat, audio and video, bookable slots, office details and
timings, education, experience, certificates, awards, languages, social links,
FAQ, and related lawyers.

**Consultation** — anonymous and instant. Live chat with file sharing, WebRTC
audio and video calls, incoming-call ringing for lawyers, a minimizable call bar,
transcripts, and per-minute billing settled from the wallet.

**Accounts** — two roles. Users sign in by mobile OTP; lawyers register through a
four-step verification wizard and stay hidden from the site until an admin
approves them. Role-based JWT sessions.

**Payments** — wallet top-up, Razorpay orders, verification and webhook,
membership plans for lawyers, and admin-managed keys with a live-mode switch.

**Content** — a blog CMS in the admin panel (write, edit, draft, publish, delete,
restore), plus testimonials, cities and success stories.

**Admin** — approval workflow, user and lawyer management, consultation and
payment oversight, contact inbox, impersonation, and an activity log.

**Platform** — SEO metadata and JSON-LD, dynamic Open Graph images, sitemap, PWA
manifest, Google Analytics, Meta Pixel, and CSP with security headers.

---

## 4. Prompt to paste into ChatGPT

> Design a complete UI kit for **Justiceland**, an Indian online platform to find
> verified lawyers and consult them by chat, audio or video.
>
> **Style:** professional law firm. Navy `#1E3A5F`, gold accent `#D4AF37`, ink
> `#0F172A`, white surfaces on an `#F1F5F9` page background. Lora serif for
> headings, Inter for body text. Light theme only, no orange. Rounded cards, soft
> shadows, generous whitespace. Indian names, cities and ₹ pricing.
>
> Produce one presentation sheet laid out as a grid of labelled desktop mockups,
> each screen titled above it, in this order:
>
> 1. Home — hero with search
> 2. Lawyer listing with filter sidebar
> 3. Lawyer profile
> 4. Location picker modal
> 5. User signup — step 1, mobile OTP
> 6. User signup — step 2, details
> 7. User signup — step 3, location
> 8. Lawyer registration
> 9. User dashboard
> 10. Lawyer dashboard
> 11. Chat consultation and video call
> 12. Admin panel
>
> Include the shared header (logo, nav, location picker, Log in, Register as
> Lawyer) and the footer on public screens. Use realistic content, not lorem ipsum.

Ask for three or four screens per request rather than all twelve at once — the
output is sharper and you can iterate on each one.
