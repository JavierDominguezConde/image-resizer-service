FROM node:24

WORKDIR /usr/src/app

COPY --chown=node:node package.json ./package.json
COPY --chown=node:node package-lock.json ./package-lock.json

RUN npm ci --omit=dev

COPY --chown=node:node app ./app

# Create output directory structure
RUN mkdir -p /output/tmp && chown -R node:node /output

USER node
