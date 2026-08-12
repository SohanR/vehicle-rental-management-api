FROM node:20-alpine AS development

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json knexfile.ts knexfile.production.cjs ./
COPY src ./src
COPY database ./database

RUN mkdir -p /app/uploads/vehicles && chown -R node:node /app

USER node
EXPOSE 3000

CMD ["npm", "run", "dev"]

FROM development AS build

USER root

RUN npm run build

FROM node:20-alpine AS production

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY knexfile.production.cjs ./

RUN mkdir -p /app/uploads/vehicles && chown -R node:node /app

USER node
EXPOSE 3000

CMD ["npm", "start"]
