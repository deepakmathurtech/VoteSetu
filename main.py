import hashlib
import json
from datetime import datetime


class Block:

    def __init__(self, index, data, previous_hash):
        self.index = index
        self.timestamp = str(datetime.now())
        self.data = data
        self.previous_hash = previous_hash

        # The block calculates its own hash
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


blocks = []

for i in range(3):

    print(f"\n------ Block {i} ------")

    data = input("Enter Data : ")

    if i == 0:
        previous_hash = "GENESIS"
    else:
        previous_hash = blocks[-1].block_hash

    block = Block(i, data, previous_hash)

    blocks.append(block)


print("\n=========== BLOCKCHAIN ===========\n")

for block in blocks:

    print(f"Index          : {block.index}")
    print(f"Timestamp      : {block.timestamp}")
    print(f"Data           : {block.data}")
    print(f"Previous Hash  : {block.previous_hash}")
    print(f"Current Hash   : {block.block_hash}")

    print("-" * 60)