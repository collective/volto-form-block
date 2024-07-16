# syntax=docker/dockerfile:1
ARG VOLTO_VERSION
# TODO: Replace with
# FROM plone/frontend-builder:${VOLTO_VERSION}
# when the main image is ready
FROM ghcr.io/kitconcept/frontend-builder:${VOLTO_VERSION} AS builder

COPY --chown=node packages/volto-form-block /app/packages/volto-form-block
COPY --chown=node volto.config.js /app/
COPY --chown=node package.json /app/package.json.temp

RUN --mount=type=cache,id=pnpm,target=/app/.pnpm-store,uid=1000 <<EOT
    set -e
    python3 -c "import json; data = json.load(open('package.json.temp')); deps = data['dependencies']; data['dependencies'].update(deps); json.dump(data, open('package.json', 'w'), indent=2)"
    rm package.json.temp
    pnpm install && pnpm build:deps
    pnpm build
    pnpm install --prod
EOT

# TODO: Replace with
# FROM plone/frontend-prod-config:${VOLTO_VERSION}
# when the main image is ready
FROM ghcr.io/kitconcept/frontend-prod-config:${VOLTO_VERSION}

LABEL maintainer="Plone Collective <collective@plone.org>" \
      org.label-schema.name="ghcr.io/collective/volto-form-block-frontend" \
      org.label-schema.description="Volto Form Block" \
      org.label-schema.vendor="Plone Collective"

COPY --from=builder /app/ /app/
