#!/bin/bash

source venv/bin/activate

nohup flask run --prot 8000 &

cd client

nohup npm start &