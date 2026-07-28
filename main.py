from block import Block
from blockchain import blocks
from validator import validate


for i in range(3):

    print(f"\n--------- Block {i} ---------")

    data = input("Enter Data : ")

    if i == 0:
        previous_hash = "GENESIS"
    else:
        previous_hash = blocks[-1].block_hash

    block = Block(i, data, previous_hash)

    blocks.append(block)


# Attack Example
# blocks[1].data = "Hacker changed vote"
# blocks[1].block_hash = blocks[1].calculate_hash()


print("\nChecking Blockchain...\n")

validate(blocks)


print("\n=========== BLOCKCHAIN ===========\n")

for block in blocks:

    print(f"Index          : {block.index}")
    print(f"Timestamp      : {block.timestamp}")
    print(f"Data           : {block.data}")
    print(f"Previous Hash  : {block.previous_hash}")
    print(f"Current Hash   : {block.block_hash}")
    print("-" * 60)