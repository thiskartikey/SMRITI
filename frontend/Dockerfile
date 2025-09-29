FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expo build
RUN npm run build

EXPOSE 3000

CMD ["npx", "expo", "start", "--web"]