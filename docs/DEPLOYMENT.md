# Deployment Guide

## Prerequisites

### System Requirements
- Python 3.9+
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Docker 20+
- Docker Compose 2+

### Environment Setup

1. **Python Environment**
   ```bash
   # Create virtual environment
   python -m venv venv
   
   # Activate virtual environment
   # Windows
   .\venv\Scripts\activate
   # Linux/Mac
   source venv/bin/activate
   
   # Install dependencies
   pip install -r requirements.txt
   ```

2. **Node.js Environment**
   ```bash
   # Install dependencies
   cd churn-prediction-frontend
   npm install
   ```

3. **Database Setup**
   ```bash
   # Create database
   createdb churn_prediction
   
   # Run migrations
   python manage.py migrate
   ```

4. **Environment Variables**
   ```bash
   # Backend (.env)
   DEBUG=False
   SECRET_KEY=your-secret-key
   DATABASE_URL=postgres://user:password@localhost:5432/churn_prediction
   REDIS_URL=redis://localhost:6379/0
   DISCORD_WEBHOOK_URL=your-webhook-url
   ALLOWED_HOSTS=localhost,127.0.0.1
   CORS_ALLOWED_ORIGINS=http://localhost:3000
   
   # Frontend (.env.local)
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

## Docker Deployment

### Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  db:
    image: postgres:14-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=churn_prediction
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    ports:
      - "5432:5432"

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./churn_project
    command: gunicorn churn_project.wsgi:application --bind 0.0.0.0:8000
    volumes:
      - static_volume:/app/staticfiles
      - media_volume:/app/mediafiles
    expose:
      - 8000
    environment:
      - DEBUG=False
      - DATABASE_URL=postgres://postgres:postgres@db:5432/churn_prediction
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis

  celery:
    build: ./churn_project
    command: celery -A churn_project worker -l INFO
    volumes:
      - .:/app
    environment:
      - DEBUG=False
      - DATABASE_URL=postgres://postgres:postgres@db:5432/churn_prediction
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - backend
      - redis

  frontend:
    build: ./churn-prediction-frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    volumes:
      - static_volume:/app/staticfiles
      - media_volume:/app/mediafiles
      - ./nginx:/etc/nginx/conf.d
    ports:
      - "80:80"
    depends_on:
      - backend
      - frontend

volumes:
  postgres_data:
  static_volume:
  media_volume:
```

### Nginx Configuration

```nginx
# nginx/default.conf
upstream backend {
    server backend:8000;
}

upstream frontend {
    server frontend:3000;
}

server {
    listen 80;
    server_name localhost;

    location /api/ {
        proxy_pass http://backend;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
        proxy_redirect off;
    }

    location /admin/ {
        proxy_pass http://backend;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
        proxy_redirect off;
    }

    location /staticfiles/ {
        alias /app/staticfiles/;
    }

    location /mediafiles/ {
        alias /app/mediafiles/;
    }

    location / {
        proxy_pass http://frontend;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
        proxy_redirect off;
    }
}
```

## Deployment Steps

1. **Build and Start Services**
   ```bash
   # Build images
   docker-compose build
   
   # Start services
   docker-compose up -d
   ```

2. **Database Migration**
   ```bash
   # Run migrations
   docker-compose exec backend python manage.py migrate
   
   # Create superuser
   docker-compose exec backend python manage.py createsuperuser
   ```

3. **Collect Static Files**
   ```bash
   docker-compose exec backend python manage.py collectstatic --no-input
   ```

4. **Verify Deployment**
   ```bash
   # Check service status
   docker-compose ps
   
   # View logs
   docker-compose logs -f
   ```

## Production Considerations

### Security

1. **SSL/TLS Setup**
   ```nginx
   # nginx/ssl.conf
   server {
       listen 443 ssl;
       server_name your-domain.com;
   
       ssl_certificate /etc/nginx/ssl/cert.pem;
       ssl_certificate_key /etc/nginx/ssl/key.pem;
       
       # SSL configuration
       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_ciphers HIGH:!aNULL:!MD5;
       ssl_prefer_server_ciphers on;
       ssl_session_cache shared:SSL:10m;
       ssl_session_timeout 10m;
   }
   ```

