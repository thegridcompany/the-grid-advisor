// jest.config.js
import nextJest from "next/jest";

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"], // if you have a setup file
  testEnvironment: "jest-environment-jsdom",
  preset: "ts-jest",
  moduleNameMapper: {
    // Handle module aliases (if you have them in tsconfig.json)
    "^@/components/(.*)$": "<rootDir>/src/components/$1",
    "^@/pages/(.*)$": "<rootDir>/src/pages/$1",
    // Add other aliases here if needed
  },
  transform: {
    "^.+.(ts|tsx)$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.jest.json" }],
  },
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.test.{js,jsx,ts,tsx}", // Exclude test files
    "!src/**/index.{js,jsx,ts,tsx}", // Often barrel files, can be excluded if no logic
    "!src/**/types.ts", // Exclude type definition files
    "!src/**/constants.ts", // Exclude constant definition files if no logic
    "!src/pages/_app.tsx", // Next.js specific files that might be hard to cover
    "!src/pages/_document.tsx",
    "!**/node_modules/**",
    "!**/vendor/**",
    "!**/__mocks__/**",
  ],
  coverageReporters: ["json", "lcov", "text", "clover", "html"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(customJestConfig);
