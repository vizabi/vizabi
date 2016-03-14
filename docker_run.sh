#!/bin/bash

### Run commands
### docker build --no-cache --tag=vizabi .
### docker rm -f $(docker ps -a -q --filter='name=vizabi')

imgId=$(docker ps -a -q --filter='name=vizabi')
echo "vizabi container: $imgId"

if [ "$imgId" != "" ]
  then
    docker rm -f $imgId
fi

docker build --tag vizabi:latest .

### detect OS

# cygwin  :: POSIX compatibility layer and Linux environment emulation for Windows
# msys    :: Lightweight shell and GNU utilities compiled for Windows (part of MinGW)

if [ "$OSTYPE" = "cygwin" ] || [ "$OSTYPE" = "msys" ] || [ "$OSTYPE" = "win32" ]; then

  ### ToDo :: Check code in Windows Env

  cd $PWD
  PATHCURR=$PWD

  cd $HOMEDRIVE$HOMEPATH
  PATHUSER=$PWD

  if [[ "$PATHCURR" =~ "$PATHUSER" ]]; then

    #echo "Inside User Dorectory :: $PATHCURR"
    docker run --name vizabi -v /$PATHCURR://home/vizabi $(docker images -a -q vizabi)
    #echo "WINDOWS :: Docker done"

  else

    #echo "Outside User Dorectory :: $PATHCURR"
    echo "\\033[0;31mWarning!!! Project located outside $HOMEPATH directory. Additional folder '$HOMEPATH/vizabi_shared' will be crated for build.\\033[0m\n"

    PATHVIZABI=$PATHUSER/vizabi_shared

    cd $PATHCURR && rm -rf ./build && mkdir build
    mkdir -p $PATHVIZABI && cp -rf `ls -A | grep -v '.git'` $PATHVIZABI

    docker run --name vizabi -v /$PATHVIZABI://home/vizabi $(docker images -a -q vizabi)

    cd $PATHCURR && cp -rf $PATHVIZABI/build .
    #echo "WINDOWS :: Docker done"

  fi

# Default flow

else

  docker run --name vizabi -v $(pwd):/home/vizabi $(docker images -a -q vizabi)
  #echo "LINUX :: Docker done"

fi
