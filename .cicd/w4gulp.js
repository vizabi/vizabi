#!/usr/bin/env node

'use strict';

const shell = require('shelljs');

let ok = false;
while (!ok){
    let lines = shell.exec('netstat -nlp | grep 9000 | wc -l').stdout;
    if(lines != 0){
	ok = true;
    }
    else{
	shell.exec('sleep 1');
    };
}
