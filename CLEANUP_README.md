# 🧼 BMV Finder - Codebase Cleanup System

This directory contains automation scripts for maintaining code quality and consistency in the BMV Finder Next.js project.

## 📁 Files Overview

### Core Scripts
- `scripts/cleanup.sh` - Main cleanup automation script
- `scripts/pre-commit-cleanup.sh` - Pre-commit checks
- `scripts/verify-cleanup.sh` - Verification script

### Configuration
- `cleanup-prompt.txt` - AI prompt for Cursor agent cleanup
- `.github/pull_request_template.md` - PR template for cleanup changes
- `CLEANUP_README.md` - This documentation

## 🚀 Usage

### 1. Run Full Cleanup
```bash
./scripts/cleanup.sh
```

This will:
- Create a new branch `chore/codebase-cleanup`
- Set up the cleanup prompt file
- Create GitHub PR template
- Set up additional automation scripts

### 2. Verify Cleanup Results
```bash
./scripts/verify-cleanup.sh
```

This will:
- Check build status
- Run linting
- Verify TypeScript
- Check for common issues

### 3. Pre-commit Checks
```bash
./scripts/pre-commit-cleanup.sh
```

This will:
- Check for unused imports
- Verify Tailwind compilation
- Run linting

## 🤖 AI-Powered Cleanup

The cleanup system uses Cursor AI with a comprehensive prompt to:

1. **Remove Unused Code**: Imports, variables, components, pages
2. **Refactor Duplicates**: Consolidate repeated logic
3. **Modernize Structure**: Improve organization and conventions
4. **Optimize Performance**: Reduce bundle size and improve efficiency
5. **Enhance Quality**: Fix linting issues and improve TypeScript coverage

## 🔒 Safety Features

- All changes are made in a separate branch
- Comprehensive testing before deployment
- Detailed PR template for review
- Reversible changes via git history
- No breaking changes to functionality

## 📋 Cleanup Checklist

### Before Running
- [ ] Ensure all current work is committed
- [ ] Test current functionality
- [ ] Backup any critical customizations

### After Cleanup
- [ ] Review all changes in the PR
- [ ] Test critical user flows
- [ ] Verify API endpoints
- [ ] Check demo mode functionality
- [ ] Confirm build and deployment

### Ongoing Maintenance
- [ ] Run pre-commit checks regularly
- [ ] Monitor for new unused code
- [ ] Update cleanup prompts as needed
- [ ] Review and improve automation scripts

## 🎯 Best Practices

1. **Incremental Cleanup**: Don't try to fix everything at once
2. **Test Thoroughly**: Always verify functionality after cleanup
3. **Document Changes**: Use the PR template to track modifications
4. **Regular Maintenance**: Run cleanup checks regularly
5. **Team Communication**: Keep the team informed of cleanup activities

## 🔧 Customization

### Modifying the Cleanup Prompt
Edit `cleanup-prompt.txt` to adjust the scope and focus of the cleanup.

### Adding New Checks
Extend the verification scripts to include additional quality checks.

### Updating PR Template
Modify `.github/pull_request_template.md` to match your team's workflow.

## 🆘 Troubleshooting

### Build Failures
- Check for TypeScript errors
- Verify all imports are correct
- Ensure environment variables are set

### Linting Issues
- Run `npm run lint --fix` to auto-fix issues
- Review and manually fix remaining issues
- Update ESLint configuration if needed

### Performance Issues
- Check bundle size with `npm run build`
- Analyze with `@next/bundle-analyzer`
- Review and optimize large components

## 📞 Support

For issues with the cleanup system:
1. Check this documentation
2. Review the script logs
3. Test manually to isolate issues
4. Update scripts as needed

---

**Remember**: The goal is to improve code quality while maintaining all existing functionality. When in doubt, be conservative and flag issues for manual review.
