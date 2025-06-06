# Definition of Done (DoD)

## 1. Introduction

- **Purpose of this document:** This document defines the criteria that must be met for any work item (e.g., user story, task, bug fix) to be considered "Done" within The Grid Advisor project. Its purpose is to ensure shared understanding, consistency, high quality, and predictability across all development efforts.
- **Scope:** This Definition of Done applies to all development activities undertaken by the team. This includes, but is not limited to, new features, enhancements to existing features, bug fixes, refactoring, and technical debt remediation. It covers all software components within the project, including the Next.js frontend, any backend services (e.g., FastAPI), shared libraries, and related infrastructure configurations managed as code.
- **How to use this DoD:**
  - As a checklist for developers to verify completion before marking a work item as done and ready for subsequent stages (e.g., QA, deployment).
  - As a guide for Quality Assurance (QA) and testers to ensure all aspects of a work item are verified.
  - As a reference during sprint planning, backlog refinement, and estimation sessions to ensure a common understanding of the effort required.
  - As a basis for peer reviews (code reviews) to confirm that all criteria have been addressed.
  - As a living document to be reviewed and updated periodically to reflect evolving project needs and best practices.

## 2. DoD Checklist

### 2.1. Code Quality

- [ ] **Code is well-documented (comments, JSDoc where applicable):** Complex business logic, public APIs (functions, components, custom React hooks), and any non-obvious code sections must have clear, concise comments explaining _why_ the code is written a certain way, not just _what_ it does. JSDoc is required for all exported functions, React components (including prop types if not using TypeScript or using it minimally), custom hooks, and types/interfaces to ensure maintainability and enable better developer tooling (e.g., IntelliSense, documentation generation).
- [ ] **Code follows established coding standards and style guides (linting passes):** All code contributions must strictly adhere to the project's configured ESLint rules (e.g., `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`, `@typescript-eslint/eslint-plugin`) and Prettier code formatting standards. The command `npm run lint` (or equivalent) must pass without any errors or new warnings before a Pull Request can be merged.
- [ ] **Test coverage meets project threshold (e.g., 80% unit, 70% integration):** A minimum test coverage of **80% for unit tests** and **70% for integration tests** must be achieved for new or modified code. These thresholds are measured by tools like Jest's coverage reporter. (Note: These are initial targets and may be revised based on project needs and complexity.)
  - [ ] **Unit tests written and passing:** Using Jest and React Testing Library (RTL). Focus on testing individual components (rendering, state changes, event handling), utility functions, and custom hooks in isolation. Test cases should cover happy paths, edge cases, and error conditions.
  - [ ] **Integration tests written and passing (if applicable):** Using Jest/RTL for testing interactions between several components or modules (e.g., form submission flows, data fetching and display). For end-to-end flows involving multiple pages or critical user paths, Cypress may be used if configured for the project.
- [ ] **Static analysis tools (e.g., SonarQube, ESLint) report no critical issues:** If SonarQube (or a similar comprehensive static analysis tool) is integrated into the CI/CD pipeline, it must report no new "Bugs," "Vulnerabilities," or "Major Code Smells" on the contributed code. All ESLint rules, including those from security-focused plugins (e.g., `eslint-plugin-security`), must pass.
- [ ] **No known security vulnerabilities introduced (as per security baseline and scans):** All code must be developed in accordance with the principles and requirements outlined in the `docs/security-baseline.md` document. Any automated security scanning tools (e.g., SAST tools like Snyk Code, Dependabot alerts for vulnerabilities in dependencies) integrated into the CI/CD pipeline must pass without identifying new critical or high-severity vulnerabilities.
- [ ] **Code is peer-reviewed and approved:** All code changes must be submitted via a Pull Request (PR) on the version control system (e.g., GitHub). Each PR must be reviewed and approved by at least one other designated team member (preferably two for critical changes). All review comments and suggestions must be addressed (either by implementing the change or by providing a clear justification for not doing so) before the PR is merged.
- [ ] **Logic is sound and meets requirements:** The implemented code logic must correctly and completely fulfill all functional and non-functional requirements and acceptance criteria defined for the work item (user story, task, bug). It should robustly handle expected use cases and gracefully manage foreseeable error conditions.
- [ ] **No "magic numbers" or hardcoded strings that should be constants/configs:** Numeric literals or string values that have a specific, non-obvious meaning or are used in multiple places should be defined as named constants (e.g., `const MAX_LOGIN_ATTEMPTS = 5;`) or be part of an enumeration. Configuration values (e.g., API endpoints, feature flags) must be externalized and managed through environment variables or configuration files, not hardcoded in the source.
- [ ] **Secrets are not hardcoded and are managed securely:** Absolutely no sensitive information such as API keys, database credentials, encryption keys, or any other secrets should be hardcoded directly into the source code, commit history, or configuration files versioned in the repository. Secrets must be managed securely using platform-provided mechanisms (e.g., Vercel Environment Variables, Supabase Vault secrets) or a dedicated secrets management tool.

