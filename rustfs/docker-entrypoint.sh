#!/bin/sh
set -eu

: "${RUSTFS_DATA_UID:=10001}"
: "${RUSTFS_DATA_GID:=10001}"

mkdir -p /data
chown -R "${RUSTFS_DATA_UID}:${RUSTFS_DATA_GID}" /data

if [ "$#" -eq 0 ] || [ "$1" = "/data" ]; then
  exec /entrypoint.sh rustfs "$@"
fi

exec "$@"
