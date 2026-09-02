FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build


FROM node:22-alpine AS runner

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev && npm cache clean --force

# Copia la aplicación compilada
COPY --from=builder --chown=node:node /app/dist ./dist

# Copia el logo y demás recursos
COPY --from=builder --chown=node:node /app/assets ./assets

USER node

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
