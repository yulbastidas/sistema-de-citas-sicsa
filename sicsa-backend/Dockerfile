FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build


FROM node:22-alpine AS runner

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

# Copia la aplicación compilada
COPY --from=builder /app/dist ./dist

# Copia el logo y demás recursos
COPY --from=builder /app/assets ./assets

EXPOSE 3000

CMD ["npm", "run", "start:prod"]