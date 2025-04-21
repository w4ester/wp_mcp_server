# Deployment Guide

## Overview

This guide covers various deployment options for the WordPress MCP Server, from simple single-instance setups to complex, scalable cloud deployments.

## Deployment Options

1. **Local Development**: For testing and development
2. **Docker**: Containerized deployment
3. **AWS**: Using CloudFormation, ECS, or EC2
4. **Kubernetes**: For large-scale deployments
5. **Serverless**: AWS Lambda or similar platforms

## Local Development

### Quick Start

```bash
# Clone repository
git clone https://github.com/your-org/wordpress-mcp-server.git
cd wordpress-mcp-server

# Install dependencies
npm install

# Set up configuration
cp config/default.json config/development.json
cp config/wp-sites.example.json config/wp-sites.json
cp config/wp-secrets.example.json config/wp-secrets.json

# Start development server
npm run dev
```

### Development Tools

- Use `nodemon` for auto-reload
- Enable debug logging
- Use local WordPress instances
- Mock API responses for testing

## Docker Deployment

### Building the Image

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Create non-root user
RUN adduser -D mcpuser
USER mcpuser

# Start server
CMD ["npm", "start"]

EXPOSE 3000
```

### Using Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  wordpress-mcp:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
    volumes:
      - ./config:/app/config:ro
    restart: unless-stopped

  # Optional: Local WordPress for testing
  wordpress:
    image: wordpress:latest
    ports:
      - "8080:80"
    environment:
      WORDPRESS_DB_HOST: db
      WORDPRESS_DB_USER: wordpress
      WORDPRESS_DB_PASSWORD: wordpress
      WORDPRESS_DB_NAME: wordpress
    volumes:
      - wordpress_data:/var/www/html

  db:
    image: mysql:5.7
    environment:
      MYSQL_DATABASE: wordpress
      MYSQL_USER: wordpress
      MYSQL_PASSWORD: wordpress
      MYSQL_ROOT_PASSWORD: somewordpress
    volumes:
      - db_data:/var/lib/mysql

volumes:
  wordpress_data:
  db_data:
```

### Running with Docker

```bash
# Build image
docker build -t wordpress-mcp-server .

# Run container
docker run -d \
  --name wordpress-mcp \
  -p 3000:3000 \
  -v $(pwd)/config:/app/config:ro \
  -e NODE_ENV=production \
  wordpress-mcp-server
```

## AWS Deployment

### Using AWS CloudFormation

```yaml
# cloudformation.yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: WordPress MCP Server deployment

Parameters:
  Environment:
    Type: String
    Default: production
    AllowedValues: [production, staging]
  
  InstanceType:
    Type: String
    Default: t3.small
    
  KeyName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: EC2 Key Pair for SSH access

Resources:
  # VPC Configuration
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-vpc

  # Application Load Balancer
  LoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Subnets: !Ref PublicSubnets
      SecurityGroups: [!Ref ALBSecurityGroup]

  # ECS Cluster
  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: !Sub ${AWS::StackName}-cluster

  # Task Definition
  TaskDefinition:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: wordpress-mcp
      NetworkMode: awsvpc
      RequiresCompatibilities: [FARGATE]
      Cpu: 256
      Memory: 512
      ContainerDefinitions:
        - Name: wordpress-mcp
          Image: !Sub ${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/wordpress-mcp:latest
          PortMappings:
            - ContainerPort: 3000
          Environment:
            - Name: NODE_ENV
              Value: !Ref Environment
          LogConfiguration:
            LogDriver: awslogs
            Options:
              awslogs-group: !Ref LogGroup
              awslogs-region: !Ref AWS::Region
              awslogs-stream-prefix: mcp

  # ECS Service
  Service:
    Type: AWS::ECS::Service
    Properties:
      Cluster: !Ref ECSCluster
      TaskDefinition: !Ref TaskDefinition
      DesiredCount: 2
      LaunchType: FARGATE
      NetworkConfiguration:
        AwsvpcConfiguration:
          AssignPublicIp: ENABLED
          Subnets: !Ref PrivateSubnets
          SecurityGroups: [!Ref ServiceSecurityGroup]
      LoadBalancers:
        - ContainerName: wordpress-mcp
          ContainerPort: 3000
          TargetGroupArn: !Ref TargetGroup

Outputs:
  LoadBalancerDNS:
    Description: Load balancer DNS name
    Value: !GetAtt LoadBalancer.DNSName
```

### EC2 Deployment Script

```bash
#!/bin/bash
# deploy-ec2.sh

# Update system
sudo yum update -y

# Install Node.js
curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install Git
sudo yum install -y git

# Clone repository
git clone https://github.com/your-org/wordpress-mcp-server.git
cd wordpress-mcp-server

# Install dependencies
npm ci --only=production

# Build application
npm run build

# Set up systemd service
cat > /etc/systemd/system/wordpress-mcp.service << EOF
[Unit]
Description=WordPress MCP Server
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/wordpress-mcp-server
ExecStart=/usr/bin/npm start
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

# Start service
sudo systemctl enable wordpress-mcp
sudo systemctl start wordpress-mcp
```

## Kubernetes Deployment

