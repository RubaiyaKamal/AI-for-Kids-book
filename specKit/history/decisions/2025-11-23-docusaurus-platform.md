# Decision: Docusaurus as Book Platform

**Date:** 2025-11-23
**Status:** Implemented

## Context

Need to create a web-based platform for the "Physical AI & Humanoid Robotics" textbook that supports:
- Structured content organization
- Easy navigation
- Blog functionality
- GitHub Pages deployment
- Modern, responsive design

## Decision

Use **Docusaurus** as the primary platform for the book website.

## Rationale

### Pros
- **Documentation-focused:** Built specifically for documentation and educational content
- **React-based:** Enables custom components and interactivity
- **MDX support:** Allows mixing Markdown with React components
- **Built-in features:** Sidebar navigation, search, versioning, blog
- **GitHub Pages:** Easy deployment workflow
- **SEO-friendly:** Server-side rendering, meta tags
- **Active community:** Well-maintained by Meta/Facebook

### Cons
- **Learning curve:** Requires understanding of React and MDX
- **Build time:** Can be slow for large sites
- **Customization limits:** Some design constraints

## Alternatives Considered

1. **GitBook**
   - Simpler setup
   - Less customization
   - Paid plans for advanced features

2. **MkDocs**
   - Python-based
   - Simpler but less powerful
   - Limited interactivity

3. **Custom Next.js Site**
   - Maximum flexibility
   - Requires more development time
   - More maintenance overhead

4. **Jupyter Book**
   - Great for technical content
   - Limited design flexibility
   - Python ecosystem dependency

## Implementation Details

- Version: Docusaurus 3.x
- Deployment: GitHub Pages with automated CI/CD
- Content format: MDX (Markdown + React)
- Styling: Custom CSS with Docusaurus theming

## Consequences

- Enables rapid content creation with Markdown
- Allows custom interactive components (chatbot, quizzes)
- Requires maintaining build pipeline
- Benefits from Docusaurus ecosystem and plugins

## Review Date

To be reviewed after initial content migration (2025-12-31)
