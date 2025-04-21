# WordPress MCP Server: A Beginner's Guide

## What is this? Let's start from scratch!

Imagine you want to manage multiple WordPress websites, all from one place, maybe even through an AI assistant like Claude. That's exactly what this WordPress MCP Server lets you do! 

Think of it as a smart remote control for WordPress that AI systems can use to build and manage websites for you.

## What problems does this solve?

1. **The Manual Work Problem**: Normally, to manage WordPress sites, you have to:
   - Log into each site's dashboard separately
   - Click through many menus to make changes
   - Remember how to do different tasks on different sites

2. **The AI Integration Problem**: AI assistants like Claude can't directly interact with your WordPress sites (for security reasons, which is good!)

3. **The Automation Problem**: Without tools like this, you can't easily automate website tasks across multiple sites

## What even is MCP?

MCP stands for Model Context Protocol. It's like a universal translator that lets AI systems talk to different services (like your WordPress sites) in a safe, controlled way. Think of it as a bridge between AI and your WordPress websites.

## Let's Break This Down Simply

### What You'll Be Able to Do:
- Create new blog posts on your websites just by asking an AI
- Manage multiple WordPress sites from one place
- Update pages, upload images, and manage users easily
- Automate routine website tasks

## Step-by-Step: Your First WordPress MCP Setup

### Prerequisites (What You Need First)
1. A computer with Node.js installed (this is what runs the server)
2. At least one WordPress website
3. Basic comfort with using the command line

### Step 1: Get the WordPress MCP Server
```bash
# Open your terminal (Command Prompt on Windows, Terminal on Mac)
# Navigate to where you want to install
cd /path/where/you/want/to/install

# Download the project
git clone https://github.com/yourusername/wordpress-mcp-server.git

# Go into the project folder
cd wordpress-mcp-server

# Install required packages
npm install
```

### Step 2: Connect Your WordPress Site
You need to tell the MCP server about your WordPress site:

1. Create a file called `wp-sites.json` in the config folder:
```json
{
  "sites": [
    {
      "name": "my-blog",
      "url": "https://myblog.com",
      "username": "your-username"
    }
  ]
}
```

2. Create an Application Password in WordPress:
   - Log into your WordPress admin dashboard
   - Go to Users → Profile
   - Scroll down to "Application Passwords"
   - Enter a name like "MCP Server"
   - Click "Add New Application Password"
   - Copy the generated password

3. Create a file called `wp-secrets.json` in the config folder:
```json
{
  "my-blog": {
    "password": "paste-your-application-password-here"
  }
}
```

### Step 3: Start the Server
```bash
# Build the project
npm run build

# Start the server
npm start
```

### Step 4: Test It Out
The server is now running! You can test it using a tool like Postman or curl:

```bash
# Create a test post
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "wp.posts.create",
    "params": {
      "site": "my-blog",
      "title": "My First MCP Post",
      "content": "This post was created using WordPress MCP!"
    },
    "id": 1
  }'
```

## Common Tasks Explained

### Creating a Blog Post
```json
{
  "method": "wp.posts.create",
  "params": {
    "site": "my-blog",
    "title": "My New Post",
    "content": "Content goes here",
    "status": "draft"  // Options: draft, publish, private
  }
}
```

### Uploading an Image
```json
{
  "method": "wp.media.create",
  "params": {
    "site": "my-blog",
    "file": "base64encodedimagedata",
    "filename": "my-image.jpg",
    "title": "My Image"
  }
}
```

### Managing Pages
```json
{
  "method": "wp.pages.create",
  "params": {
    "site": "my-blog",
    "title": "About Us",
    "content": "Welcome to our company..."
  }
}
```

## Troubleshooting Common Issues

### "Connection refused" error
- Make sure the server is running (`npm start`)
- Check that you're using the correct port (default is 3000)

### "Authentication failed" error
- Double-check your WordPress username and application password
- Make sure the application password was created for the correct user

### "Site not found" error
- Verify the site name in wp-sites.json matches exactly what you're using
- Ensure the site URL is correct and accessible

## What's Next?

Once you're comfortable with the basics:
1. Try connecting multiple WordPress sites
2. Explore more features like managing users and categories
3. Consider using it with AI assistants for automated content creation

## Need More Help?

- Read the full documentation for more detailed information
- Join our community forums for support
- Check out example projects that use WordPress MCP

Remember: This tool makes managing WordPress sites easier, but take time to understand each feature before using it on production websites!
