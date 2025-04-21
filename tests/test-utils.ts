/**
 * Test Utilities and Mock Data
 * 
 * Common utilities and mock data for tests.
 */

import { WordPressSiteConfig } from '../src/wordpress/types.js';

export function createMockSiteConfig(overrides?: Partial<WordPressSiteConfig>): WordPressSiteConfig {
  return {
    name: 'test-site',
    url: 'https://example.com',
    username: 'admin',
    applicationPassword: 'password',
    environment: 'production',
    ...overrides
  };
}

export function createMockPost(overrides?: any) {
  return {
    id: 1,
    date: '2023-01-01T00:00:00',
    date_gmt: '2023-01-01T00:00:00',
    guid: { rendered: 'https://example.com/?p=1' },
    modified: '2023-01-01T00:00:00',
    modified_gmt: '2023-01-01T00:00:00',
    slug: 'test-post',
    status: 'publish',
    type: 'post',
    link: 'https://example.com/test-post/',
    title: { rendered: 'Test Post' },
    content: { rendered: '<p>Test content</p>', protected: false },
    excerpt: { rendered: '<p>Test excerpt</p>', protected: false },
    author: 1,
    featured_media: 0,
    comment_status: 'open',
    ping_status: 'open',
    sticky: false,
    template: '',
    format: 'standard',
    categories: [1],
    tags: [],
    ...overrides
  };
}

export function createMockPage(overrides?: any) {
  return {
    id: 1,
    date: '2023-01-01T00:00:00',
    date_gmt: '2023-01-01T00:00:00',
    guid: { rendered: 'https://example.com/?page_id=1' },
    modified: '2023-01-01T00:00:00',
    modified_gmt: '2023-01-01T00:00:00',
    slug: 'test-page',
    status: 'publish',
    type: 'page',
    link: 'https://example.com/test-page/',
    title: { rendered: 'Test Page' },
    content: { rendered: '<p>Test content</p>', protected: false },
    excerpt: { rendered: '<p>Test excerpt</p>', protected: false },
    author: 1,
    featured_media: 0,
    comment_status: 'closed',
    ping_status: 'closed',
    parent: 0,
    menu_order: 0,
    template: '',
    ...overrides
  };
}

export function createMockUser(overrides?: any) {
  return {
    id: 1,
    username: 'testuser',
    name: 'Test User',
    first_name: 'Test',
    last_name: 'User',
    email: 'test@example.com',
    url: '',
    description: '',
    link: 'https://example.com/author/testuser/',
    locale: 'en_US',
    nickname: 'testuser',
    slug: 'testuser',
    roles: ['administrator'],
    registered_date: '2023-01-01T00:00:00',
    capabilities: {
      administrator: true
    },
    extra_capabilities: {
      administrator: true
    },
    avatar_urls: {
      '24': 'https://example.com/wp-content/uploads/avatar-24.jpg',
      '48': 'https://example.com/wp-content/uploads/avatar-48.jpg',
      '96': 'https://example.com/wp-content/uploads/avatar-96.jpg'
    },
    ...overrides
  };
}

export function createMockMedia(overrides?: any) {
  return {
    id: 1,
    date: '2023-01-01T00:00:00',
    date_gmt: '2023-01-01T00:00:00',
    guid: { rendered: 'https://example.com/wp-content/uploads/2023/01/test-image.jpg' },
    modified: '2023-01-01T00:00:00',
    modified_gmt: '2023-01-01T00:00:00',
    slug: 'test-image',
    status: 'inherit',
    type: 'attachment',
    link: 'https://example.com/test-image/',
    title: { rendered: 'Test Image' },
    author: 1,
    comment_status: 'open',
    ping_status: 'closed',
    template: '',
    alt_text: '',
    caption: { rendered: '' },
    description: { rendered: '' },
    media_type: 'image',
    mime_type: 'image/jpeg',
    media_details: {
      width: 1920,
      height: 1080,
      file: '2023/01/test-image.jpg',
      sizes: {}
    },
    source_url: 'https://example.com/wp-content/uploads/2023/01/test-image.jpg',
    ...overrides
  };
}

export function createMockCategory(overrides?: any) {
  return {
    id: 1,
    count: 10,
    description: '',
    link: 'https://example.com/category/uncategorized/',
    name: 'Uncategorized',
    slug: 'uncategorized',
    taxonomy: 'category',
    parent: 0,
    meta: [],
    ...overrides
  };
}

export function createMockTag(overrides?: any) {
  return {
    id: 1,
    count: 5,
    description: '',
    link: 'https://example.com/tag/test/',
    name: 'Test',
    slug: 'test',
    taxonomy: 'post_tag',
    meta: [],
    ...overrides
  };
}

export function createMockPlugin(overrides?: any) {
  return {
    plugin: 'test-plugin/test-plugin.php',
    status: 'active',
    name: 'Test Plugin',
    plugin_uri: 'https://wordpress.org/plugins/test-plugin/',
    author: 'Test Author',
    author_uri: 'https://example.com',
    description: { rendered: 'A test plugin' },
    version: '1.0.0',
    network_only: false,
    requires_wp: '5.0',
    requires_php: '7.0',
    textdomain: 'test-plugin',
    ...overrides
  };
}

export function createMockTheme(overrides?: any) {
  return {
    stylesheet: 'test-theme',
    template: 'test-theme',
    requires_php: '7.0',
    requires_wp: '5.0',
    textdomain: 'test-theme',
    version: '1.0.0',
    screenshot: 'https://example.com/wp-content/themes/test-theme/screenshot.png',
    theme_uri: 'https://wordpress.org/themes/test-theme/',
    author: { user_nicename: 'Test Author', profile: 'https://profiles.wordpress.org/testauthor/', avatar: '' },
    author_uri: 'https://example.com',
    name: { rendered: 'Test Theme' },
    description: { rendered: 'A test theme' },
    tags: { rendered: ['one-column', 'responsive-layout'] },
    status: 'inactive',
    ...overrides
  };
}
