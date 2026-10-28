FROM node:24.14.0-alpine3.23@sha256:7fddd9ddeae8196abf4a3ef2de34e11f7b1a722119f91f28ddf1e99dcafdf114 AS builder

WORKDIR /workspace/web

COPY web/package.json web/package-lock.json ./
RUN npm ci

COPY web/ ./
COPY data/ /workspace/data/

RUN npm run build \
  && test -f out/index.html \
  && test -f out/books/session-027/index.html \
  && test -f out/data/search-index.json

FROM nginx:stable-alpine@sha256:47928bf67eb62a1863cb08d9ecb52d3e704304ba614eaee17884204677702951 AS runtime

COPY web/nginx.conf /etc/nginx/nginx.conf
COPY --chown=nginx:nginx --from=builder /workspace/web/out/ /usr/share/nginx/html/

USER nginx
EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1

ENTRYPOINT ["nginx", "-g", "daemon off;"]
