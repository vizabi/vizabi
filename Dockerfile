FROM ubuntu:14.04

WORKDIR /home/vizabi

RUN apt-get update

RUN apt-get install -y linux-libc-dev libkrb5-dev curl python-virtualenv ruby=1:1.9.3.4 ruby-dev=1:1.9.3.4 ruby-bundler=1.3.5-2ubuntu1
RUN gem install sass -v 3.4.21 && gem install scss_lint -v 0.47.1

RUN curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
RUN apt-get install -y nodejs

RUN npm install -g npm@3.8.1
RUN npm install -g gulp@3.9.1

### --force --no-bin-links :: needs for Windows
CMD npm install --force && gulp build