### Kubernetes Resources

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: wordpress-mcp
  labels:
    app: wordpress-mcp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: wordpress-mcp
  template:
    metadata:
      labels:
        app: wordpress-mcp
    spec:
      containers:
      - name: wordpress-mcp
        image: your-registry/wordpress-mcp:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: production
        - name: API_KEY_SOURCE
          value: kubernetes
        resources:
          requests:
            cpu: "250m"
            memory: "512Mi"
          limits:
            cpu: "500m"
            memory: "1Gi"
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 15
          periodSeconds: 20
        volumeMounts:
        - name: config
          mountPath: /app/config
          readOnly: true
        - name: secrets
          mountPath: /app/secrets
          readOnly: true
      volumes:
      - name: config
        configMap:
          name: wordpress-mcp-config
      - name: secrets
        secret:
          secretName: wordpress-mcp-secrets
---
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: wordpress-mcp
spec:
  selector:
    app: wordpress-mcp
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
---
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: wordpress-mcp
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - mcp.example.com
    secretName: wordpress-mcp-tls
  rules:
  - host: mcp.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: wordpress-mcp
            port:
              number: 80
```

### Helm Chart

```yaml
# Chart.yaml
apiVersion: v2
name: wordpress-mcp
description: WordPress MCP Server Helm chart
version: 1.0.0
appVersion: "1.0.0"

# values.yaml
replicaCount: 3

image:
  repository: your-registry/wordpress-mcp
  tag: latest
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  annotations:
    kubernetes.io/ingress.class: nginx
  hosts:
    - host: mcp.example.com
      paths: ["/"]
  tls:
    - secretName: wordpress-mcp-tls
      hosts:
        - mcp.example.com

resources:
  requests:
    cpu: 250m
    memory: 512Mi
  limits:
    cpu: 500m
    memory: 1Gi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80
```

## Serverless Deployment

### AWS Lambda Function

```typescript
// lambda.ts
import { APIGatewayProxyHandler } from 'aws-lambda';
import serverless from 'serverless-http';
import { createApp } from './app';

let serverlessApp: any;

export const handler: APIGatewayProxyHandler = async (event, context) => {
  if (!serverlessApp) {
    const app = await createApp();
    serverlessApp = serverless(app);
  }
  
  return serverlessApp(event, context);
};
```

### Serverless Framework Configuration

```yaml
# serverless.yml
service: wordpress-mcp

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    NODE_ENV: production

functions:
  api:
    handler: dist/lambda.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
    timeout: 30
    memorySize: 1024

plugins:
  - serverless-offline
  - serverless-plugin-typescript

custom:
  serverless-offline:
    httpPort: 3000
```

## Monitoring & Logging

### CloudWatch Setup

```typescript
// cloudwatch.ts
import { CloudWatchClient, PutMetricDataCommand } from "@aws-sdk/client-cloudwatch";

const cloudwatch = new CloudWatchClient({ region: process.env.AWS_REGION });

export async function recordMetric(name: string, value: number) {
  await cloudwatch.send(new PutMetricDataCommand({
    Namespace: 'WordPressMCP',
    MetricData: [{
      MetricName: name,
      Value: value,
      Unit: 'Count',
      Timestamp: new Date()
    }]
  }));
}
```

### Prometheus Metrics

```typescript
// metrics.ts
import { collectDefaultMetrics, register } from 'prom-client';

collectDefaultMetrics();

// Custom metrics
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

## Security Best Practices

1. **Network Security**:
   - Use VPC for isolation
   - Configure security groups properly
   - Use private subnets for services

2. **TLS/SSL**:
   - Always use HTTPS
   - Implement certificate rotation
   - Use strong cipher suites

3. **Authentication**:
   - Rotate API keys regularly
   - Use IAM roles for AWS services
   - Implement IP whitelisting if possible

4. **Secrets Management**:
   - Use AWS Secrets Manager or Vault
   - Never store secrets in code
   - Implement secret rotation

5. **Monitoring**:
   - Set up alerts for errors
   - Monitor resource usage
   - Track security events

## Scaling Considerations

1. **Horizontal Scaling**:
   - Use auto-scaling groups
   - Load balance across instances
   - Consider regional distribution

2. **Database Connections**:
   - Use connection pooling
   - Implement caching layer
   - Consider read replicas

3. **API Rate Limiting**:
   - Implement per-client limits
   - Use Redis for distributed limiting
   - Queue high-volume requests

## Troubleshooting Deployment

### Common Issues

1. **Container Fails to Start**:
   - Check environment variables
   - Verify configuration files
   - Check container logs

2. **Connection Issues**:
   - Verify security group rules
   - Check network ACLs
   - Test connectivity between services

3. **Performance Problems**:
   - Monitor resource usage
   - Check for memory leaks
   - Analyze slow queries

### Health Checks

```typescript
// health.ts
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version
  });
});

app.get('/health/detailed', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    wordpress: await checkWordPress(),
    memory: process.memoryUsage(),
    uptime: process.uptime()
  };
  
  res.json({
    status: Object.values(checks).every(c => c.status === 'ok') ? 'ok' : 'degraded',
    checks,
    timestamp: new Date().toISOString()
  });
});
```

## Backup & Recovery

1. **Configuration Backup**:
   - Version control all configs
   - Backup secrets separately
   - Test restore procedures

2. **State Backup**:
   - Export Prometheus metrics
   - Backup session data
   - Store audit logs

3. **Disaster Recovery**:
   - Multi-region deployment
   - Regular restore testing
   - Documented procedures

## Conclusion

Choose the deployment method that best fits your needs:
- **Development**: Local or Docker
- **Small Scale**: Single EC2 or Docker
- **Medium Scale**: ECS or small Kubernetes
- **Large Scale**: Kubernetes with auto-scaling
- **Serverless**: Lambda for variable workloads

Always consider security, scalability, and monitoring in your deployment strategy.
