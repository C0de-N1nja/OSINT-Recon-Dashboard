# Contributing Guidelines

Thank you for your interest in contributing to the OSINT Dashboard!  
We welcome all contributions — from fixing typos to implementing major new features.

## Getting Started

1. **Fork the repository** on GitHub.
2. **Clone your fork**:
   ```bash
   git clone https://github.com/yourusername/osint-dashboard.git
   cd osint-dashboard
   ```
3. Set up your environment by following the instructions in docs/DEVELOPER.md.

## Branching

Use feature branches for new work:

```bash
git checkout -b feature/my-new-feature
```

For bug fixes:

```bash
git checkout -b fix/my-bug-fix
```

## Commit Messages

Follow Conventional Commits:

- `feat:` – new feature
- `fix:` – bug fix
- `docs:` – documentation changes
- `style:` – code style changes
- `refactor:` – code refactoring
- `test:` – adding or updating tests
- `chore:` – maintenance tasks

Example:

```
feat: add support for multi-platform scraping
```

## Pull Requests

1. Push your branch to your fork:

```bash
git push origin feature/my-new-feature
```

2. Open a Pull Request (PR) to the main branch of the upstream repo.
3. Fill out the PR template and describe your changes clearly.
4. Be ready to discuss and make requested changes.

## Code Style

- **JavaScript/Node**: Follow ESLint rules (`npm run lint` to check)
- **Python**: Follow PEP8
- Keep functions small and focused

## Tests

- Run `npm test` before submitting
- Test Python scripts manually if automated tests are not available

## Reporting Issues

If you find a bug or have a feature request:

1. Check the existing Issues
2. If it's not already reported, open a new issue with:
   - Steps to reproduce (if a bug)
   - Expected behavior
   - Screenshots (if applicable)

## Community Guidelines

- Be respectful and constructive
- Follow the Code of Conduct if present
- Avoid spammy or low-effort contributions

Happy coding! 🚀