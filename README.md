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

## Cloudflare build

Commit and push the updated `package.json` and `package-lock.json` to the branch
connected to Cloudflare before starting a new deployment. Publishing a Codex
environment does not push repository changes to GitHub.

- Build command: `npm run build`.
- `npm ci` runs `postinstall` to generate Prisma Client from `prisma/schema.prisma`.
- The build generates Prisma Client again before running `next build --webpack`.
  This also handles dependency caches or installation with lifecycle scripts disabled.
- Configure `DATABASE_URL`, `AUTH_SECRET` (at least 32 characters), and `AUTH_URL`
  in the deployment environment. Enter secret values in Cloudflare settings;
  never commit `.env`. `prisma generate` itself does not require a database connection.
- Apply database migrations separately against the intended database. The build
  command does not migrate or seed production data.

The build log must show `prisma generate && next build --webpack`,
`Generated Prisma Client`, and `Next.js 16.2.6 (webpack)`. If it still shows
only `next build`, verify the deployed commit, branch, and root directory.

To fix the build command before the repository change is available, use
`npx --no-install prisma generate && npx --no-install next build --webpack`
in Cloudflare's build settings.

These steps address the Next.js build. Running this server-rendered application
on Cloudflare Workers also requires a compatible Next.js adapter and Worker
deployment configuration; a successful `next build` alone does not deploy a Worker.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
