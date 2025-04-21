/**
 * WordPress Types
 * 
 * Type definitions for WordPress API objects and requests.
 */

/**
 * WordPress credentials
 */
export interface WordPressCredentials {
  username: string;
  applicationPassword: string;
}

/**
 * WordPress site configuration
 */
export interface WordPressSiteConfig {
  baseUrl: string;
  credentials: WordPressCredentials;
  maxConcurrent?: number;
  timeout?: number;
  cacheEnabled?: boolean;
  cacheTimeout?: number;
}

/**
 * WordPress API options
 */
export interface WordPressApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * WordPress error response
 */
export interface WordPressErrorResponse {
  code: string;
  message: string;
  data?: any;
}

/**
 * WordPress post
 */
export interface WordPressPost {
  id: number;
  date?: string;
  date_gmt?: string;
  modified?: string;
  modified_gmt?: string;
  slug?: string;
  status?: string;
  type?: string;
  link?: string;
  title?: {
    rendered: string;
    raw?: string;
  };
  content?: {
    rendered: string;
    raw?: string;
    protected?: boolean;
  };
  excerpt?: {
    rendered: string;
    raw?: string;
    protected?: boolean;
  };
  author?: number;
  featured_media?: number;
  comment_status?: string;
  ping_status?: string;
  sticky?: boolean;
  template?: string;
  format?: string;
  meta?: Record<string, any>;
  categories?: number[];
  tags?: number[];
  _links?: Record<string, any>;
  [key: string]: any;
}

/**
 * WordPress post creation request
 */
export interface CreatePostRequest {
  title: string;
  content: string;
  status?: 'publish' | 'future' | 'draft' | 'pending' | 'private';
  excerpt?: string;
  date?: string;
  slug?: string;
  author?: number;
  featured_media?: number;
  categories?: number[];
  tags?: number[];
  format?: string;
  sticky?: boolean;
  template?: string;
  meta?: Record<string, any>;
  [key: string]: any;
}

/**
 * WordPress page
 */
export interface WordPressPage extends WordPressPost {
  parent?: number;
  menu_order?: number;
}

/**
 * WordPress media
 */
export interface WordPressMedia {
  id: number;
  date?: string;
  date_gmt?: string;
  modified?: string;
  modified_gmt?: string;
  slug?: string;
  status?: string;
  type?: string;
  link?: string;
  title?: {
    rendered: string;
    raw?: string;
  };
  author?: number;
  comment_status?: string;
  ping_status?: string;
  template?: string;
  description?: {
    rendered: string;
    raw?: string;
  };
  caption?: {
    rendered: string;
    raw?: string;
  };
  alt_text?: string;
  media_type?: string;
  mime_type?: string;
  media_details?: Record<string, any>;
  source_url?: string;
  _links?: Record<string, any>;
  [key: string]: any;
}

/**
 * WordPress user
 */
export interface WordPressUser {
  id: number;
  username?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  url?: string;
  description?: string;
  link?: string;
  locale?: string;
  nickname?: string;
  slug?: string;
  roles?: string[];
  registered_date?: string;
  capabilities?: Record<string, boolean>;
  extra_capabilities?: Record<string, boolean>;
  avatar_urls?: Record<string, string>;
  meta?: Record<string, any>;
  _links?: Record<string, any>;
  [key: string]: any;
}

/**
 * WordPress plugin
 */
export interface WordPressPlugin {
  plugin: string;
  status: string;
  name: string;
  description?: {
    rendered: string;
    raw?: string;
  };
  version?: string;
  author?: {
    rendered: string;
    raw?: string;
  };
  author_uri?: string;
  plugin_uri?: string;
  network_only?: boolean;
  requires_wp?: string;
  requires_php?: string;
  textdomain?: string;
  _links?: Record<string, any>;
  [key: string]: any;
}

/**
 * WordPress theme
 */
export interface WordPressTheme {
  stylesheet: string;
  template?: string;
  status?: string;
  name?: string;
  description?: {
    rendered: string;
    raw?: string;
  };
  version?: string;
  author?: {
    rendered: string;
    raw?: string;
  };
  author_uri?: string;
  theme_uri?: string;
  screenshot?: string;
  tags?: string[];
  textdomain?: string;
  _links?: Record<string, any>;
  [key: string]: any;
}

/**
 * WordPress category
 */
export interface WordPressCategory {
  id: number;
  count?: number;
  description?: string;
  link?: string;
  name?: string;
  slug?: string;
  taxonomy?: string;
  parent?: number;
  meta?: Record<string, any>;
  _links?: Record<string, any>;
  [key: string]: any;
}

/**
 * WordPress tag
 */
export interface WordPressTag {
  id: number;
  count?: number;
  description?: string;
  link?: string;
  name?: string;
  slug?: string;
  taxonomy?: string;
  meta?: Record<string, any>;
  _links?: Record<string, any>;
  [key: string]: any;
}
