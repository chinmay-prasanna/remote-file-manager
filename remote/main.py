from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
import os

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-type'

@app.route('/list/', methods=['POST'])
def list_directory():
    data = request.json
    if not data or "dir" not in data:
        return jsonify({"error": "Missing 'dir' in request body"}), 400

    dir_path = data["dir"]
    if not os.path.exists(dir_path) or not os.path.isdir(dir_path):
        return jsonify({"error": f"Invalid directory: {dir_path}"}), 400

    items = []
    for i, entry in enumerate(os.listdir(dir_path)):
        entry_path = os.path.join(dir_path, entry)
        items.append({
            "id": i,
            "name": entry,
            "type": "directory" if os.path.isdir(entry_path) else "file",
            "path": os.path.abspath(entry_path)
        })

    return jsonify(items)

if __name__ == "__main__":
    app.run()