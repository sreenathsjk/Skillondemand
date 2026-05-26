# SkillBridge 🚀 Production Deployment Manual

This document provides step-by-step instructions to take **SkillBridge** from this high-performance full-stack React + Express sandbox to a production-scale **Next.js (App Router) + Supabase + Razorpay + Vercel** environment.

---

## 📦 Phase 1: Database Setup (Supabase)

SkillBridge uses a fully normalized, performance-optimized relational schema with Row Level Security (RLS) policies to safeguard user profiles, bookings, and payments.

1. **Create Supabase Project**:
   - Go to [Supabase Console](https://supabase.com) and click **New Project**.
   - Note down your `SUPABASE_URL` and `SUPABASE_ANON_KEY` from the **Project Settings -> API** panel.

2. **Execute Database Migrations**:
   - Open your project's **SQL Editor** in Supabase and select **New Query**.
   - Copy-paste the entire contents of the `supabase_schema.sql` file provided in this repository.
   - Click **Run** to generate the normalized tables (`users`, `expert_profiles`, `availability_slots`, `bookings`, `reviews`), security indexes, RLS access policies, and initial expert seeds.

---

## 💳 Phase 2: Payment Gateway Setup (Razorpay)

1. **Obtain API Keys**:
   - Log in to your [Razorpay Dashboard](https://dashboard.razorpay.com).
   - Go to **Settings -> API Keys** and click **Generate Key-Id and Secret-Key**.
   - Copy these credentials securely.

2. **Set Up Payment Webhooks (Optional for Production)**:
   - Configure a webhook pointing to your API endpoint: `https://<your-app-domain>/api/bookings/payment-callback`.
   - Select the `payment.captured` event.

---

## ⚡ Phase 3: Converting to Next.js App Router (Optional)

Since this sandbox runs on React (Vite) + Express for optimal container ingress, deploying to Next.js involves a direct translation of matching files:
- **Client Components**: Move client code (`src/App.tsx`, `src/components/*`) directly to Next.js `/app/page.tsx` and sub-directories. Add the `"use client";` directive at the top.
- **Server API Routes**: Convert the Express handlers in `server.ts` to Next.js API Routes (`/app/api/.../route.ts`).
  - E.g., `/api/experts/route.ts` translates Express endpoints directly using Next.js `NextResponse.json(...)`.
  - Replace `dbStore` calls with Supabase Client queries using `@supabase/supabase-js`.

---

## ☁️ Phase 4: Production Hosting Deploy (Vercel)

1. **Connect Repository to Vercel**:
   - Import your repository to [Vercel](https://vercel.com).
   - Set the Framework Preset to **Vite** (for direct deployment) or **Next.js** (if you did the Phase 3 conversion).

2. **Configure Production Environment Variables**:
   Configure the following environment variables under **Project Settings -> Environment Variables**:

   ```env
   # Authentication Secrets
   JWT_SECRET="your-production-jwt-random-salt-key"

   # Razorpay Production API keys
   RAZORPAY_KEY_ID="rzp_live_xxxxxxxxxxxxxxxx"
   RAZORPAY_KEY_SECRET="your-live-key-secret-from-razorpay"

   # Supabase Cloud Settings (if Phase 3 conversion applied)
   NEXT_PUBLIC_SUPABASE_URL="https://your-proj-id.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-public-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-supabase-secure-service-role-key"
   ```

3. **Deploy**:
   - Click **Deploy**. Vercel will automatically build the client-side bundles and host your full-stack servlets on serverless edge functions!
