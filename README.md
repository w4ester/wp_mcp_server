# WordPress MCP Server

A TypeScript-based Model Context Protocol (MCP) server that provides a standardized interface for AI systems to interact with WordPress sites. This server enables secure, programmatic access to WordPress functionality through JSON-RPC 2.0.

## Choose Your Guide

We've created documentation for different levels of experience:

- **[Friendly Guide](docs/README-BEGINNER.md)**: If you're new to MCP servers and want to learn what this is all about
- **[Working Guide](docs/README-INTERMEDIATE.md)**: If you have some technical knowledge and want to implement this in your projects
- **[Let's GrOw! Guide](docs/README-ADVANCED.md)**: If you're a developer looking to contribute or extend the functionality

## Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/wordpress-mcp-server.git
cd wordpress-mcp-server

# Install dependencies
npm install

# Configure your WordPress sites
cp config/wp-sites.example.json config/wp-sites.json
cp config/wp-secrets.example.json config/wp-secrets.json

# Build and start
npm run build
npm start
```

## Features

- **Multi-site Support**: Manage multiple WordPress sites from a single server
- **Secure Authentication**: API key and WordPress application password support
- **Full CRUD Operations**: Create, read, update, delete posts, pages, media, and more
- **AI-Ready**: Designed for integration with LLM applications
- **Extensible**: Easy to add new WordPress features and tools
- **Resource Management**: MCP resource exposure for WordPress entities
- **Performance Optimized**: Built-in caching and connection pooling
- **Monitoring**: Comprehensive metrics and logging

## Supported WordPress Features

- Posts and Pages
- Media Library
- Users and Roles
- Categories and Tags
- Plugins and Themes
- Site Settings
- Custom Post Types

## Requirements

- Node.js 16+
- WordPress 5.6+ with REST API enabled
- Application passwords enabled in WordPress

## Documentation

- [API Reference](docs/API.md)
- [Configuration Guide](docs/CONFIGURATION.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

## Support

- [GitHub Discussions](https://github.com/w4ester/wordpress-mcp-server/discussions)
- [Issue Tracker](https://github.com/w4ester/wordpress-mcp-server/issues)

## Acknowledgments

Built with:
- [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk)
- [Express.js](https://expressjs.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [WordPress REST API](https://developer.wordpress.org/rest-api/)
