/**
 * WordPress Tools Index
 * 
 * Central export for all WordPress tool implementations.
 */

import { JsonRpcHandler } from '../../json-rpc/handler.js';
import { WordPressSiteManager } from '../site-manager.js';
import { registerPostsTools } from './posts.js';
import { registerPagesTools } from './pages.js';
import { registerMediaTools } from './media.js';
import { registerUsersTools } from './users.js';
import { registerCategoriesTools } from './categories.js';
import { registerTagsTools } from './tags.js';
import { registerPluginsTools } from './plugins.js';
import { registerThemesTools } from './themes.js';

/**
 * Register all WordPress tools with the JSON-RPC handler
 * @param handler JSON-RPC handler
 * @param siteManager WordPress site manager
 */
export function registerAllWordPressTools(
  handler: JsonRpcHandler,
  siteManager: WordPressSiteManager
): void {
  registerPostsTools(handler, siteManager);
  registerPagesTools(handler, siteManager);
  registerMediaTools(handler, siteManager);
  registerUsersTools(handler, siteManager);
  registerCategoriesTools(handler, siteManager);
  registerTagsTools(handler, siteManager);
  registerPluginsTools(handler, siteManager);
  registerThemesTools(handler, siteManager);
}

// Re-export individual tool registration functions
export {
  registerPostsTools,
  registerPagesTools,
  registerMediaTools,
  registerUsersTools,
  registerCategoriesTools,
  registerTagsTools,
  registerPluginsTools,
  registerThemesTools
};
