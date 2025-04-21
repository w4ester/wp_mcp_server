/**
 * WP Architect Types
 * 
 * Type definitions for the WP Architect tool
 */

/**
 * Site requirements for analysis
 */
export interface SiteRequirements {
  /**
   * Name of the website
   */
  siteName: string;
  
  /**
   * Main purpose of the website
   */
  purpose: string;
  
  /**
   * List of required features
   */
  features?: string[];
  
  /**
   * List of content types needed
   */
  contentTypes?: string[];
  
  /**
   * Target audience description
   */
  targetAudience?: string;
}

/**
 * Planned site structure
 */
export interface SiteStructure {
  /**
   * List of pages to create
   */
  pages: string[];
  
  /**
   * Navigation menu structure
   */
  navigationStructure: {
    /**
     * Menu name
     */
    name: string;
    
    /**
     * Menu items
     */
    items: string[];
  }[];
  
  /**
   * Content hierarchy and organization
   */
  contentHierarchy: {
    /**
     * Main content sections
     */
    mainSections: string[];
    
    /**
     * Subsections organized by parent section
     */
    subsections: Record<string, string[]>;
  };
}

/**
 * Theme recommendation
 */
export interface ThemeRecommendation {
  /**
   * Theme name
   */
  name: string;
  
  /**
   * URL to the theme
   */
  url: string;
  
  /**
   * Theme description
   */
  description: string;
  
  /**
   * List of advantages
   */
  pros: string[];
  
  /**
   * List of disadvantages
   */
  cons: string[];
  
  /**
   * Rating (0-5)
   */
  rating: number;
}

/**
 * Plugin recommendation
 */
export interface PluginRecommendation {
  /**
   * Plugin name
   */
  name: string;
  
  /**
   * URL to the plugin
   */
  url: string;
  
  /**
   * Plugin description
   */
  description: string;
  
  /**
   * Purpose or category of the plugin
   */
  purpose: string;
  
  /**
   * Whether the plugin is essential for the site
   */
  essential: boolean;
}

/**
 * Field definition for content types
 */
export interface Field {
  /**
   * Field name
   */
  name: string;
  
  /**
   * Field type
   */
  type: 'text' | 'textarea' | 'wysiwyg' | 'number' | 'date' | 'gallery' | 'image' | 'file' | 'select';
  
  /**
   * Whether the field is required
   */
  required: boolean;
  
  /**
   * Field description
   */
  description: string;
}

/**
 * Content type definition
 */
export interface ContentTypeDefinition {
  /**
   * Content type name (slug)
   */
  name: string;
  
  /**
   * Display label
   */
  label: string;
  
  /**
   * Content type description
   */
  description: string;
  
  /**
   * Fields for the content type
   */
  fields: Field[];
  
  /**
   * Taxonomies for the content type
   */
  taxonomies: string[];
}

/**
 * Implementation plan task
 */
export interface PlanTask {
  /**
   * Task name
   */
  name: string;
  
  /**
   * Task description
   */
  description: string;
}

/**
 * Implementation plan phase
 */
export interface PlanPhase {
  /**
   * Phase name
   */
  name: string;
  
  /**
   * Phase description
   */
  description: string;
  
  /**
   * Tasks in this phase
   */
  tasks: PlanTask[];
}

/**
 * Implementation plan
 */
export interface ImplementationPlan {
  /**
   * Implementation phases
   */
  phases: PlanPhase[];
  
  /**
   * Timeline estimates
   */
  timeline: Record<string, string>;
  
  /**
   * Cost estimates
   */
  estimatedCost: Record<string, string>;
}
