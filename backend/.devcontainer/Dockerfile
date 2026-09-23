# Dockerfile

# Get the base image
FROM python:3.11-bookworm

# Keeps Python from generating .pyc files in the container
ENV PYTHONDONTWRITEBYTECODE=1

# Turns off buffering for easier container logging
ENV PYTHONUNBUFFERED=1

# Non-root user
ARG USERNAME=vscode
ARG USER_UID=1000
ARG USER_GID=1000

# Global npm folder writable by the user, so Claude Code can auto-update
ARG NPM_GLOBAL=/usr/local/share/npm-global
ENV NPM_CONFIG_PREFIX=${NPM_GLOBAL}
ENV PATH=${NPM_GLOBAL}/bin:${PATH}

# Configure the non-root user
RUN groupadd --gid ${USER_GID} ${USERNAME} \
    && useradd --uid ${USER_UID} --gid ${USER_GID} -m -s /bin/bash ${USERNAME} \
    && apt-get update \
    && apt-get install -y --no-install-recommends sudo \
    && echo "${USERNAME} ALL=(root) NOPASSWD:ALL" > /etc/sudoers.d/${USERNAME} \
    && chmod 0440 /etc/sudoers.d/${USERNAME} \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r npm \
    && usermod -aG npm ${USERNAME} \
    && mkdir -p ${NPM_GLOBAL} \
    && chown ${USERNAME}:npm ${NPM_GLOBAL} \
    && chmod g+s ${NPM_GLOBAL}