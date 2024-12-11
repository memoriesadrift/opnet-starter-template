import * as bitcoin from '@btc-vision/bitcoin';
import * as dotenv from 'dotenv';
import {
  getContract,
  IOP_20Contract,
  JSONRpcProvider,
  OP_20_ABI,
  TransactionParameters,
} from 'opnet';
import { Address, Wallet } from '@btc-vision/transaction';
import { IVestingContract, VestingContractABI } from './interfaces/VestingInterfaces';

dotenv.config({ path: '.env' });

const wif = process.env.WALLET_WIF;
const rpcUrl = 'https://regtest.opnet.org';
const network = bitcoin.networks.regtest;
const provider = new JSONRpcProvider(rpcUrl, network);

if (!wif) {
  throw new Error('WALLET_WIF env variable not set - please set it in .env');
}

const wallet = Wallet.fromWif(wif, network);
const address = wallet.address.p2tr(network);
const balance = await provider.getBalance(address);
if (balance < 1000n) {
  throw new Error(`Balance too low (${balance}) - please fund ${address} on opnet regtest faucet`);
}
console.log('Wallet balance:', balance);

const myAddress: Address = new Address(wallet.keypair.publicKey);

const vestingContractAddress = await provider.getPublicKeyInfo(
  process.env.VESTING_CONTRACT_ADDRESS || '',
);

const tokenAddress = await provider.getPublicKeyInfo(process.env.TOKEN_CONTRACT_ADDRESS || '');

async function interact() {
  const tokenContract: IOP_20Contract = getContract<IOP_20Contract>(
    tokenAddress,
    OP_20_ABI,
    provider,
    network,
    myAddress,
  );
  const vestingContract: IVestingContract = getContract<IVestingContract>(
    vestingContractAddress,
    VestingContractABI,
    provider,
    network,
    myAddress,
  );

  const balanceCall = await tokenContract.balanceOf(wallet.address);
  console.log('balance: ', balanceCall.properties.balance);

  // Change to whatever method is necessary
  const call = await vestingContract.claim();

  const params: TransactionParameters = {
    signer: wallet.keypair, // The keypair that will sign the transaction
    refundTo: wallet.p2tr, // Refund the rest of the funds to this address
    maximumAllowedSatToSpend: 20000n, // The maximum we want to allocate to this tx in satoshis
    feeRate: 55, // We need to provide a fee rate
    network: network, // The network we are operating on
  };

  const tx = await call.sendTransaction(params);

  console.log('Transaction created!', tx);
}

async function main() {
  console.log('My address (pubkey): ', wallet.publicKey.toString('hex'));
  console.log('My address (taproot): ', wallet.p2tr);
  await interact();
}

await main();
