# Use Python base image
FROM python:3.11-slim

# Install Node.js and npm for frontend build
RUN apt-get update && apt-get install -y nodejs npm && rm -rf /var/lib/apt/lists/*

# Set workdir for backend
WORKDIR /app

# Copy backend code
COPY backend/ /app/
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Build frontend
WORKDIR /app/frontend
COPY frontend/package.json ./
COPY frontend/package-lock.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Move back to backend workdir
WORKDIR /app

# Expose port
EXPOSE 8000

# Start FastAPI app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
