import hashlib
import json
from datetime import datetime


class Block:

    def __init__(self, index, data, previous_hash):
        self.index = index
        self.timestamp = str(datetime.now())
        self.data = data
        self.previous_hash = previous_hash
        self.block_hash = self.calculate_hash()

    def calculate_hash(self):

        block_data = {
            "index": self.index,
            "timestamp": self.timestamp,
            "data": self.data,
            "previous_hash": self.previous_hash
        }

        block_string = json.dumps(block_data, sort_keys=True)

        return hashlib.sha256(block_string.encode()).hexdigest()