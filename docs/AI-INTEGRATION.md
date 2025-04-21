# AI Integration Examples

This guide shows how to integrate the WordPress MCP Server with AI applications like Claude, ChatGPT, or custom LLM solutions.

## Basic Integration

### Using with Claude Desktop

1. Start the MCP server:
```bash
npm start
```

2. Configure Claude Desktop to use the MCP server:
```json
{
  "mcpServers": {
    "wordpress": {
      "url": "http://localhost:3000/mcp",
      "apiKey": "your-api-key"
    }
  }
}
```

3. Use natural language commands:
```
Claude, create a new blog post titled "AI and the Future of Content Creation" 
with content about how AI is changing content workflows.
```

### Using with Custom AI Applications

```typescript
// ai-integration.ts
import axios from 'axios';

class WordPressMCPClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async sendRequest(method: string, params: any) {
    const response = await axios.post(this.baseUrl, {
      jsonrpc: '2.0',
      method,
      params,
      id: Date.now()
    }, {
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.error) {
      throw new Error(response.data.error.message);
    }

    return response.data.result;
  }

  async createPost(site: string, title: string, content: string) {
    return this.sendRequest('wp.posts.create', {
      site,
      title,
      content,
      status: 'draft'
    });
  }
}

// Usage with AI
async function generateAndPublishContent(topic: string) {
  const mcp = new WordPressMCPClient('http://localhost:3000/mcp', 'your-api-key');
  
  // Generate content with AI (example using OpenAI)
  const generatedContent = await generateWithAI(topic);
  
  // Create WordPress post
  const post = await mcp.createPost('my-blog', generatedContent.title, generatedContent.content);
  
  return post;
}
```

## Advanced Use Cases

### 1. Content Generation Pipeline

```typescript
async function contentPipeline(topic: string, keywords: string[]) {
  const mcp = new WordPressMCPClient(MCP_URL, API_KEY);
  
  // 1. Generate content outline
  const outline = await generateOutline(topic, keywords);
  
  // 2. Create draft post
  const draft = await mcp.createPost('my-blog', outline.title, outline.summary);
  
  // 3. Generate full content
  const fullContent = await generateFullContent(outline);
  
  // 4. Update post with complete content
  await mcp.sendRequest('wp.posts.update', {
    site: 'my-blog',
    id: draft.post.id,
    content: fullContent,
    status: 'pending'
  });
  
  // 5. Generate and upload featured image
  const imageData = await generateImage(topic);
  const media = await mcp.sendRequest('wp.media.create', {
    site: 'my-blog',
    file: imageData.base64,
    filename: `${topic.toLowerCase().replace(/\s+/g, '-')}.jpg`
  });
  
  // 6. Attach featured image to post
  await mcp.sendRequest('wp.posts.update', {
    site: 'my-blog',
    id: draft.post.id,
    featured_media: media.media.id
  });
  
  return draft.post.id;
}
```

### 2. Multi-Site Content Distribution

```typescript
async function distributeContent(content: any, sites: string[]) {
  const mcp = new WordPressMCPClient(MCP_URL, API_KEY);
  const results = [];
  
  for (const site of sites) {
    try {
      // Customize content for each site
      const customized = await customizeForSite(content, site);
      
      // Create post on site
      const post = await mcp.createPost(site, customized.title, customized.content);
      
      results.push({
        site,
        postId: post.post.id,
        url: post.post.link
      });
    } catch (error) {
      console.error(`Failed to publish to ${site}:`, error);
      results.push({
        site,
        error: error.message
      });
    }
  }
  
  return results;
}
```

### 3. AI-Powered Content Optimization

```typescript
async function optimizeContent(postId: number, site: string) {
  const mcp = new WordPressMCPClient(MCP_URL, API_KEY);
  
  // Get existing post
  const post = await mcp.sendRequest('wp.posts.get', { site, id: postId });
  
  // Analyze content with AI
  const analysis = await analyzeContent(post.post.content);
  
  // Generate optimized version
  const optimized = await optimizeWithAI(post.post.content, analysis);
  
  // Update post
  await mcp.sendRequest('wp.posts.update', {
    site,
    id: postId,
    content: optimized.content,
    excerpt: optimized.excerpt
  });
  
  // Add SEO metadata
  if (optimized.seoTitle || optimized.seoDescription) {
    // Note: This would require a custom WordPress plugin to handle SEO fields
    await mcp.sendRequest('wp.posts.updateMeta', {
      site,
      id: postId,
      meta: {
        _yoast_wpseo_title: optimized.seoTitle,
        _yoast_wpseo_metadesc: optimized.seoDescription
      }
    });
  }
  
  return optimized;
}
```

