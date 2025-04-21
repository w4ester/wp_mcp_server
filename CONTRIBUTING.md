# Contributing to WordPress MCP Server

First off, thank you for considering contributing to WordPress MCP Server! Let's make this project even better together. This document outlines how you can contribute, the coding standards we follow, and the process for submitting changes.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct:

- Be respectful and inclusive
- Exercise empathy and kindness
- Provide and accept constructive feedback
- Focus on what is best for the community

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- Use a clear and descriptive title
- Describe the exact steps to reproduce the problem
- Provide specific examples to demonstrate the steps
- Describe the behavior you observed and what you expected
- Include logs, screenshots, or error messages if applicable
- Note your environment (OS, Node.js version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- Use a clear and descriptive title
- Provide a detailed description of the proposed functionality
- Explain why this enhancement would be useful
- List any similar features in other tools if applicable

### Pull Requests

1. Fork the repository and create your branch from `main`
2. If you've added code, add tests that cover the new functionality
3. Ensure the test suite passes (`npm test`)
4. Make sure your code follows our style guidelines
5. Issue that pull request!

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Copy config examples: `cp config/*.example.json config/`
4. Run tests: `npm test`
5. Start development server: `npm run dev`

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Define explicit types for parameters and return values
- Use interfaces for object structures
- Avoid `any` type unless absolutely necessary

### Style Guide

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Follow ESLint configuration
- Write meaningful variable and function names
- Comment complex logic

Example:
```typescript
// Good
interface UserData {
  id: number;
  name: string;
  email: string;
}

async function getUser(id: number): Promise<UserData> {
  // Implementation
}

// Bad
async function getUser(id) {
  // Implementation
}
```

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

Example:
```
feat: Add support for custom post types

- Implement CustomPostTypeHandler class
- Add tests for custom post type operations
- Update documentation

Closes #123
```

### Testing

- Write unit tests for all new functionality
- Maintain test coverage above 80%
- Use descriptive test names
- Follow the Arrange-Act-Assert pattern

Example:
```typescript
describe('WordPressClient', () => {
  test('should create a new post successfully', async () => {
    // Arrange
    const mockResponse = { id: 1, title: 'Test Post' };
    mockedAxios.post.mockResolvedValue({ data: mockResponse });
    
    // Act
    const result = await client.createPost({ title: 'Test Post' });
    
    // Assert
    expect(result).toEqual(mockResponse);
    expect(mockedAxios.post).toHaveBeenCalledWith('/posts', expect.any(Object));
  });
});
```

## Documentation

- Update documentation for any changed functionality
- Use JSDoc comments for functions and classes
- Include examples in documentation
- Keep README.md up to date

## Project Structure

```
wordpress-mcp-server/
├── src/                 # Source code
│   ├── json-rpc/       # JSON-RPC implementation
│   ├── wordpress/      # WordPress client and tools
│   ├── resources/      # MCP resource management
│   ├── server/         # HTTP server implementation
│   └── utils/          # Utility functions
├── tests/              # Test files
├── docs/               # Documentation
└── config/             # Configuration files
```

## Adding New Features

1. **Discuss First**: For major changes, open an issue first to discuss
2. **Design**: Document the design and approach
3. **Implement**: Write clean, tested code
4. **Document**: Update all relevant documentation
5. **Test**: Add comprehensive tests
6. **Review**: Submit PR for review

### Example: Adding a New WordPress Tool

1. Create tool file: `src/wordpress/tools/my-tool.ts`
2. Implement tool logic following existing patterns
3. Add tests: `tests/tools/my-tool.test.ts`
4. Register tool in `src/wordpress/tools/index.ts`
5. Update documentation
6. Submit PR

## Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create a release branch
4. Run full test suite
5. Build production artifacts
6. Create GitHub release
7. Publish to npm (if applicable)

## Community

- Join our [Discord server](https://discord.gg/wordpress-mcp)
- Follow us on [Twitter](https://twitter.com/wordpress-mcp)
- Read our [blog](https://blog.wordpress-mcp.dev)

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project documentation

Thank you for contributing to WordPress MCP Server!