### 2.2. Documentation

- [ ] **User-facing documentation updated (if applicable):** If the work item introduces or changes user-visible functionality, corresponding user guides, FAQs, tooltips, or in-app help materials must be updated or created. Changes should be clearly communicated to the team responsible for user documentation if separate.
- [ ] **Technical documentation (e.g., READMEs, API docs, architecture diagrams) updated:** All relevant technical documentation must be updated to reflect changes accurately. This includes:
  - `README.md` files for new packages, modules, or significant updates to existing ones, detailing setup, usage, and purpose.
  - API documentation: For backend services, Swagger/OpenAPI specifications must be updated. For frontend, JSDoc or TypeDoc for component APIs, props, custom hooks, and public functions must be current.
  - Architectural diagrams (e.g., C4 model diagrams, sequence diagrams in tools like Mermaid.js) updated if significant design changes were implemented or new components introduced.
  - Key design decisions, trade-offs considered, and rationale for chosen solutions should be documented, potentially in Architecture Decision Records (ADRs) or a project wiki/Confluence page.
- [ ] **Commit messages are clear and follow project conventions:** Commit messages must adhere to the Conventional Commits specification (e.g., `feat: ...`, `fix: ...`, `docs: ...`, `chore: ...`, `refactor: ...`). The subject line should be concise (max 50-72 characters) and clearly describe the change. The body of the commit message (if necessary) should explain the _why_ behind the change and any relevant context, wrapped at 72 characters.
- [ ] **Pull Request description is comprehensive:** The Pull Request (PR) description must provide sufficient context for reviewers. This includes:
  - A clear explanation of the purpose and scope of the changes (`What` and `Why`).
  - A link to the relevant work item (e.g., Jira ticket ID, Taskmaster task ID).
  - A summary of the implementation approach (`How`).
  - Highlights of any important considerations for reviewers (e.g., potential risks, areas needing specific attention, architectural changes).
  - Steps for manual testing or verification, if applicable, including any specific test data needed.
  - Screenshots or GIFs for UI changes to aid in visual review.
  - If a PR template is used for the repository, it must be filled out completely and accurately.

### 2.3. Functionality

- [ ] **All acceptance criteria for the work item are met:** Every acceptance criterion defined for the user story, task, or bug fix (as specified in the project management tool, e.g., Jira, Taskmaster task details) must be fully implemented, demonstrable, and verified as working correctly.
- [ ] **Feature works as expected in target environments (dev, staging):** The implemented functionality has been successfully deployed to and thoroughly tested in the development (dev) and staging environments. It behaves consistently and as expected in these environments, which should closely mirror the production environment's configuration and data characteristics where feasible. Any environment-specific configurations are correctly applied.
- [ ] **Manual testing/QA completed and passed (if applicable):** Where automated tests do not cover all aspects or for exploratory purposes, manual testing by the developer (self-testing), a peer developer, or a dedicated QA team member has been completed. This includes testing against the defined acceptance criteria and user scenarios. All critical and high-priority test cases relevant to the work item must pass. Any identified issues are tracked, prioritized, and resolved before marking the work item as done.
- [ ] **Edge cases and error handling considered and implemented:** Potential edge cases (e.g., empty inputs, invalid data formats, null values, maximum/minimum boundary conditions, unexpected user interactions, race conditions, network failures, API errors) have been identified, considered during design and implementation, and handled gracefully by the application. Error messages displayed to the user are clear, user-friendly, informative, and guide the user toward resolution where possible. Sensitive information or system internals are not leaked in error messages. System logs should capture sufficient detail for debugging errors.
- [ ] **No regressions introduced to existing functionality:** The changes introduced by the work item do not negatively impact any existing features or functionalities of the application. This should be primarily verified by a comprehensive suite of automated regression tests (unit, integration, and end-to-end tests). Exploratory testing around related areas of the application should also be performed to catch unintended side effects or broken functionality.

