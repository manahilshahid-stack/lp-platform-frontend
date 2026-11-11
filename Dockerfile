# Build with Bun, run the Nitro node-server output with Node.
FROM oven/bun:1.3 AS build
WORKDIR /app

COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile

COPY . .

# VITE_ vars are inlined into the client bundle at build time.
# Railway passes service variables to declared build args.
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN bun run build

FROM node:22-slim
WORKDIR /app
COPY --from=build /app/.output ./.output

# Railway injects PORT; Nitro's node-server reads PORT and HOST.
ENV HOST=0.0.0.0 PORT=3000 NODE_ENV=production
CMD ["node", ".output/server/index.mjs"]
