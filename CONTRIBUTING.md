# Contributing to Astra CMS

Thank you for your interest in contributing! This guide explains how to get involved.

## Getting Started

1. Fork the repository
2. Clone your fork and install dependencies:
   ```bash
   git clone https://github.com/<your-username>/astra-cms.git
   cd astra-cms
   npm install
   npm run dev
   ```
3. Read [ONBOARDING.md](ONBOARDING.md) for architecture and project structure

## How to Contribute (Step by Step)

1. **Find or create an issue** — check the [Issues](https://github.com/Kaimaan/astra-cms/issues) tab for something you'd like to work on, or open a new issue describing what you want to fix or add
2. **Fork the repo** — click the "Fork" button on GitHub (this creates your own copy)
3. **Create a branch** for your change:
   ```bash
   git checkout -b fix/123-short-description
   ```
   Use a prefix like `fix/`, `feat/`, or `docs/` followed by the issue number and a short description.
4. **Make your changes** locally
5. **Run the build** to make sure nothing is broken:
   ```bash
   npm run build
   ```
6. **Commit and push** your changes:
   ```bash
   git add .
   git commit -m "Fix: short description of what you changed (#123)"
   git push origin fix/123-short-description
   ```
7. **Open a Pull Request** — go to your fork on GitHub and click "Compare & pull request". In the PR description:
   - Describe what you changed and why
   - Add `Closes #123` to automatically link and close the issue when merged

## Pull Request Tips

- Keep PRs focused — one feature or fix per PR
- Smaller PRs are easier to review and merge faster
- If you're unsure about an approach, open an issue first to discuss it

## Creating Issues

We recommend using an AI coding agent (like Claude Code) to plan your change and create the issue via the GitHub CLI. This produces well-structured specs that are easier to implement and review.

```bash
# Example: ask your AI agent to plan the feature, then create the issue
gh issue create --title "Add dark mode toggle" --body "..."
```

A good issue includes:
- **Bug reports:** steps to reproduce, expected vs actual behavior, browser/OS/Node version
- **Feature requests:** what the feature does, the problem it solves, and any alternatives considered

## Contributor License Agreement (CLA)

By submitting a pull request, you agree to the terms of our [Individual Contributor License Agreement](CLA.md). This grants the project maintainers the rights to use your contribution under the current or future licenses of the project.

## Code of Conduct

This project follows the [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold these standards.
