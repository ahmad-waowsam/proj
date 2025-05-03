FROM python:3.11-bookworm

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

ARG REQUIREMENTS_FILE

# Install system dependencies
RUN apt-get update && apt-get install -y \
    cron \
    && rm -rf /var/lib/apt/lists/*

# Copy application code
COPY . /app
WORKDIR /app

RUN pip install --upgrade pip
# Install Python dependencies
RUN pip install --no-cache-dir -r ${REQUIREMENTS_FILE}

# Create initialization script
RUN echo '#!/bin/bash\npython -m src.db.init_db\npython -m uvicorn src.main:app --host 0.0.0.0 --port 8001 --root-path /langgraph-race-api --reload' > /app/start.sh
RUN chmod +x /app/start.sh

# Command to run the application
CMD ["/app/start.sh"]
