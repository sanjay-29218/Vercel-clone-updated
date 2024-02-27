FROM node:20-alpine as base

RUN apk update \
    && apk add --no-cache git

WORKDIR /home/app

RUN npm install -g typescript

# Corrected paths in COPY commands
COPY ./src ./src
COPY tsconfig.json .
COPY package*.json .


RUN npm install 

RUN npm install --save-dev @types/node
# Corrected paths in chmod commands
RUN chmod +x src/main.sh
RUN chmod +x src/script.ts



# Corrected path in ENTRYPOINT directive
ENTRYPOINT ["/home/app/src/main.sh"]
