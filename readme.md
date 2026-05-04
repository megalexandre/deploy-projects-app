docker build -t alexandreqrz/opj:latest .
docker push alexandreqrz/opj:latest
docker run -p 8080:80 \
  -e VITE_API_PROXY_TARGET=https://www.projetosopjengenharia.com.br/api/v2 \
  alexandreqrz/opj:latest

docker run --rm -p 8080:80 alexandreqrz/opj:latest


docker run -p 8080:80 \
  -e VITE_API_PROXY_TARGET=https://www.projetosopjengenharia.com.br/api/v2 \
  alexandreqrz/opj:latest