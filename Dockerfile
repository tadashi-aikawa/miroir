FROM node:14

RUN apt update && apt -y upgrade

WORKDIR /usr/src/app

COPY package-lock.json /usr/src/app/
COPY package.json /usr/src/app/
RUN npm install

COPY . /usr/src/app

