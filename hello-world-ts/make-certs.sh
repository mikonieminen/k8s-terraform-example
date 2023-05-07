#!/bin/bash

mkdir -p certs

openssl \
  req \
  -new \
  -noenc \
  -x509 \
  -subj "/C=CH/ST=Schwyz/L=Altendorf/O=ACME Signing Authority Inc/CN=example.com" \
  -keyout certs/server.key \
  -out certs/server.cert
