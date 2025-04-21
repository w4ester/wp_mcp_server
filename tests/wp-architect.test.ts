/**
 * WP Architect Tool Tests
 */
import { analyzeSiteRequirements } from '../src/tools/wp-architect/index.js';
import { SiteRequirements } from '../src/tools/wp-architect/types.js';

// Mock the logger to avoid console output during tests
jest.mock('../src/utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

describe('WP Architect Tool', () => {
  describe('analyzeSiteRequirements', () => {
    it('should analyze e-commerce site requirements correctly', async () => {
      // Arrange
      const siteRequirements: SiteRequirements = {
        siteName: 'Test E-commerce Site',
        purpose: 'e-commerce',
        features: ['blog', 'shop', 'gallery'],
        contentTypes: ['products', 'reviews'],
        targetAudience: 'small business owners'
      };
      
      // Act
      const result = await analyzeSiteRequirements(siteRequirements);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.siteStructure).toBeDefined();
      expect(result.recommendedThemes).toBeDefined();
      expect(result.recommendedPlugins).toBeDefined();
      expect(result.contentTypeDefinitions).toBeDefined();
      expect(result.implementationPlan).toBeDefined();
      
      // E-commerce specific assertions
      expect(result.siteStructure.pages).toContain('Shop');
      expect(result.siteStructure.pages).toContain('Cart');
      expect(result.siteStructure.pages).toContain('Checkout');
      
      // Check for WooCommerce recommendation
      const hasWooCommerce = result.recommendedPlugins.some(
        plugin => plugin.name === 'WooCommerce'
      );
      expect(hasWooCommerce).toBe(true);
      
      // Check for product content type
      const hasProductType = result.contentTypeDefinitions.some(
        type => type.name === 'product'
      );
      expect(hasProductType).toBe(true);
    });
    
    it('should analyze blog site requirements correctly', async () => {
      // Arrange
      const siteRequirements: SiteRequirements = {
        siteName: 'Test Blog Site',
        purpose: 'blog',
        features: ['comments', 'categories', 'tags'],
        contentTypes: [],
        targetAudience: 'readers'
      };
      
      // Act
      const result = await analyzeSiteRequirements(siteRequirements);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.siteStructure).toBeDefined();
      expect(result.siteStructure.pages).toContain('Blog');
      
      // Check for blog-focused theme
      const hasBlogTheme = result.recommendedThemes.some(
        theme => theme.pros.some(pro => pro.toLowerCase().includes('blog'))
      );
      expect(hasBlogTheme).toBe(true);
      
      // Should have post content type
      const hasPostType = result.contentTypeDefinitions.some(
        type => type.name === 'post'
      );
      expect(hasPostType).toBe(true);
    });
    
    it('should handle missing optional fields', async () => {
      // Arrange
      const siteRequirements: SiteRequirements = {
        siteName: 'Minimal Site',
        purpose: 'information'
      };
      
      // Act
      const result = await analyzeSiteRequirements(siteRequirements);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.siteStructure).toBeDefined();
      expect(result.recommendedThemes).toBeDefined();
      expect(result.recommendedPlugins).toBeDefined();
      expect(result.contentTypeDefinitions).toBeDefined();
      expect(result.implementationPlan).toBeDefined();
    });
  });
});
