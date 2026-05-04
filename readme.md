docker build -t alexandreqrz/opj:latest .
docker push alexandreqrz/opj:latest


docker run --rm -p 8080:80 alexandreqrz/deploy-board-app:latest



docker run -p 8080:80 \
  -e VITE_API_PROXY_TARGET=https://api.seu-dominio.com \
  -e VITE_API_BASE_URL=https://api.seu-dominio.com/custom-path \
  opj-engenharia