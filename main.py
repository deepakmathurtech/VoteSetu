import hashlib
import json
from datetime import datetime


class Block:

    def __init__(self, index, data, previous_hash):
        self.index = index
        self.timestamp = str(datetime.now())
        self.data = data
        self.previous_hash = previous_hash

        # Calculate hash when block is created
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


# -----------------------------
# Blockchain (Temporary Storage)
# -----------------------------

blocks = []

for i in range(3):

    print(f"\n--------- Block {i} ---------")

    data = input("Enter Data : ")

    if i == 0:
        previous_hash = "GENESIS"
    else:
        previous_hash = blocks[-1].block_hash

    block = Block(i, data, previous_hash)

    blocks.append(block)


# -----------------------------
# Blockchain Validator
# -----------------------------

print("\nChecking Blockchain...\n")

is_valid = True

for i in range(1, len(blocks)):

    current = blocks[i]
    previous = blocks[i - 1]

    # Check if current block has been modified
    if current.block_hash != current.calculate_hash():
        print(f"❌ Block {current.index} has been modified.")
        is_valid = False
        break

    # Check if chain connection is broken
    if current.previous_hash != previous.block_hash:
        print(f"❌ Chain is broken between Block {previous.index} and Block {current.index}")
        is_valid = False
        break


if is_valid:
    print("✅ Blockchain Verified Successfully")


# -----------------------------
# Display Blockchain
# -----------------------------

print("\n=========== BLOCKCHAIN ===========\n")

for block in blocks:

    print(f"Index          : {block.index}")
    print(f"Timestamp      : {block.timestamp}")
    print(f"Data           : {block.data}")
    print(f"Previous Hash  : {block.previous_hash}")
    print(f"Current Hash   : {block.block_hash}")
    print("-" * 60)
