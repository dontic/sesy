# Dockerfile

FROM node:22-bullseye AS build

ARG NPM_GLOBAL=/usr/local/share/npm-global
ENV NPM_CONFIG_PREFIX=${NPM_GLOBAL}
ENV PATH=${NPM_GLOBAL}/bin:${PATH}

RUN apt-get update \
    && apt-get install -y --no-install-recommends sudo \
    && rm -rf /var/lib/apt/lists/* \
    && echo 'node ALL=(root) NOPASSWD:ALL' > /etc/sudoers.d/node \
    && chmod 0440 /etc/sudoers.d/node \
    && groupadd -r npm \
    && usermod -aG npm node \
    && mkdir -p ${NPM_GLOBAL} \
    && chown node:npm ${NPM_GLOBAL} \
    && chmod g+s ${NPM_GLOBAL}