from datetime import datetime

class Block:
    def __init__(self, uid, block_hash, timestamp, data, previous_hash):
        self.uid = uid
        self.block_hash = block_hash
        self.timestamp = timestamp
        self.data = data
        self.previous_hash = previous_hash


blocks = []

# Create blocks
for i in range(3):
    print(f"\n--- Block {i + 1} ---")

    uid = input("Enter UID: ")
    data = input("Enter Data: ")

    timestamp = datetime.now()


    block_hash = f"HASH_{i + 1}"

    if i == 0:
        previous_hash = "GENESIS"
    else:
        previous_hash = blocks[-1].block_hash

    block = Block(uid, block_hash, timestamp, data, previous_hash)
    blocks.append(block)


# Print all blocks
print("\n===== Blockchain =====")

for block in blocks:
    print(f"UID           : {block.uid}")
    print(f"Timestamp     : {block.timestamp}")
    print(f"Data          : {block.data}")
    print(f"Hash          : {block.block_hash}")
    print(f"Previous Hash : {block.previous_hash}")
    print("-" * 40)
