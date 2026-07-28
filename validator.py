def validate(blocks):

    is_valid = True

    for i in range(1, len(blocks)):

        current = blocks[i]
        previous = blocks[i - 1]

        if current.block_hash != current.calculate_hash():
            print(f"❌ Block {current.index} has been modified.")
            is_valid = False
            break

        if current.previous_hash != previous.block_hash:
            print(
                f"❌ Chain is broken between Block {previous.index} and Block {current.index}"
            )
            is_valid = False
            break

    if is_valid:
        print("✅ Blockchain Verified Successfully")