2. **Firewall Configuration**
   ```bash
   # Allow only necessary ports
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```

### Monitoring

1. **Prometheus Configuration**
   ```yaml
   # prometheus.yml
   global:
     scrape_interval: 15s
   
   scrape_configs:
     - job_name: 'django'
       static_configs:
         - targets: ['backend:8000']
   
     - job_name: 'redis'
       static_configs:
         - targets: ['redis:6379']
   ```

2. **Grafana Dashboard**
   ```json
   {
     "dashboard": {
       "id": null,
       "title": "Churn Prediction Monitoring",
       "panels": [
         {
           "title": "API Request Rate",
           "type": "graph",
           "datasource": "Prometheus",
           "targets": [
             {
               "expr": "rate(http_requests_total[5m])"
             }
           ]
         }
       ]
     }
   }
   ```

### Backup

1. **Database Backup**
   ```bash
   # Backup script
   #!/bin/bash
   TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
   BACKUP_DIR="/backups"
   
   # Backup database
   docker-compose exec -T db pg_dump -U postgres churn_prediction > \
       "$BACKUP_DIR/db_backup_$TIMESTAMP.sql"
   
   # Compress backup
   gzip "$BACKUP_DIR/db_backup_$TIMESTAMP.sql"
   
   # Remove old backups (keep last 7 days)
   find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +7 -delete
   ```

2. **Model Artifacts Backup**
   ```bash
   # Backup script
   #!/bin/bash
   TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
   BACKUP_DIR="/backups/models"
   
   # Backup model artifacts
   tar -czf "$BACKUP_DIR/models_backup_$TIMESTAMP.tar.gz" \
       -C /app/models .
   
   # Remove old backups (keep last 5 versions)
   ls -t "$BACKUP_DIR"/models_backup_*.tar.gz | tail -n +6 | xargs -r rm
   ```

## Scaling

### Horizontal Scaling

1. **Docker Swarm Setup**
   ```bash
   # Initialize swarm
   docker swarm init
   
   # Deploy stack
   docker stack deploy -c docker-compose.yml churn_prediction
   
   # Scale services
   docker service scale churn_prediction_backend=3
   docker service scale churn_prediction_celery=2
   ```

2. **Load Balancer Configuration**
   ```nginx
   # nginx/load-balancer.conf
   upstream backend {
       least_conn;
       server backend1:8000;
       server backend2:8000;
       server backend3:8000;
   }
   ```

### Vertical Scaling

1. **Resource Limits**
   ```yaml
   # docker-compose.yml
   services:
     backend:
       deploy:
         resources:
           limits:
             cpus: '2'
             memory: 4G
           reservations:
             cpus: '1'
             memory: 2G
   ```

## Troubleshooting

### Common Issues

1. **Database Connection**
   ```bash
   # Check database connection
   docker-compose exec backend python manage.py dbshell
   
   # Check database logs
   docker-compose logs db
   ```

2. **Redis Connection**
   ```bash
   # Check Redis connection
   docker-compose exec redis redis-cli ping
   
   # Monitor Redis
   docker-compose exec redis redis-cli monitor
   ```

3. **Celery Tasks**
   ```bash
   # Check Celery status
   docker-compose exec celery celery -A churn_project status
   
   # Monitor tasks
   docker-compose exec celery celery -A churn_project events
   ```

### Health Checks

1. **Backend Health**
   ```bash
   # Check API status
   curl -I http://localhost/api/health/
   
   # Check celery status
   docker-compose exec backend python manage.py celery_status
   ```

2. **Frontend Health**
   ```bash
   # Check frontend status
   curl -I http://localhost/
   
   # Check build logs
   docker-compose logs frontend
   ``` 