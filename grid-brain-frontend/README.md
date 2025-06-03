This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

[![Coverage Status](https://img.shields.io/badge/coverage-pending-lightgrey)](<!-- URL to coverage report -->)

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

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Testing

This project uses [Jest](https://jestjs.io/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for unit and integration tests.

### Running Tests

To run all tests, use the following command:

```bash
npm test
```

To run tests in watch mode (useful during development):

```bash
npm run test:watch
```

(Note: You may need to add `"test": "jest"` and `"test:watch": "jest --watch"` scripts to your `package.json` if they don't exist yet.)

### Writing Tests

- Test files should be colocated with the component or module they are testing.
- Use the naming convention `*.test.ts` for TypeScript files or `*.test.tsx` for files containing JSX.
- Follow the ESLint rules configured for testing to ensure best practices.

Refer to the Jest and React Testing Library documentation for more details on writing effective tests.
