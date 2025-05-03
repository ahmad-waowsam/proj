FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    cron \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/ src/

# Copy cron job
COPY cronjob /etc/cron.d/data-pipeline
RUN chmod 0644 /etc/cron.d/data-pipeline

# Create log file
RUN touch /var/log/cron.log

# Start script: run pipeline immediately, then start cron
CMD ["bash", "-c", "python src/data_pipeline.py && cron && tail -f /var/log/cron.log"] 