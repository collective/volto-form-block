# syntax=docker/dockerfile:1
ARG PLONE_VERSION=6.0.11
FROM plone/server-builder:${PLONE_VERSION} AS builder

WORKDIR /app


# Add local code
COPY scripts/ scripts/
COPY . src

# Install local requirements and pre-compile mo files
RUN <<EOT
    set -e
    bin/pip install mxdev uv hatch
    cd /app/src
    ../bin/hatch build
    ../bin/mxdev -c mx.ini
    ../bin/uv pip install dist/*.whl -c constraints-mxdev.txt
    ../bin/python /compile_mo.py
    cd /app
    rm -Rf /app/src
EOT

FROM plone/server-prod-config:${PLONE_VERSION}

LABEL maintainer="Plone Foundation <collective@plone.org>" \
      org.label-schema.name="volto-form-block-backend" \
      org.label-schema.description="Volto Form Block: Backend" \
      org.label-schema.vendor="Plone Foundation"

# Copy /app from builder
COPY --from=builder /app /app

RUN <<EOT
    set -e
    ln -s /data /app/var
EOT
