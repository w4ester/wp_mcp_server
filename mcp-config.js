/**
 * WordPress MCP Server Configuration
 * 
 * MCP Server with specialized tools for WordPress site development
 */

const { wpArchitect } = require('./tools/wp-architect');
const { wpResearcher } = require('./tools/wp-researcher');
const { themeDeveloper } = require('./tools/theme-developer');
const { pluginDeveloper } = require('./tools/plugin-developer');
const { contentManager } = require('./tools/content-manager');
const { databaseManager } = require('./tools/database-manager');
const { frontendDeveloper } = require('./tools/frontend-developer');
const { seoOptimizer } = require('./tools/seo-optimizer');
const { securityExpert } = require('./tools/security-expert');
const { performanceOptimizer } = require('./tools/performance-optimizer');
const { backupManager } = require('./tools/backup-manager');
const { logger } = require('./utils/logger');

/**
 * MCP Server configuration
 */
module.exports = {
  /**
   * Server name
   */
  name: 'WordPress MCP Server',
  
  /**
   * Server description
   */
  description: 'MCP Server for WordPress Site Building and Management',
  
  /**
   * MCP Tools configuration
   */
  tools: [
    /**
     * WP Architect - Analyzes site requirements and plans structure
     */
    {
      name: 'wp-architect',
      description: 'Analyzes site requirements, plans site structure, defines content types, and outlines implementation strategy',
      parameters: {
        type: 'object',
        properties: {
          siteRequirements: {
            type: 'object',
            description: 'Site requirements',
            properties: {
              siteName: {
                type: 'string',
                description: 'Name of the website'
              },
              purpose: {
                type: 'string',
                description: 'Main purpose of the website (e.g., blog, e-commerce, portfolio)'
              },
              features: {
                type: 'array',
                description: 'List of required features',
                items: {
                  type: 'string'
                }
              },
              contentTypes: {
                type: 'array',
                description: 'List of content types needed',
                items: {
                  type: 'string'
                }
              },
              targetAudience: {
                type: 'string',
                description: 'Target audience description'
              }
            },
            required: ['siteName', 'purpose']
          }
        },
        required: ['siteRequirements']
      },
      handler: async ({ siteRequirements }) => {
        logger.info(`WP Architect analyzing site requirements for: ${siteRequirements.siteName}`);
        
        // Process site requirements
        const result = await wpArchitect.analyzeSiteRequirements(siteRequirements);
        
        return {
          siteStructure: result.siteStructure,
          recommendedThemes: result.recommendedThemes,
          recommendedPlugins: result.recommendedPlugins,
          contentTypeDefinitions: result.contentTypeDefinitions,
          implementationPlan: result.implementationPlan
        };
      }
    },
    
    /**
     * WP Researcher - Researches WordPress themes, plugins, and best practices
     */
    {
      name: 'wp-researcher',
      description: 'Researches WordPress themes, plugins, best practices, and market trends',
      parameters: {
        type: 'object',
        properties: {
          researchTopic: {
            type: 'string',
            description: 'Topic to research (e.g., "e-commerce plugins", "responsive themes")'
          },
          researchType: {
            type: 'string',
            enum: ['theme', 'plugin', 'best-practices', 'performance', 'security', 'seo', 'market-trends'],
            description: 'Type of research to conduct'
          },
          maxResults: {
            type: 'number',
            description: 'Maximum number of results to return'
          }
        },
        required: ['researchTopic', 'researchType']
      },
      handler: async ({ researchTopic, researchType, maxResults = 5 }) => {
        logger.info(`WP Researcher conducting research on: ${researchTopic} (${researchType})`);
        
        // Conduct research
        const results = await wpResearcher.conductResearch(researchTopic, researchType, maxResults);
        
        return {
          topic: researchTopic,
          type: researchType,
          results: results.items,
          analysis: results.analysis,
          recommendations: results.recommendations
        };
      }
    },
    
    /**
     * Theme Developer - Develops and customizes WordPress themes
     */
    {
      name: 'theme-developer',
      description: 'Develops and customizes WordPress themes, including child themes and custom templates',
      parameters: {
        type: 'object',
        properties: {
          task: {
            type: 'string',
            enum: ['create-child-theme', 'customize-theme', 'modify-template', 'create-template', 'enqueue-styles', 'enqueue-scripts'],
            description: 'Theme development task to perform'
          },
          themeDetails: {
            type: 'object',
            description: 'Theme details',
            properties: {
              parentTheme: {
                type: 'string',
                description: 'Parent theme name (for child themes)'
              },
              themeName: {
                type: 'string',
                description: 'Name of the theme to create or modify'
              },
              templateName: {
                type: 'string',
                description: 'Name of the template to create or modify'
              },
              customizations: {
                type: 'array',
                description: 'List of customizations to make',
                items: {
                  type: 'object'
                }
              }
            }
          }
        },
        required: ['task', 'themeDetails']
      },
      handler: async ({ task, themeDetails }) => {
        logger.info(`Theme Developer executing task: ${task} for theme: ${themeDetails.themeName || themeDetails.parentTheme}`);
        
        // Execute theme development task
        const result = await themeDeveloper.executeTask(task, themeDetails);
        
        return {
          task,
          code: result.code,
          files: result.files,
          instructions: result.instructions
        };
      }
    },
    
    /**
     * Plugin Developer - Integrates and customizes WordPress plugins
     */
    {
      name: 'plugin-developer',
      description: 'Integrates, configures, and customizes WordPress plugins',
      parameters: {
        type: 'object',
        properties: {
          task: {
            type: 'string',
            enum: ['recommend-plugins', 'create-plugin', 'customize-plugin', 'plugin-integration', 'shortcode-development'],
            description: 'Plugin development task to perform'
          },
          pluginDetails: {
            type: 'object',
            description: 'Plugin details',
            properties: {
              pluginName: {
                type: 'string',
                description: 'Name of the plugin to create or modify'
              },
              functionality: {
                type: 'string',
                description: 'Functionality required from the plugin'
              },
              customizations: {
                type: 'array',
                description: 'List of customizations to make',
                items: {
                  type: 'object'
                }
              }
            }
          }
        },
        required: ['task']
      },
      handler: async ({ task, pluginDetails }) => {
        logger.info(`Plugin Developer executing task: ${task}`);
        
        // Execute plugin development task
        const result = await pluginDeveloper.executeTask(task, pluginDetails);
        
        return {
          task,
          recommendations: result.recommendations,
          code: result.code,
          files: result.files,
          instructions: result.instructions
        };
      }
    },
    
    /**
     * Content Manager - Manages WordPress content types and taxonomies
     */
    {
      name: 'content-manager',
      description: 'Creates and manages WordPress content types, taxonomies, and content relationships',
      parameters: {
        type: 'object',
        properties: {
          task: {
            type: 'string',
            enum: ['create-post-type', 'create-taxonomy', 'define-fields', 'content-relationships', 'import-content', 'content-templates'],
            description: 'Content management task to perform'
          },
          contentDetails: {
            type: 'object',
            description: 'Content details',
            properties: {
              postTypeName: {
                type: 'string',
                description: 'Name of the custom post type'
              },
              taxonomyName: {
                type: 'string',
                description: 'Name of the taxonomy'
              },
              fields: {
                type: 'array',
                description: 'List of custom fields',
                items: {
                  type: 'object'
                }
              },
              relationships: {
                type: 'array',
                description: 'Content relationships to define',
                items: {
                  type: 'object'
                }
              }
            }
          }
        },
        required: ['task']
      },
      handler: async ({ task, contentDetails }) => {
        logger.info(`Content Manager executing task: ${task}`);
        
        // Execute content management task
        const result = await contentManager.executeTask(task, contentDetails);
        
        return {
          task,
          code: result.code,
          instructions: result.instructions
        };
      }
    },
    
    /**
     * Database Manager - Manages WordPress database operations
     */
    {
      name: 'database-manager',
      description: 'Manages WordPress database schema, migrations, and optimizations',
      parameters: {
        type: 'object',
        properties: {
          task: {
            type: 'string',
            enum: ['create-table', 'modify-table', 'custom-query', 'data-migration', 'database-optimization'],
            description: 'Database management task to perform'
          },
          databaseDetails: {
            type: 'object',
            description: 'Database details',
            properties: {
              tableName: {
                type: 'string',
                description: 'Name of the database table'
              },
              fields: {
                type: 'array',
                description: 'Table fields',
                items: {
                  type: 'object'
                }
              },
              query: {
                type: 'string',
                description: 'Custom database query'
              }
            }
          }
        },
        required: ['task']
      },
      handler: async ({ task, databaseDetails }) => {
        logger.info(`Database Manager executing task: ${task}`);
        
        // Execute database management task
        const result = await databaseManager.executeTask(task, databaseDetails);
        
        return {
          task,
          code: result.code,
          instructions: result.instructions,
          warnings: result.warnings
        };
      }
    },
    
    /**
     * Frontend Developer - Develops frontend customizations
     */
    {
      name: 'frontend-developer',
      description: 'Handles CSS, JavaScript, and responsive design for WordPress sites',
      parameters: {
        type: 'object',
        properties: {
          task: {
            type: 'string',
            enum: ['css-customization', 'javascript-enhancement', 'responsive-design', 'layout-customization', 'animation'],
            description: 'Frontend development task to perform'
          },
          frontendDetails: {
            type: 'object',
            description: 'Frontend details',
            properties: {
              targetElement: {
                type: 'string',
                description: 'Target HTML element or selector'
              },
              customizationType: {
                type: 'string',
                description: 'Type of customization to make'
              },
              code: {
                type: 'string',
                description: 'Existing code to modify'
              }
            }
          }
        },
        required: ['task']
      },
      handler: async ({ task, frontendDetails }) => {
        logger.info(`Frontend Developer executing task: ${task}`);
        
        // Execute frontend development task
        const result = await frontendDeveloper.executeTask(task, frontendDetails);
        
        return {
          task,
          code: result.code,
          files: result.files,
          instructions: result.instructions
        };
      }
    },
    
    /**
     * SEO Optimizer - Implements SEO best practices
     */
    {
      name: 'seo-optimizer',
      description: 'Implements SEO best practices for WordPress sites',
      parameters: {
        type: 'object',
        properties: {
          task: {
            type: 'string',
            enum: ['seo-audit', 'schema-markup', 'sitemap-configuration', 'metadata-optimization', 'permalink-structure'],
            description: 'SEO optimization task to perform'
          },
          seoDetails: {
            type: 'object',
            description: 'SEO details',
            properties: {
              targetUrl: {
                type: 'string',
                description: 'Target URL to optimize'
              },
              keywords: {
                type: 'array',
                description: 'Target keywords',
                items: {
                  type: 'string'
                }
              },
              contentType: {
                type: 'string',
                description: 'Content type to optimize'
              }
            }
          }
        },
        required: ['task']
      },
      handler: async ({ task, seoDetails }) => {
        logger.info(`SEO Optimizer executing task: ${task}`);
        
        // Execute SEO optimization task
        const result = await seoOptimizer.executeTask(task, seoDetails);
        
        return {
          task,
          recommendations: result.recommendations,
          code: result.code,
          instructions: result.instructions
        };
      }
    },
    
    /**
     * Security Expert - Implements security measures
     */
    {
      name: 'security-expert',
      description: 'Implements security best practices and hardening for WordPress sites',
      parameters: {
        type: 'object',
        properties: {
          task: {
            type: 'string',
            enum: ['security-audit', 'file-permissions', 'user-roles', 'login-security', 'firewall-configuration', 'malware-scan'],
            description: 'Security task to perform'
          },
          securityDetails: {
            type: 'object',
            description: 'Security details',
            properties: {
              targetArea: {
                type: 'string',
                description: 'Target area to secure'
              },
              securityLevel: {
                type: 'string',
                enum: ['basic', 'intermediate', 'advanced'],
                description: 'Security level to implement'
              }
            }
          }
        },
        required: ['task']
      },
      handler: async ({ task, securityDetails }) => {
        logger.info(`Security Expert executing task: ${task}`);
        
        // Execute security task
        const result = await securityExpert.executeTask(task, securityDetails);
        
        return {
          task,
          recommendations: result.recommendations,
          code: result.code,
          instructions: result.instructions
        };
      }
    },
    
    /**
     * Performance Optimizer - Optimizes WordPress performance
     */
    {
      name: 'performance-optimizer',
      description: 'Optimizes WordPress site performance including caching, compression, and asset optimization',
      parameters: {
        type: 'object',
        properties: {
          task: {
            type: 'string',
            enum: ['performance-audit', 'caching-setup', 'image-optimization', 'code-optimization', 'database-optimization', 'server-configuration'],
            description: 'Performance optimization task to perform'
          },
          performanceDetails: {
            type: 'object',
            description: 'Performance details',
            properties: {
              targetArea: {
                type: 'string',
                description: 'Target area to optimize'
              },
              optimizationLevel: {
                type: 'string',
                enum: ['basic', 'intermediate', 'advanced'],
                description: 'Optimization level to implement'
              }
            }
          }
        },
        required: ['task']
      },
      handler: async ({ task, performanceDetails }) => {
        logger.info(`Performance Optimizer executing task: ${task}`);
        
        // Execute performance optimization task
        const result = await performanceOptimizer.executeTask(task, performanceDetails);
        
        return {
          task,
          recommendations: result.recommendations,
          code: result.code,
          instructions: result.instructions
        };
      }
    },
    
    /**
     * Backup Manager - Manages WordPress backups
     */
    {
      name: 'backup-manager',
      description: 'Manages WordPress backup strategies, schedules, and restoration',
      parameters: {
        type: 'object',
        properties: {
          task: {
            type: 'string',
            enum: ['backup-strategy', 'scheduled-backup', 'backup-verification', 'restoration-plan'],
            description: 'Backup management task to perform'
          },
          backupDetails: {
            type: 'object',
            description: 'Backup details',
            properties: {
              backupType: {
                type: 'string',
                enum: ['full', 'database', 'files'],
                description: 'Type of backup to manage'
              },
              schedule: {
                type: 'string',
                description: 'Backup schedule'
              },
              retention: {
                type: 'string',
                description: 'Backup retention policy'
              }
            }
          }
        },
        required: ['task']
      },
      handler: async ({ task, backupDetails }) => {
        logger.info(`Backup Manager executing task: ${task}`);
        
        // Execute backup management task
        const result = await backupManager.executeTask(task, backupDetails);
        
        return {
          task,
          plan: result.plan,
          code: result.code,
          instructions: result.instructions
        };
      }
    }
  ]
};
