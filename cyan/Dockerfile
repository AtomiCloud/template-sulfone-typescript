FROM oven/bun:1.0.11
LABEL cyanprint.dev=true
WORKDIR /app
COPY package.json package.json
COPY bun.lockb bun.lockb
RUN bun install
COPY . .
CMD bun run index.ts
