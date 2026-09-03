FROM mcr.microsoft.com/playwright:v1.62.1-noble
WORKDIR /work

COPY package.json package-lock.json ./
RUN npm ci

COPY playwright.config.ts product-flow.spec.ts ./
CMD ["npm", "test"]
