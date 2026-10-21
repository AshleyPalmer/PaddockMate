FROM nginx:alpine

RUN apk add --no-cache openssl bash

COPY docker/gateway/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/gateway/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

EXPOSE 80 443

ENTRYPOINT ["/entrypoint.sh"]
