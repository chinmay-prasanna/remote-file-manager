# Remote File Manager
This is a file manager with GUI to manage files on a remote server without the need of ssh commands and lengthy directory paths

## Requirements
The remote server must have ssh installed, right now only password authentication is supported (my public key wasn't working)

### Remote Server setup
Install ssh daemon 
```sudo apt install```
Run ssh daemon
```ssh```
Setup Password
```passwd```
Copy the code in remote-server.py to your remote server, then run the server on the remote
```gunicorn -w 1 -b 0.0.0.0:$PORT remote-server:app```

You will need the ip address of the remote server.

### Client Setup
Clone the repository, add an env file in client folder containing -
> endpoint=http://192.168.11.201:8000/list/
> localServerEndpoint=http://localhost:8000/transfer/

Add env file in repo root containing -
> SSH_HOST = <remote_ip>
> SSH_USER = <remote_user>
> SSH_PASS = <remote_password>

Grant permissions to the startup script
```chmod 777 startup.sh```

Run the startup script
```./startup.sh```