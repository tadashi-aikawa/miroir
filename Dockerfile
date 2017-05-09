FROM centos:7

RUN yum install -y wget

RUN wget https://dl.yarnpkg.com/rpm/yarn.repo -O /etc/yum.repos.d/yarn.repo \
  && curl --silent --location https://rpm.nodesource.com/setup_6.x | bash - \
  && yum install -y yarn

RUN yarn global add @angular/cli

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY yarn.lock /usr/src/app/
COPY . /usr/src/app
RUN yarn install

CMD ["sh", "/mount-tmp/exec.sh"]
