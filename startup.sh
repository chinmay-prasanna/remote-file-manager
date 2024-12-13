#!/bin/bash

source venv/bin/activate

nohup python client-server.py &

cd client

nohup npm start &