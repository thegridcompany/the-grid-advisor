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

## Hotkey System

This application uses a custom, priority-based hotkey system built with the `useHotkeys` hook and a `HotkeyProvider`. This system ensures that hotkeys operate predictably, especially when multiple components (like modals and the main board) are active.

### Key Concepts

- **Priority:** Each hotkey is registered with a numeric `priority`. Higher numbers have higher precedence. When a key is pressed, the handler with the highest priority is executed, and event propagation is stopped, preventing lower-priority handlers for the same key from firing.
- **`HotkeyProvider`:** To enable the priority system, your application's root component (or a relevant parent) must be wrapped in the `HotkeyProvider`. This provider manages the global list of registered hotkeys.
- **`useHotkeys` Hook:** This hook registers hotkeys for a component. It automatically handles cleanup when the component unmounts.

### How to Use

1.  **Wrap your app in `HotkeyProvider`:**

    In your main `_app.tsx` or layout component:

    ```tsx
    import { HotkeyProvider } from "@/hooks/useHotkeys";

    function MyApp({ Component, pageProps }) {
      return (
        <HotkeyProvider>
          <Component {...pageProps} />
        </HotkeyProvider>
      );
    }
    ```

2.  **Register hotkeys in your component:**

    Use the `useHotkeys` hook, providing an array of hotkey definitions and an options object with the desired `priority`.

    - **High Priority (e.g., for modals):** To ensure a modal's hotkeys (like `Escape` to close) are handled first.
    - **Low Priority (e.g., for global actions):** For general application-wide shortcuts.

    ```tsx
    import { useHotkeys } from "@/hooks/useHotkeys";

    const MyModal = () => {
      const handleClose = () => {
        // ... close modal logic
      };

      // High priority to override global hotkeys
      useHotkeys([["Escape", handleClose]], { priority: 100 });

      return <div>My Modal</div>;
    };

    const KanbanBoard = () => {
      const handleAddTask = () => {
        // ... add task logic
      };

      // Low priority for global actions
      useHotkeys([["n", handleAddTask]], { priority: 1 });

      return <div>Kanban Board</div>;
    };
    ```

### Best Practices

- **Modals and Overlays:** Always assign a high priority (e.g., `100`) to hotkeys for modals or other overlays to prevent underlying UI from reacting to key presses.
- **Global Shortcuts:** Assign a low priority (e.g., `1`) to global shortcuts to ensure they don't interfere with more specific UI components.
- **Scoping (Future):** The `scope` option is reserved for future enhancements, allowing for more granular control over when hotkeys are active.

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

The project aims for a minimum of **80% code coverage**. The CI pipeline is configured to fail if the coverage drops below this threshold.

### Running Tests

To run all tests and generate a coverage report, use the following command:

```bash
npm test
```

This command (as configured in `package.json`) runs Jest with the `--coverage` flag. An HTML coverage report will be generated in the `coverage/` directory. Open `coverage/index.html` in your browser to view the detailed report.

To run tests in watch mode (useful during development, does not generate coverage by default):

```bash
npm run test:watch
```

(Note: The `test` and `test:watch` scripts are already configured in your `package.json`.)

### Writing Tests

- Test files should be colocated with the component or module they are testing.
- Use the naming convention `*.test.ts` for TypeScript files or `*.test.tsx` for files containing JSX.
- Follow the ESLint rules configured for testing to ensure best practices.

Refer to the Jest and React Testing Library documentation for more details on writing effective tests.
