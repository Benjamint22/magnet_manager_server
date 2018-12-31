#!/bin/bash

printf "[";
first=1;
while read x; do
    if [ $first -eq 0 ]; then
        printf ',';
    else
        first=0;
    fi
    source ${BASH_SOURCE%/*}/getservicestatus.sh $x
done << EOF
    $(ls /lib/systemd/system/*.service /etc/systemd/system/*.service)
EOF
printf "]\n";
