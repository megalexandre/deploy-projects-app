FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Include source and env files so Vite can resolve VITE_* values at build time.
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime

# Remove default Nginx static content.
RUN rm -rf /usr/share/nginx/html/*

# Use a custom Nginx config with SPA fallback.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Generate env.js from container environment variables during startup.
COPY docker-entrypoint.d/40-runtime-env.sh /docker-entrypoint.d/40-runtime-env.sh
RUN chmod +x /docker-entrypoint.d/40-runtime-env.sh

# Copy the generated frontend assets.
COPY --from=build /app/dist/ /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

FROM nginx:1.27-alpine

COPY dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
