FROM centos:7

RUN yum install -y wget

RUN wget https://dl.yarnpkg.com/rpm/yarn.repo -O /etc/yum.repos.d/yarn.repo \
  && curl --silent --location https://rpm.nodesource.com/setup_6.x | bash - \
  && yum install -y yarn

RUN yarn global add @angular/cli

COPY yarn.lock /tmp/
COPY package.json /tmp/
RUN cd /tmp && yarn install
