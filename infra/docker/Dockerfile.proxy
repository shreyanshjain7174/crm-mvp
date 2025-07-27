FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install http-proxy-middleware express
COPY proxy-server.js ./
EXPOSE 8080
CMD ["node", "proxy-server.js"]