### 2.4. Performance

- [ ] **Performance considerations addressed (e.g., meets Lighthouse score targets, Core Web Vitals):** For user-facing changes, performance impact has been assessed. Key performance indicators (KPIs) such as Google's Core Web Vitals (Largest Contentful Paint - LCP < 2.5s, First Input Delay - FID < 100ms / Interaction to Next Paint - INP < 200ms, Cumulative Layout Shift - CLS < 0.1) must not degrade beyond these acceptable thresholds for key user flows. Lighthouse audit scores (Performance, Best Practices, SEO) should be maintained or improved, aiming for project-defined targets (e.g., Performance > 80-90). Next.js specific optimizations (image optimization, script optimization, font optimization) should be utilized.
- [ ] **No obvious performance bottlenecks introduced:** The code does not introduce any new, obvious performance bottlenecks. This includes:
  - Avoiding N+1 queries in data fetching operations.
  - Ensuring efficient loops, algorithms, and data structures.
  - Minimizing unnecessary re-renders in React components (e.g., using `React.memo`, `useCallback`, `useMemo` appropriately, and proper state management).
  - Optimizing Next.js page bundle sizes through code splitting (e.g., `next/dynamic` for non-critical components or client-side only components) and tree shaking.
  - Utilizing server-side rendering (SSR) or static site generation (SSG) effectively for Next.js pages where appropriate.
  - Lazy loading images (`next/image`) and other offscreen or non-critical assets.
  - Profiling tools (browser developer tools, React Profiler, Next.js analytics, backend profilers if applicable) should be used to identify and address performance issues if degradation is suspected or observed during testing.
- [ ] **Database queries are optimized:** All new or modified database queries are efficient, utilize appropriate indexing (verified with database tools like `pgAdmin` for PostgreSQL or Supabase query analysis tools), and avoid retrieving unnecessary data (e.g., select only required columns). Complex queries have been analyzed (e.g., using `EXPLAIN ANALYZE` in PostgreSQL) to ensure they perform well under expected load conditions and scale appropriately. Database connection pooling is used effectively by the backend services.

### 2.5. Accessibility

- [ ] **Accessibility standards met (e.g., WCAG 2.1 AA):** All new and modified user interfaces must adhere to Web Content Accessibility Guidelines (WCAG) 2.1 Level AA success criteria. This includes, but is not limited to:
  - **Perceivable:** Text alternatives for non-text content (e.g., `alt` text for images), captions for multimedia, adaptable content presentation (e.g., responsive design, content reflows without loss of information), sufficient color contrast (4.5:1 for normal text, 3:1 for large text and UI components).
  - **Operable:** All functionality available via keyboard, no keyboard traps, sufficient time for users to read and use content, no content that causes seizures or physical reactions, easy navigation with clear headings and landmarks.
  - **Understandable:** Readable text (clear fonts, sufficient line spacing), predictable web pages (consistent navigation and layout), input assistance (clear labels or instructions for form fields, error identification and suggestions).
  - **Robust:** Maximize compatibility with current and future user agents, including assistive technologies, through valid HTML and correct use of ARIA (Accessible Rich Internet Applications) attributes where necessary (e.g., for custom components, dynamic content updates).
  - Automated accessibility checking tools (e.g., Axe DevTools browser extension, Lighthouse accessibility audit, `eslint-plugin-jsx-a11y` integrated into the linting process) should be used during development and in CI/CD pipelines. These must be supplemented by manual checks for criteria that automated tools cannot fully assess.
