## Configuration File for WordPress MCP Server
# WordPress Secrets Management: Added secretsSource option (file, env, or aws)
# Maintained backward compatibility with file-based storage Enhanced API Key Security: Changed default source to "env" for more secure credential handling
# Added rotationPeriodDays to encourage periodic key rotation
# Improved Rate Limiting:
# Added IP-based rate limiting alongside API key limits

# This helps prevent abuse from authenticated users
# HTTPS Configuration:

# Added settings to require HTTPS in production
# Development exemption for local testing

# Password Policy:
# Added password complexity requirements
# These will apply to WordPress application passwords

# Audit Logging:
# Enabled audit logging by default
# Separate path for security events