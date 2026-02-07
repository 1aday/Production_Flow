# Production Flow

AI video production pipeline for creating episodic show content with character management, trailers, and poster generation.

## What it does

Production Flow is a full-featured AI video production pipeline for creating episodic show content from concept to final output. Manage characters and their visual consistency across episodes, generate trailers and promotional posters, and orchestrate the entire production workflow. Powered by Kling v2.6 via Replicate for high-quality video generation, with Supabase handling asset and metadata storage.

## Tech Stack

- **Next.js** - React framework for production
- **TypeScript** - Type-safe development
- **Supabase** - Backend database and asset storage
- **Replicate (Kling v2.6)** - AI video generation

## Getting Started

```bash
git clone https://github.com/1aday/Production_Flow.git
cd Production_Flow
npm install
npm run dev
```

## Environment Variables

Create a `.env.local` file with the following:

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
REPLICATE_API_TOKEN=your_replicate_api_token
```

---
*Built by [@1aday](https://github.com/1aday)*
