FROM node:18 as builder

WORKDIR /usr/local/app

COPY ./package.json ./
COPY ./tsconfig.json ./
COPY ./yarn.lock  ./

COPY ./src ./

RUN yarn install
RUN yarn build

FROM node:18

WORKDIR /usr/local/app

ENV NODE_ENV="production"

COPY --from=builder /usr/local/app/package.json ./
COPY --from=builder /usr/local/app/yarn.lock  ./
COPY --from=builder /usr/local/app/dist ./dist/

RUN yarn install

EXPOSE 3000
CMD [ "node", "dist/index.js"]
