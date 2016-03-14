FROM ubuntu:14.04

WORKDIR /home/vizabi

RUN apt-get update

RUN apt-get install -y linux-libc-dev=3.13.0-79.123 libkrb5-dev=1.12+dfsg-2ubuntu5.2 curl=7.35.0-1ubuntu2.6 python-virtualenv=1.11.4-1ubuntu1 ruby=1:1.9.3.4 ruby-dev=1:1.9.3.4 ruby-bundler=1.3.5-2ubuntu1
RUN gem install sass -v 3.4.21 && gem install scss_lint -v 0.47.1

RUN curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
RUN apt-get install -y nodejs

RUN npm install -g gulp@3.9.1 npm@3.8.0

### --force --no-bin-links :: needs for Windows
CMD npm install --force --no-bin-links && gulp build
