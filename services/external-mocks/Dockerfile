FROM node:20-alpine
RUN apk add --no-cache wget
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY src ./src
ENV PORT=8090
EXPOSE 8090
CMD ["npm", "start"]
