from flask import Flask, request, jsonify
import paramiko
import os
from dotenv import load_dotenv

load_dotenv(override=True)

app = Flask(__name__)

@app.route('/transfer', methods=['POST'])
def transfer_files():
    data = request.json
    file_path = data['filePath']
    target_dir = data['targetDir']
    ssh_host = os.environ['SSH_HOST']
    ssh_user = os.environ['SSH_USER']
    ssh_pass = os.environ['SSH_PASS']
    
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(ssh_host, username=ssh_user, password=ssh_pass, port=8022, allow_agent=False, look_for_keys=False)

        sftp = ssh.open_sftp()
        filename = os.path.basename(file_path)
        remote_path = os.path.join(target_dir, filename)
        sftp.put(file_path, remote_path)

        sftp.close()
        ssh.close()
        return jsonify({"status": "success"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