- [ ] **Keyboard navigation works as expected:** All interactive elements (links, buttons, form fields, custom controls like tabs, menus, sliders) must be focusable and operable using only the keyboard in a logical sequence. The tab order (focus order) must be logical and intuitive, following the visual flow of the page. Focus indicators must be clearly visible and meet contrast requirements. Users must not get trapped in any part of the interface when using a keyboard (i.e., they can always tab into and out of interactive sections).
- [ ] **Screen reader compatibility tested (if applicable):** For significant UI changes or new complex components, testing with common screen readers (e.g., NVDA on Windows, VoiceOver on macOS; JAWS if licenses are available and target audience warrants it) should be performed. This ensures that:
  - Content is announced correctly and in a logical order that makes sense to the user.
  - Interactive elements are properly identified with their roles (e.g., button, link, checkbox), names (accessible labels), states (e.g., checked, expanded, disabled), and values.
  - Dynamic content changes (e.g., results of an action, error messages, loading states) are announced appropriately to the user, typically using ARIA live regions (`aria-live`, `aria-relevant`, `aria-atomic`).
  - Proper use of semantic HTML elements (e.g., `<nav>`, `<main>`, `<aside>`, `<button>`, `<input type="checkbox">`) is prioritized. ARIA attributes should be used to enhance accessibility where standard HTML is insufficient, not as a replacement for correct semantics.

### 2.6. Cross-Browser Compatibility

- [ ] **Feature tested and works on agreed-upon browsers and versions:** The implemented feature or fix must be tested and confirmed to function correctly and display as intended on the **latest stable versions** of the following browsers (unless specified otherwise by project requirements or analytics data indicating significant usage of older versions):
  - Google Chrome (Desktop & Android)
  - Mozilla Firefox (Desktop)
  - Apple Safari (macOS and iOS)
  - Microsoft Edge (Desktop, Chromium-based)
- Testing should cover core functionality, layout integrity (including responsive design across common viewport sizes for desktop, tablet, and mobile), styling consistency, and user interactions.
- Any known compatibility issues that cannot be reasonably resolved or are deemed acceptable trade-offs (e.g., minor stylistic differences that do not impact usability) must be documented and communicated to the product owner and relevant stakeholders.
- Consider using browser developer tools for initial testing and tools like BrowserStack, LambdaTest, or Sauce Labs for broader compatibility testing if available and necessary, especially for critical features or if specific older browser versions need to be supported based on user analytics.
- CSS vendor prefixes should be managed by build tools (e.g., Autoprefixer via PostCSS) to ensure compatibility where needed.

### 2.7. CI/CD

- [ ] **CI/CD pipeline passes (build, test, lint, deploy to dev/staging):** The Continuous Integration/Continuous Deployment (CI/CD) pipeline (e.g., GitHub Actions, Vercel deployments, GitLab CI, Jenkins) must complete successfully for the branch or Pull Request containing the changes. This typically includes:
  - **Successful build:** The application(s) (frontend and backend if applicable) compile and build without errors. For Next.js, this means `next build` completes successfully.
  - **Automated tests passing:** All automated tests (unit, integration, and end-to-end if configured) must pass. No new failing tests are introduced, and test coverage should meet or exceed defined thresholds.
  - **Code linting and static analysis:** Code linting (e.g., ESLint) and static analysis checks (e.g., SonarQube, if integrated) must pass without new critical issues or violations of configured quality gates.
  - **Security scans:** Automated security scans (SAST, dependency checking like `npm audit --audit-level=moderate` or Snyk) must pass without identifying new critical or high-severity vulnerabilities.
  - **Successful deployment:** If applicable, the changes are successfully deployed to development (dev) and/or staging environments by the pipeline. Deployment previews (e.g., Vercel Preview Deployments) should be successful, accessible, and verified.
- [ ] **Any new environment variables or configurations are documented and deployed:** If the work item introduces or modifies environment variables, application configuration settings, or infrastructure components (e.g., new database tables, cloud service configurations):
  - These changes must be clearly documented. This includes updating any `.env.example` files, `README.md` sections related to configuration, or central configuration management documentation (e.g., Confluence, project wiki).
  - The new configurations must be applied to all relevant non-production environments (development, staging) through the appropriate secure mechanisms (e.g., Vercel Environment Variables UI/CLI, Supabase Vault, AWS Parameter Store, Terraform/IaC scripts).
  - A clear plan or automated process must exist for applying these configurations to the production environment during the production deployment. This process must be documented and followed rigorously.
  - Secrets (API keys, database credentials, etc.) must _never_ be committed to the version control repository. They must be managed through secure environment-specific stores.

