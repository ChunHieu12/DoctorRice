# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Verify model file exists
RUN ls -lh model/ && \
    if [ ! -f "model/model.tflite" ]; then \
        echo "ERROR: model/model.tflite not found!"; \
        exit 1; \
    else \
        echo "✅ Model file found: $(du -h model/model.tflite)"; \
    fi

# Expose port (will be overridden by Render's PORT env var)
EXPOSE 5000

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=5000

# Health check (removed - Render has its own health check)
# HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
#     CMD python -c "import requests; requests.get('http://localhost:5000/health')"

# Run with gunicorn for production
# Use shell form to allow $PORT variable expansion
CMD gunicorn --bind 0.0.0.0:$PORT --workers 1 --threads 2 --timeout 300 --log-level info app:app

