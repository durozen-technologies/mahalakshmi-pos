# syntax=docker/dockerfile:1.7

ARG CADDY_VERSION=2

FROM caddy:${CADDY_VERSION}-builder AS builder

RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    xcaddy build \
    --with github.com/caddy-dns/duckdns \
    --with github.com/mholt/caddy-ratelimit

FROM caddy:${CADDY_VERSION}-alpine AS runtime

ENV CADDY_UPSTREAM="backend:8000"

COPY --from=builder /usr/bin/caddy /usr/bin/caddy
COPY Caddyfile.template /etc/caddy/Caddyfile.template
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod 0755 /usr/local/bin/docker-entrypoint.sh

EXPOSE 80 443 443/udp
STOPSIGNAL SIGTERM

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
    CMD caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile && pidof caddy >/dev/null

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
