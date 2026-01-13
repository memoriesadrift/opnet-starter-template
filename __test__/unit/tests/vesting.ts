import { Assert, Blockchain, OP20, opnet, OPNetUnit } from '@btc-vision/unit-test-framework';
import { Vesting } from '../contracts/Vesting';
import { Address } from '@btc-vision/transaction';

const deployer: Address = Blockchain.generateRandomAddress();

await opnet('Vesting', async (vm: OPNetUnit) => {
  Blockchain.msgSender = deployer;
  Blockchain.txOrigin = deployer; // "leftmost thing in the call chain"

  let token: OP20;
  let vesting: Vesting;
  const tokenAddress: Address = Blockchain.generateRandomAddress();
  const vestingAddress: Address = Blockchain.generateRandomAddress();

  vm.beforeEach(async () => {
    // Reset blockchain state
    Blockchain.dispose();
    Blockchain.clearContracts();

    await Blockchain.init();

    // Instantiate and register the OP_20 token
    token = new OP20({
      file: './lib/bytecode/OP20.wasm',
      address: tokenAddress,
      decimals: 18,
      deployer,
    });
    Blockchain.register(token);
    await token.init();

    // Mint tokens to the user
    const mintAmount: number = 10000000;
    await token.mint(deployer, mintAmount);

    // Instantiate and register the Vesting contract
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

  await vm.it('Initialises vesting contract successfully', async () => {
    const beneficiary = Blockchain.generateRandomAddress();
    const vestingAmount = 10000n;
    const deadlineBlock = 100n;
    Blockchain.blockNumber = 1n;

    await token.increaseAllowance(deployer, vestingAddress, vestingAmount);
    await vesting.initialise(beneficiary, tokenAddress, vestingAmount, deadlineBlock);

    const vestingInfo = await vesting.vestingInfo();
    Assert.expect(vestingInfo.beneficiary).toEqualAddress(beneficiary);
    Assert.expect(vestingInfo.token).toEqualAddress(tokenAddress);
    Assert.expect(vestingInfo.startBlock).toEqual(1n);
    Assert.expect(vestingInfo.deadlineBlock).toEqual(deadlineBlock);
    Assert.expect(vestingInfo.totalAmount).toEqual(vestingAmount);
    Assert.expect(vestingInfo.remainingAmount).toEqual(vestingAmount);
  });

  await vm.it("Doesn't allow non-beneficiary to claim rewards", async () => {
    const beneficiary = Blockchain.generateRandomAddress();
    const vestingAmount = 10000n;
    const deadlineBlock = 100n;
    Blockchain.blockNumber = 1n;

    await token.increaseAllowance(deployer, vestingAddress, vestingAmount);
    await vesting.initialise(beneficiary, tokenAddress, vestingAmount, deadlineBlock);
    Blockchain.blockNumber = 100n;
    Blockchain.msgSender = Blockchain.generateRandomAddress();
    await Assert.expect(async () => {
      await vesting.claim();
    }).toThrow();
  });

  await vm.it("Doesn't allow owner to cancel partially claimed vesting", async () => {
    const beneficiary = Blockchain.generateRandomAddress();
    const vestingAmount = 10000n;
    const deadlineBlock = 100n;
    Blockchain.blockNumber = 1n;

    await token.increaseAllowance(deployer, vestingAddress, vestingAmount);
    await vesting.initialise(beneficiary, tokenAddress, vestingAmount, deadlineBlock);
    Blockchain.blockNumber = 10n;
    Blockchain.msgSender = beneficiary;
    await vesting.claim();
    Blockchain.blockNumber = 1000n;
    Blockchain.msgSender = deployer;
    await Assert.expect(async () => {
      await vesting.cancel();
    }).toThrow();
  });

  await vm.it('Allows owner to cancel unclaimed vesting', async () => {
    const beneficiary = Blockchain.generateRandomAddress();
    const vestingAmount = 10000n;
    const deadlineBlock = 100n;
    const preBalance = await token.balanceOf(deployer);
    Blockchain.blockNumber = 1n;

    await token.increaseAllowance(deployer, vestingAddress, vestingAmount);
    await vesting.initialise(beneficiary, tokenAddress, vestingAmount, deadlineBlock);

    Blockchain.blockNumber = 1000n;
    await vesting.cancel();
    const postBalance = await token.balanceOf(deployer);
    Assert.expect(postBalance).toEqual(preBalance);
  });

  await vm.it('Calculates payout correctly after time elapses', async () => {
    const beneficiary = Blockchain.generateRandomAddress();
    const vestingAmount = 10000n;
    const deadlineBlock = 100n;
    Blockchain.blockNumber = 1n;

    await token.increaseAllowance(deployer, vestingAddress, vestingAmount);
    await vesting.initialise(beneficiary, tokenAddress, vestingAmount, deadlineBlock);

    Blockchain.msgSender = beneficiary;
    Blockchain.blockNumber = 100n;
    const claimedAmount = await vesting.claim();
    Assert.expect(claimedAmount).toEqual(vestingAmount);
    Assert.expect(await token.balanceOf(beneficiary)).toEqual(vestingAmount);
  });

  await vm.it('Unlocks correct amount of tokens per block, simple case', async () => {
    const beneficiary = Blockchain.generateRandomAddress();
    const vestingAmount = 10000n;
    const deadlineBlock = 101n;
    const startBlock = 1n;
    const rewardsPerBlock = vestingAmount / (deadlineBlock - startBlock);
    Blockchain.blockNumber = startBlock;

    await token.increaseAllowance(deployer, vestingAddress, vestingAmount);
    await vesting.initialise(beneficiary, tokenAddress, vestingAmount, deadlineBlock);

    Blockchain.msgSender = beneficiary;
    for (let block = 2n; block <= deadlineBlock; block++) {
      Blockchain.blockNumber = block;

      const claimedAmount = await vesting.unlockedAmount();
      const expectedAmount = rewardsPerBlock * (block - 1n);
      Assert.expect(claimedAmount).toEqual(expectedAmount);
    }
  });

  await vm.it(
    'Unlocks correct amount of tokens per block, advanced case - random values',
    async () => {
      const BLOCKS_PER_DAY = 144;
      const beneficiary = Blockchain.generateRandomAddress();
      const vestingAmount = Blockchain.expandTo18Decimals(Math.floor(Math.random() * 100000) + 1);
      const deadlineBlock = 1n + BigInt(Math.floor(Math.random() * BLOCKS_PER_DAY * 10) + 1);
      const startBlock = 1n;
      const rewardsPerBlock = vestingAmount / (deadlineBlock - startBlock);
      Blockchain.blockNumber = startBlock;

      await token.increaseAllowance(deployer, vestingAddress, vestingAmount);
      await vesting.initialise(beneficiary, tokenAddress, vestingAmount, deadlineBlock);

      Blockchain.msgSender = beneficiary;
      for (let block = 2n; block < deadlineBlock; block++) {
        Blockchain.blockNumber = block;

        const claimedAmount = await vesting.unlockedAmount();
        const expectedAmount = rewardsPerBlock * (block - 1n);
        Assert.expect(claimedAmount).toEqual(expectedAmount);
      }

      // Assert that all the leftover rewards resulting from rounding errors
      // get distributed at the end of the vesting period
      Blockchain.blockNumber = deadlineBlock;
      const claimedAmount = await vesting.unlockedAmount();
      Assert.expect(claimedAmount).toEqual(vestingAmount);
    },
  );
});
