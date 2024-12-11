import { Assert, Blockchain, OP_20, opnet, OPNetUnit } from '@btc-vision/unit-test-framework';
import { Vesting } from '../contracts/Vesting';
import { Address } from '@btc-vision/transaction';
import { rnd } from '../contracts/configs';

const TEST_RUN_COUNT = 100;
const BLOCKS_PER_DAY = 144;
const CURRENT_HIGHEST_BLOCK_NUMBER = 874246;

const deployer: Address = rnd();

await opnet('Fuzz Testing', async (vm: OPNetUnit) => {
  Blockchain.msgSender = deployer;
  Blockchain.txOrigin = deployer; // "leftmost thing in the call chain"

  let token: OP_20;
  let vesting: Vesting;
  const tokenAddress: Address = rnd();
  const vestingAddress: Address = rnd();

  vm.beforeEach(async () => {
    // Reset blockchain state
    Blockchain.dispose();
    Blockchain.clearContracts();

    await Blockchain.init();

    // Instantiate and register the OP_20 token
    token = new OP_20({
      file: './lib/bytecode/OP20.wasm',
      address: tokenAddress,
      decimals: 18,
      deployer,
    });
    Blockchain.register(token);
    await token.init();

    // Mint tokens to the user
    const mintAmount: number = 100_000_000;
    await token.mint(deployer, mintAmount);

    // Instantiate and register the EWMA contract
    vesting = new Vesting({
      address: vestingAddress,
      deployer,
    });
    Blockchain.register(vesting);
    await vesting.init();

    // Set msgSender to the user
    Blockchain.msgSender = deployer;
  });

  vm.afterEach(() => {
    // Clear blockchain state between tests
    vesting.dispose();
    token.dispose();
    Blockchain.dispose();
  });

  for (let n = 0; n < TEST_RUN_COUNT; n++) {
    await vm.it(
      `Unlocks correct amount of tokens per block, random values, fuzz test run ${n + 1}`,
      async () => {
        const beneficiary = rnd();
        const vestingAmount = Blockchain.expandTo18Decimals(
          Math.floor(Math.random() * 100_000) + 1,
        );
        const startBlock = BigInt(Math.floor(Math.random() * CURRENT_HIGHEST_BLOCK_NUMBER) + 1);
        const deadlineBlock =
          startBlock + BigInt(Math.floor(Math.random() * BLOCKS_PER_DAY * 10) + 1);
        const rewardsPerBlock = vestingAmount / (deadlineBlock - startBlock);
        Blockchain.blockNumber = startBlock;

        await token.approve(deployer, vestingAddress, vestingAmount);
        await vesting.initialise(beneficiary, tokenAddress, vestingAmount, deadlineBlock);

        Blockchain.msgSender = beneficiary;
        let block = startBlock;
        while (block < deadlineBlock) {
          Blockchain.blockNumber = block;

          const claimedAmount = await vesting.unlockedAmount();
          const expectedAmount = rewardsPerBlock * (block - startBlock);
          Assert.expect(claimedAmount).toEqual(expectedAmount);
          // Advance by a random amount of blocks, up to one day
          block += BigInt(Math.floor(Math.random() * BLOCKS_PER_DAY) + 1);
        }

        // Assert that all the leftover rewards resulting from rounding errors
        // get distributed at the end of the vesting period
        Blockchain.blockNumber = deadlineBlock;
        const claimedAmount = await vesting.unlockedAmount();
        Assert.expect(claimedAmount).toEqual(vestingAmount);
      },
    );
  }

  for (let n = 0; n < TEST_RUN_COUNT; n++) {
    await vm.it(
      `Claims correct amount of tokens per block, random values, fuzz test run ${n + 1}`,
      async () => {
        const beneficiary = rnd();
        const vestingAmount = Blockchain.expandTo18Decimals(
          Math.floor(Math.random() * 100_000) + 1,
        );
        const startBlock = BigInt(Math.floor(Math.random() * CURRENT_HIGHEST_BLOCK_NUMBER) + 1);
        const deadlineBlock =
          startBlock + BigInt(Math.floor(Math.random() * BLOCKS_PER_DAY * 10) + 1);
        const rewardsPerBlock = vestingAmount / (deadlineBlock - startBlock);
        Blockchain.blockNumber = startBlock;

        await token.approve(deployer, vestingAddress, vestingAmount);
        await vesting.initialise(beneficiary, tokenAddress, vestingAmount, deadlineBlock);

        Blockchain.msgSender = beneficiary;
        let block = startBlock + 1n;
        while (block < deadlineBlock) {
          Blockchain.blockNumber = block;

          if ((await vesting.unlockedAmount()) > 0n) {
            await vesting.claim();
          }
          const claimedAmount = await token.balanceOf(beneficiary);
          const expectedAmount = rewardsPerBlock * (block - startBlock);
          Assert.expect(claimedAmount).toEqual(expectedAmount);
          // Advance by a random amount of blocks, up to one day
          block += BigInt(Math.floor(Math.random() * BLOCKS_PER_DAY) + 1);
        }

        // Assert that all the leftover rewards resulting from rounding errors
        // get distributed at the end of the vesting period
        Blockchain.blockNumber = deadlineBlock;
        await vesting.claim();
        const claimedAmount = await token.balanceOf(beneficiary);
        Assert.expect(claimedAmount).toEqual(vestingAmount);
      },
    );
  }
});
