#!/bin/bash

rm -f *.deb

fpm --input-type dir \
    --output-type deb \
    --maintainer "Fictionlab <support@fictionlab.pl>" \
    --name "leo-ui" \
    --vendor "Kell ideas Ltd." \
    --license "MIT" \
    --url "https://github.com/LeoRover/leo_ui" \
    --version "$(git describe --tags)" \
    --architecture all \
    --deb-no-default-config-files \
    --exclude .git \
    --exclude make_deb.sh \
    --verbose \
    --prefix "/opt/leo_ui" \
    --description "Leo Rover Web User Interface" \
    .
