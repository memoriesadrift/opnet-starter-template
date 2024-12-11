import { ABIDataTypes, Address } from '@btc-vision/transaction';
import {
  CallResult,
  BitcoinAbiTypes,
  BitcoinInterfaceAbi,
  IOP_NETContract,
  OP_NET_ABI,
} from 'opnet';

export interface IVestingContract extends IOP_NETContract {
  initialise(
    beneficiary: Address,
    vestingTokenAddress: Address,
    vestingAmount: bigint,
    vestingDeadlineBlock: bigint,
  ): Promise<CallResult<{ success: boolean }>>;
  claim(): Promise<CallResult<{ amount: boolean }>>;
  unlockedAmount(): Promise<CallResult<{ amount: bigint }>>;
  cancel(): Promise<CallResult<{ success: boolean }>>;
  vestingInfo(): Promise<
    CallResult<{
      beneficiary: Address;
      vestingTokenAddress: Address;
      vestedAmount: bigint;
      remainingAmount: bigint;
      vestingStartBlock: bigint;
      vestingDeadlineBlock: bigint;
    }>
  >;
}

export const VestingContractABI: BitcoinInterfaceAbi = [
  {
    name: 'initialise',
    inputs: [
      {
        name: 'beneficiary',
        type: ABIDataTypes.ADDRESS,
      },
      {
        name: 'vestingTokenAddress',
        type: ABIDataTypes.ADDRESS,
      },
      {
        name: 'vestingAmount',
        type: ABIDataTypes.UINT256,
      },
      {
        name: 'vestingDeadline',
        type: ABIDataTypes.UINT256,
      },
    ],
    outputs: [
      {
        name: 'success',
        type: ABIDataTypes.BOOL,
      },
    ],
    type: BitcoinAbiTypes.Function,
  },
  {
    name: 'claim',
    inputs: [],
    outputs: [
      {
        name: 'amount',
        type: ABIDataTypes.UINT256,
      },
    ],
    type: BitcoinAbiTypes.Function,
  },
  {
    name: 'unlockedAmount',
    inputs: [],
    outputs: [
      {
        name: 'amount',
        type: ABIDataTypes.UINT256,
      },
    ],
    type: BitcoinAbiTypes.Function,
  },
  {
    name: 'cancel',
    inputs: [],
    outputs: [
      {
        name: 'success',
        type: ABIDataTypes.BOOL,
      },
    ],
    type: BitcoinAbiTypes.Function,
  },
  {
    name: 'vestingInfo',
    inputs: [],
    outputs: [
      {
        name: 'beneficiary',
        type: ABIDataTypes.ADDRESS,
      },
      {
        name: 'vestedTokenAddress',
        type: ABIDataTypes.ADDRESS,
      },
      {
        name: 'vestedAmount',
        type: ABIDataTypes.UINT256,
      },
      {
        name: 'remainingAmount',
        type: ABIDataTypes.UINT256,
      },
      {
        name: 'vestingStart',
        type: ABIDataTypes.UINT256,
      },
      {
        name: 'vestingDeadline',
        type: ABIDataTypes.UINT256,
      },
    ],
    type: BitcoinAbiTypes.Function,
  },
  ...OP_NET_ABI,
];
