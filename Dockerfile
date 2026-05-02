FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY server.js ./
COPY public/ ./public/
EXPOSE 7860
ENV PORT=7860
CMD ["npm", "start"]
