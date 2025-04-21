# API Reference

## Overview

The WordPress MCP Server exposes all functionality through JSON-RPC 2.0 methods with the prefix `wp.`. Each method requires appropriate authentication and site context.

## Authentication

All requests must include one of the following authentication methods:

- **API Key**: Use the `X-API-Key` header
- **Bearer Token**: Use the `Authorization: Bearer <token>` header

## Common Parameters

Most methods require these parameters:
- `site`: The WordPress site identifier from your configuration
- `id`: The resource ID when accessing specific items

## WordPress Tools

### Posts Management

#### wp.posts.list
List WordPress posts with optional filtering.

**Parameters:**
- `site` (string, required): Site identifier
- `page` (number, optional): Page number
- `perPage` (number, optional): Items per page
- `search` (string, optional): Search term
- `author` (number|string, optional): Author ID
- `categories` (number|string|array, optional): Category ID(s)
- `tags` (number|string|array, optional): Tag ID(s)
- `status` (string, optional): Post status
- `orderBy` (string, optional): Sort field
- `order` ('asc'|'desc', optional): Sort direction

**Example:**
```json
{
  "jsonrpc": "2.0",
  "method": "wp.posts.list",
  "params": {
    "site": "my-blog",
    "status": "publish",
    "perPage": 10
  },
  "id": 1
}
```

#### wp.posts.get
Retrieve a single post by ID.

**Parameters:**
- `site` (string, required): Site identifier
- `id` (number, required): Post ID

#### wp.posts.create
Create a new WordPress post.

**Parameters:**
- `site` (string, required): Site identifier
- `title` (string, required): Post title
- `content` (string, required): Post content
- `status` (string, optional): Post status (draft, publish, private)
- `excerpt` (string, optional): Post excerpt
- `categories` (array, optional): Category IDs
- `tags` (array, optional): Tag IDs
- `featured_media` (number, optional): Featured image ID
- `author` (number, optional): Author ID

#### wp.posts.update
Update an existing post.

**Parameters:**
- `site` (string, required): Site identifier
- `id` (number, required): Post ID
- All parameters from `create` (optional)

#### wp.posts.delete
Delete a post.

**Parameters:**
- `site` (string, required): Site identifier
- `id` (number, required): Post ID
- `force` (boolean, optional): Force permanent deletion

### Pages Management

#### wp.pages.list
List WordPress pages with optional filtering.

**Parameters:** Similar to posts.list with additional:
- `parent` (number, optional): Parent page ID
- `menu_order` (number, optional): Menu order

#### wp.pages.get
Retrieve a single page by ID.

#### wp.pages.create
Create a new WordPress page.

**Parameters:** Similar to posts.create with additional:
- `parent` (number, optional): Parent page ID
- `menu_order` (number, optional): Menu order
- `template` (string, optional): Page template

#### wp.pages.update
Update an existing page.

#### wp.pages.delete
Delete a page.

### Media Management

#### wp.media.list
List media library items.

**Parameters:**
- `site` (string, required): Site identifier
- `mediaType` ('image'|'video'|'audio'|'application', optional): Media type
- `mimeType` (string, optional): MIME type (e.g., image/jpeg)
- Other standard list parameters

#### wp.media.get
Retrieve a single media item by ID.

#### wp.media.create
Upload a new media file.

**Parameters:**
- `site` (string, required): Site identifier
- `file` (string, required): Base64 encoded file content
- `filename` (string, required): Original filename
- `title` (string, optional): Media title
- `caption` (string, optional): Media caption
- `alt_text` (string, optional): Alternative text
- `description` (string, optional): Media description
- `post` (number, optional): Associated post ID

#### wp.media.update
Update media item metadata.

#### wp.media.delete
Delete a media item.

### Users Management

#### wp.users.list
List WordPress users.

**Parameters:**
- `site` (string, required): Site identifier
- `roles` (string|array, optional): Filter by role(s)
- `exclude` (array, optional): User IDs to exclude
- `include` (array, optional): User IDs to include

#### wp.users.get
Retrieve a single user by ID.

#### wp.users.me
Get the currently authenticated user.

#### wp.users.create
Create a new user.

**Parameters:**
- `site` (string, required): Site identifier
- `username` (string, required): Username (login)
- `email` (string, required): Email address
- `password` (string, required): User password
- `first_name` (string, optional): First name
- `last_name` (string, optional): Last name
- `roles` (array, optional): User roles
- `url` (string, optional): User website URL
- `description` (string, optional): User description

#### wp.users.update
Update a user.

#### wp.users.delete
Delete a user.

**Parameters:**
- `site` (string, required): Site identifier
- `id` (number, required): User ID
- `reassign` (number, optional): User ID to reassign posts to

### Categories & Tags

#### wp.categories.list
List categories.

#### wp.categories.get
Get a category by ID.

#### wp.categories.create
Create a new category.

**Parameters:**
- `site` (string, required): Site identifier
- `name` (string, required): Category name
- `description` (string, optional): Category description
- `slug` (string, optional): Category slug
- `parent` (number, optional): Parent category ID

#### wp.categories.update
Update a category.

#### wp.categories.delete
Delete a category.

#### wp.tags.list
List tags.

#### wp.tags.get
Get a tag by ID.

#### wp.tags.create
Create a new tag.

#### wp.tags.update
Update a tag.

#### wp.tags.delete
Delete a tag.

### Plugins & Themes

#### wp.plugins.list
List installed plugins.

**Parameters:**
- `site` (string, required): Site identifier
- `status` ('active'|'inactive'|'upgrade', optional): Plugin status filter

#### wp.plugins.get
Get plugin details.

#### wp.plugins.install
Install a plugin from the WordPress repository.

**Parameters:**
- `site` (string, required): Site identifier
- `slug` (string, required): Plugin slug
- `status` ('active'|'inactive', optional): Status after installation

#### wp.plugins.activate
Activate a plugin.

#### wp.plugins.deactivate
Deactivate a plugin.

#### wp.plugins.update
Update a plugin.

#### wp.plugins.delete
Delete a plugin.

#### wp.themes.list
List installed themes.

#### wp.themes.get
Get theme details.

#### wp.themes.install
Install a theme from the WordPress repository.

#### wp.themes.activate
Activate a theme.

#### wp.themes.update
Update a theme.

#### wp.themes.delete
Delete a theme.

## MCP Resources

### resources.list
List available WordPress resources.

**Parameters:**
- `site` (string, optional): Filter by site
- `type` (string, optional): Filter by resource type

### resources.get
Get content for a specific resource.

**Parameters:**
- `uri` (string, required): Resource URI (e.g., wordpress://site/posts/123)

## Error Codes

Standard JSON-RPC error codes plus custom codes:

- `-32700`: Parse error
- `-32600`: Invalid request
- `-32601`: Method not found
- `-32602`: Invalid params
- `-32603`: Internal error
- `-32000`: Server error
- `-32001`: Authentication error
- `-32002`: Authorization error
- `-32003`: Resource not found
- `-32004`: Rate limit exceeded

## Rate Limiting

The API implements rate limiting based on:
- API key
- IP address (for anonymous requests)

Default limits:
- 100 requests per 15 minutes per API key
- 20 requests per 15 minutes per IP

## Batch Requests

Multiple requests can be sent in a single HTTP request:

```json
[
  { "jsonrpc": "2.0", "method": "wp.posts.list", "params": { "site": "blog" }, "id": 1 },
  { "jsonrpc": "2.0", "method": "wp.users.list", "params": { "site": "blog" }, "id": 2 }
]
```

The response will be an array of results in the same order.
