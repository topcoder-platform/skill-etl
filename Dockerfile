FROM node:14

RUN apt-get update -y && apt-get install -y default-jdk

WORKDIR /app
COPY package.json .
COPY package-lock.json .
RUN npm install

COPY ./config ./config
COPY ./data ./data
COPY ./scripts ./scripts
COPY ./src ./src
COPY ./index.js ./index.js

ENTRYPOINT ["node"]
