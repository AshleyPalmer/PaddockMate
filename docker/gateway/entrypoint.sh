#!/bin/bash
set -e

CERT_DIR="/etc/nginx/certs"
CERT_FILE="${CERT_DIR}/dev.paddockmate.app.crt"
KEY_FILE="${CERT_DIR}/dev.paddockmate.app.key"

mkdir -p "${CERT_DIR}"

if [ ! -f "${CERT_FILE}" ] || [ ! -f "${KEY_FILE}" ]; then
    echo "==> No SSL certificate found. Automatically generating development SSL certificate for dev.paddockmate.app..."

    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "${KEY_FILE}" \
        -out "${CERT_FILE}" \
        -subj "/C=GB/ST=England/L=London/O=PaddockMate/CN=dev.paddockmate.app" \
        -addext "subjectAltName=DNS:dev.paddockmate.app,DNS:localhost,IP:127.0.0.1" \
        >/dev/null 2>&1

    echo "==> SSL certificate successfully generated in ${CERT_DIR}."
fi

exec nginx -g "daemon off;"
