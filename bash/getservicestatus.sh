#!/bin/bash
name=$(basename $1);
active=$(systemctl is-active $name);
description=$(systemctl show $name -p Description 2> /dev/null | grep -o =.* | grep -o [^=].*);
printf '{"name":"%b","active":"%b","description":"%b"}' "$name" "$active" "$description";
