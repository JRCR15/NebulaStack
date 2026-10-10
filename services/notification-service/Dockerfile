FROM node:20-alpine
RUN apk add --no-cache wget
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY src ./src
ENV PORT=8085
EXPOSE 8085
CMD ["npm", "start"]