## Tool-Specific Integrations

### Claude Tool Definition

```json
{
  "name": "wordpress_manager",
  "description": "Manage WordPress content across multiple sites",
  "input_schema": {
    "type": "object",
    "properties": {
      "action": {
        "type": "string",
        "enum": ["create_post", "update_post", "upload_media", "manage_users"]
      },
      "site": {
        "type": "string",
        "description": "WordPress site identifier"
      },
      "data": {
        "type": "object",
        "description": "Action-specific data"
      }
    },
    "required": ["action", "site", "data"]
  }
}
```

### ChatGPT Function Calling

```json
{
  "name": "wordpress_operations",
  "description": "Perform WordPress operations via MCP",
  "parameters": {
    "type": "object",
    "properties": {
      "operation": {
        "type": "string",
        "enum": ["posts", "pages", "media", "users", "categories", "tags"]
      },
      "action": {
        "type": "string",
        "enum": ["create", "read", "update", "delete", "list"]
      },
      "site": {
        "type": "string"
      },
      "params": {
        "type": "object"
      }
    },
    "required": ["operation", "action", "site"]
  }
}
```

## Best Practices

1. **Error Handling**: Always implement proper error handling for MCP requests
2. **Rate Limiting**: Respect rate limits to avoid overwhelming the server
3. **Batching**: Use batch operations when working with multiple items
4. **Caching**: Cache frequently accessed data to reduce API calls
5. **Validation**: Validate AI-generated content before publishing
6. **Security**: Never expose API keys in client-side code
7. **Monitoring**: Track AI operations for debugging and optimization

## Example: Complete AI Blog Manager

```typescript
class AIBlogManager {
  private mcp: WordPressMCPClient;
  private aiClient: AIClient;

  constructor(mcpUrl: string, mcpApiKey: string, aiApiKey: string) {
    this.mcp = new WordPressMCPClient(mcpUrl, mcpApiKey);
    this.aiClient = new AIClient(aiApiKey);
  }

  async generateBlogPost(topic: string, style: string = 'informative') {
    // Generate content
    const content = await this.aiClient.generateContent({
      topic,
      style,
      format: 'blog_post'
    });

    // Create draft
    const post = await this.mcp.createPost('my-blog', content.title, content.body);

    // Generate and attach featured image
    const image = await this.aiClient.generateImage(content.imagePrompt);
    const media = await this.mcp.sendRequest('wp.media.create', {
      site: 'my-blog',
      file: image.base64,
      filename: `${content.slug}.jpg`
    });

    // Update post with featured image
    await this.mcp.sendRequest('wp.posts.update', {
      site: 'my-blog',
      id: post.post.id,
      featured_media: media.media.id
    });

    return post;
  }

  async optimizeExistingPost(postId: number) {
    // Get post content
    const post = await this.mcp.sendRequest('wp.posts.get', {
      site: 'my-blog',
      id: postId
    });

    // Analyze with AI
    const analysis = await this.aiClient.analyzeContent(post.post.content);

    // Generate improvements
    const improvements = await this.aiClient.suggestImprovements(analysis);

    // Apply improvements
    const updatedContent = await this.applyImprovements(post.post.content, improvements);

    // Update post
    await this.mcp.sendRequest('wp.posts.update', {
      site: 'my-blog',
      id: postId,
      content: updatedContent
    });

    return improvements;
  }

  async scheduleContent(topics: string[], frequency: string = 'daily') {
    const schedule = await this.aiClient.generateContentCalendar(topics, frequency);
    
    for (const item of schedule) {
      const content = await this.generateBlogPost(item.topic, item.style);
      
      // Schedule for future publication
      await this.mcp.sendRequest('wp.posts.update', {
        site: 'my-blog',
        id: content.post.id,
        status: 'future',
        date: item.publishDate
      });
    }

    return schedule;
  }
}

// Usage
const blogManager = new AIBlogManager(
  'http://localhost:3000/mcp',
  'your-mcp-api-key',
  'your-ai-api-key'
);

// Generate and publish a blog post
await blogManager.generateBlogPost('The Future of Renewable Energy');

// Optimize existing content
await blogManager.optimizeExistingPost(123);

// Schedule a month of content
await blogManager.scheduleContent([
  'Solar Power Innovations',
  'Wind Energy Trends',
  'Electric Vehicle Updates',
  'Sustainable Living Tips'
], 'weekly');
```

## Conclusion

The WordPress MCP Server provides a powerful bridge between AI systems and WordPress, enabling automated content creation, management, and optimization. By following these integration patterns, you can build sophisticated AI-powered content workflows that scale across multiple WordPress sites.