## 3. Measurement & Enforcement

- **How DoD compliance will be tracked:**

  - **Pull Request (PR) Checklist:** A PR template can include a mandatory checklist referencing key DoD items. Authors must confirm these before merging.
  - **Automated Checks:** CI/CD pipeline will automate checks for linting, tests (unit, integration, e2e), code coverage, static analysis (SonarQube), and security scans. Pipeline failures will block merges.
  - **Peer Reviews:** Reviewers are responsible for verifying aspects of the DoD not easily automated, such as documentation quality, clarity of logic, and adherence to architectural principles during the code review process.
  - **QA Verification:** QA team (if applicable) or designated testers will verify functionality against acceptance criteria, perform exploratory testing, and check for regressions on staging environments.
  - **Post-Deployment Monitoring:** Application performance monitoring (APM) tools, error tracking (e.g., Sentry), and analytics will be used to monitor the health and performance of features in production, providing feedback on DoD effectiveness.
  - **Sprint Retrospectives:** The team will discuss DoD adherence and any challenges faced during sprint retrospectives. This feedback loop helps refine the DoD and improve processes.

- **Responsibilities for ensuring DoD:**
  - **Developers:** Primarily responsible for ensuring their code and work items meet all DoD criteria _before_ submitting for review or marking as complete. This includes running local checks, writing tests, and documenting their work.
  - **Peer Reviewers:** Responsible for thoroughly reviewing code changes against the DoD, providing constructive feedback, and ensuring quality standards are met before approving a PR.
  - **Tech Lead / Senior Developers:** Provide guidance on DoD interpretation, assist in resolving complex issues, and may perform final reviews or act as tie-breakers. They champion the importance of the DoD.
  - **Quality Assurance (QA) Team (if applicable):** Responsible for independent verification of DoD criteria, especially functional requirements, in staging environments. They provide feedback on usability, edge cases, and overall quality.
  - **Product Owner:** Responsible for ensuring acceptance criteria are clear and testable. While they don't enforce all technical DoD items, they confirm that the delivered functionality meets business requirements (a key part of the DoD).
  - **The Entire Team:** Collectively responsible for upholding the DoD, fostering a culture of quality, and participating in the review and improvement of the DoD itself.

## 4. Review & Update Process

- **Cadence for reviewing and updating this DoD:**

  - **Regular Review:** This Definition of Done will be formally reviewed by the entire development team, Tech Lead, and Product Owner at least **quarterly** (every three months).
  - **Ad-hoc Reviews:** Reviews may also be triggered by:
    - Significant changes in project scope, technology stack, or team structure.
    - Recurring issues or quality problems identified in retrospectives or post-deployment.
    - Introduction of new tools or processes that impact development workflow or quality standards.
    - Feedback from stakeholders suggesting the DoD is no longer adequate or is overly burdensome.

- **Process for proposing changes:**
  - **Proposals:** Any team member can propose changes to this DoD.
  - **Discussion:** Proposed changes should be documented (e.g., in a shared document, project wiki, or via a dedicated issue/task in the project management tool) and then discussed by the team. This can occur during a dedicated meeting, a segment of a sprint retrospective, or asynchronously via team communication channels.
  - **Rationale:** The proposer should provide a clear rationale for the change, explaining the problem it solves or the improvement it offers.
  - **Impact Assessment:** The team should consider the potential impact of the proposed change on workflow, quality, timelines, and team members.
  - **Agreement:** Changes should be agreed upon by a consensus of the development team and approved by the Tech Lead and Product Owner.
  - **Documentation & Communication:** Once a change is approved, this document (`docs/definition-of-done.md`) must be updated immediately. The changes and their effective date should be clearly communicated to all team members and relevant stakeholders. This can be done via team meetings, email, or team chat announcements.
  - **Version Control:** This document is version-controlled. Updates should follow standard commit practices, with clear commit messages explaining the changes made to the DoD.
