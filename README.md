This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy to Cloudflare Workers

This project uses OpenNext to keep the existing Next.js and Auth.js behavior.
`cloudflare.config.ts` is the deployment configuration; the `cf` CLI uploads the
Worker and static assets. No shared page/data cache or image optimization service
is configured. `next dev` and the standalone Docker build remain available.

```bash
npm ci
npm test
npm run build:cloudflare
npx cf deploy --dry-run --prebuilt
```

The Cloudflare build runs Prisma generation, `next build --webpack`, OpenNext,
and then Vite to produce `.cloudflare/output/v0`. Run the full build script;
`cf build` alone does not run the OpenNext preparation step.

Before building, set `DATABASE_URL`, `AUTH_SECRET`, and `AUTH_URL` in your local
ignored `.env` or in the Cloudflare build variables. Build-time values alone do
not configure production secrets. Use a dedicated hosted PostgreSQL database
accessible from Workers; `localhost` points to the Worker itself in production.

Configure the `DATABASE_URL` and `AUTH_SECRET` Worker secrets in Cloudflare.
`AUTH_SECRET` must be a securely generated random value of at least 32 characters.
The configured production URL is
`https://studio-system.dinhhogianguyen1198.workers.dev`.
Auth.js trusts the Worker host and uses HTTPS cookies at that URL.

Apply `npx prisma migrate deploy` separately to the intended database before
launch. Do not run the development user seed against production: it contains a
fixed demonstration administrator password. Bootstrap the owner with a unique
password instead. Do not set `AUTH_BYPASS_DEV` in a deployed environment.

For Cloudflare Workers Builds, set:

- Build command: `npm run build:cloudflare`
- Deploy command: `npx cf deploy --prebuilt`

For a local deployment after `cf auth login`, run `npm run deploy:cloudflare`.
Use `npm run preview:cloudflare` to exercise the built Worker locally. Add test
secrets in the ignored `.dev.vars` file. Production secrets must never be committed.

A successful build does not verify a database connection. Verify login, protected
routes, and database writes against the deployed PostgreSQL instance before use.
