FROM python:3.11-slim

WORKDIR /app

# Copy project files into the image. A .dockerignore file will keep the build lean.
COPY . .

RUN chmod +x docker/start.sh

ENV PORT=8080

EXPOSE 8080

ENTRYPOINT ["./docker/start.sh"]
