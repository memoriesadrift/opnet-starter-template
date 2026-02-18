import { Address, AddressMap, ExtendedAddressMap, SchnorrSignature } from '@btc-vision/transaction';
import { CallResult, OPNetEvent, IOP_NETContract } from 'opnet';

// ------------------------------------------------------------------
// Event Definitions
// ------------------------------------------------------------------
export type TransferredEvent = {
    readonly operator: Address;
    readonly from: Address;
    readonly to: Address;
    readonly amount: bigint;
};
export type ApprovedEvent = {
    readonly owner: Address;
    readonly spender: Address;
    readonly amount: bigint;
};
export type BurnedEvent = {
    readonly from: Address;
    readonly amount: bigint;
};

// ------------------------------------------------------------------
// Call Results
// ------------------------------------------------------------------

/**
 * @description Represents the result of the name function call.
 */
export type Name = CallResult<
    {
        name: string;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the symbol function call.
 */
export type Symbol = CallResult<
    {
        symbol: string;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the icon function call.
 */
export type Icon = CallResult<
    {
        icon: string;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the decimals function call.
 */
export type Decimals = CallResult<
    {
        decimals: number;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the totalSupply function call.
 */
export type TotalSupply = CallResult<
    {
        totalSupply: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the maximumSupply function call.
 */
export type MaximumSupply = CallResult<
    {
        maximumSupply: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the domainSeparator function call.
 */
export type DomainSeparator = CallResult<
    {
        domainSeparator: Uint8Array;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the balanceOf function call.
 */
export type BalanceOf = CallResult<
    {
        balance: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the nonceOf function call.
 */
export type NonceOf = CallResult<
    {
        nonce: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the allowance function call.
 */
export type Allowance = CallResult<
    {
        remaining: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the transfer function call.
 */
export type Transfer = CallResult<{}, OPNetEvent<TransferredEvent>[]>;

/**
 * @description Represents the result of the transferFrom function call.
 */
export type TransferFrom = CallResult<{}, OPNetEvent<TransferredEvent>[]>;

/**
 * @description Represents the result of the safeTransfer function call.
 */
export type SafeTransfer = CallResult<{}, OPNetEvent<TransferredEvent>[]>;

/**
 * @description Represents the result of the safeTransferFrom function call.
 */
export type SafeTransferFrom = CallResult<{}, OPNetEvent<TransferredEvent>[]>;

/**
 * @description Represents the result of the increaseAllowance function call.
 */
export type IncreaseAllowance = CallResult<{}, OPNetEvent<ApprovedEvent>[]>;

/**
 * @description Represents the result of the decreaseAllowance function call.
 */
export type DecreaseAllowance = CallResult<{}, OPNetEvent<ApprovedEvent>[]>;

/**
 * @description Represents the result of the increaseAllowanceBySignature function call.
 */
export type IncreaseAllowanceBySignature = CallResult<{}, OPNetEvent<ApprovedEvent>[]>;

/**
 * @description Represents the result of the decreaseAllowanceBySignature function call.
 */
export type DecreaseAllowanceBySignature = CallResult<{}, OPNetEvent<ApprovedEvent>[]>;

/**
 * @description Represents the result of the burn function call.
 */
export type Burn = CallResult<{}, OPNetEvent<BurnedEvent>[]>;

/**
 * @description Represents the result of the metadata function call.
 */
export type Metadata = CallResult<
    {
        name: string;
        symbol: string;
        icon: string;
        decimals: number;
        totalSupply: bigint;
        domainSeparator: Uint8Array;
    },
    OPNetEvent<never>[]
>;

// ------------------------------------------------------------------
// IOP20
// ------------------------------------------------------------------
export interface IOP20 extends IOP_NETContract {
    name(): Promise<Name>;
    symbol(): Promise<Symbol>;
    icon(): Promise<Icon>;
    decimals(): Promise<Decimals>;
    totalSupply(): Promise<TotalSupply>;
    maximumSupply(): Promise<MaximumSupply>;
    domainSeparator(): Promise<DomainSeparator>;
    balanceOf(owner: Address): Promise<BalanceOf>;
    nonceOf(owner: Address): Promise<NonceOf>;
    allowance(owner: Address, spender: Address): Promise<Allowance>;
    transfer(to: Address, amount: bigint): Promise<Transfer>;
    transferFrom(from: Address, to: Address, amount: bigint): Promise<TransferFrom>;
    safeTransfer(to: Address, amount: bigint, data: Uint8Array): Promise<SafeTransfer>;
    safeTransferFrom(from: Address, to: Address, amount: bigint, data: Uint8Array): Promise<SafeTransferFrom>;
    increaseAllowance(spender: Address, amount: bigint): Promise<IncreaseAllowance>;
    decreaseAllowance(spender: Address, amount: bigint): Promise<DecreaseAllowance>;
    increaseAllowanceBySignature(
        owner: Uint8Array,
        ownerTweakedPublicKey: Uint8Array,
        spender: Address,
        amount: bigint,
        deadline: bigint,
        signature: Uint8Array,
    ): Promise<IncreaseAllowanceBySignature>;
    decreaseAllowanceBySignature(
        owner: Uint8Array,
        ownerTweakedPublicKey: Uint8Array,
        spender: Address,
        amount: bigint,
        deadline: bigint,
        signature: Uint8Array,
    ): Promise<DecreaseAllowanceBySignature>;
    burn(amount: bigint): Promise<Burn>;
    metadata(): Promise<Metadata>;
}
