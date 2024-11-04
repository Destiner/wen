import {
  Address,
  concat,
  createPublicClient,
  encodeAbiParameters,
  encodeFunctionData,
  Hex,
  http,
  keccak256,
  padHex,
  size,
  slice,
  zeroAddress,
} from 'viem';
import {
  BundlerClient,
  entryPoint07Abi,
  entryPoint07Address,
  PaymasterClient,
  sendUserOperation,
} from 'viem/account-abstraction';
import { readContract } from 'viem/actions';
import { odysseyTestnet } from 'viem/chains';

import kernelV3ImplementationAbi from '@/abi/kernelV3Implementation';

import { SMART_SESSION_VALIDATOR_ADDRESS } from './consts';

interface Op_0_7 {
  sender: Address;
  nonce: bigint;
  initCode: Hex;
  callData: Hex;
  accountGasLimits: Hex;
  preVerificationGas: bigint;
  gasFees: Hex;
  paymasterAndData: Hex;
  signature: Hex;
}

interface Execution {
  target: Address;
  value: bigint;
  callData: Hex;
}

// Fix: make it dynamic
const callGasLimit = 1000000n;
const verificationGasLimit = 1000000n;
const preVerificationGas = 100000n;

const publicClient = createPublicClient({
  chain: odysseyTestnet,
  transport: http(),
});

async function getDisableSmartSessionModuleExecution(
  account: Address,
): Promise<Execution> {
  const moduleTypeValidator = 1n;

  const callData = encodeFunctionData({
    abi: kernelV3ImplementationAbi,
    functionName: 'uninstallModule',
    args: [moduleTypeValidator, SMART_SESSION_VALIDATOR_ADDRESS, '0x'],
  });

  return {
    target: account,
    value: 0n,
    callData,
  };
}

async function getEnableSmartSessionModuleExecution(
  account: Address,
): Promise<Execution> {
  const moduleTypeValidator = 1n;

  const hook = zeroAddress;
  const validationData = '0x';
  const validationLength = padHex(size(validationData).toString(16) as Hex);
  const validationOffset = padHex('0x60');
  const hookLength = padHex('0x0');
  const hookOffset = padHex(
    (
      BigInt(validationOffset) +
      BigInt(validationLength) +
      BigInt('0x20')
    ).toString(16) as Hex,
  );
  const selectorLength = padHex('0x0');
  const selectorOffset = padHex(
    (BigInt(hookOffset) + BigInt('0x20')).toString(16) as Hex,
  );

  const initData = concat([
    hook,
    validationOffset,
    hookOffset,
    selectorOffset,
    validationLength,
    validationData,
    hookLength,
    selectorLength,
  ]);

  const callData = encodeFunctionData({
    abi: kernelV3ImplementationAbi,
    functionName: 'installModule',
    args: [moduleTypeValidator, SMART_SESSION_VALIDATOR_ADDRESS, initData],
  });

  return {
    target: account,
    value: 0n,
    callData,
  };
}

function getOpHash(chain: number, entryPoint: Address, op: Op_0_7): Hex | null {
  const hashedInitCode = keccak256(op.initCode);
  const hashedCallData = keccak256(op.callData);
  const hashedPaymasterAndData = keccak256(op.paymasterAndData);
  const packedUserOp = encodeAbiParameters(
    [
      { type: 'address' },
      { type: 'uint256' },
      { type: 'bytes32' },
      { type: 'bytes32' },
      { type: 'bytes32' },
      { type: 'uint256' },
      { type: 'bytes32' },
      { type: 'bytes32' },
    ],
    [
      op.sender,
      op.nonce,
      hashedInitCode,
      hashedCallData,
      op.accountGasLimits,
      op.preVerificationGas,
      op.gasFees,
      hashedPaymasterAndData,
    ],
  );
  const encoded = encodeAbiParameters(
    [{ type: 'bytes32' }, { type: 'address' }, { type: 'uint256' }],
    [keccak256(packedUserOp), entryPoint, BigInt(chain)],
  );
  return keccak256(encoded);
}

async function prepareOp(
  ownerAddress: Address,
  paymasterClient: PaymasterClient | null,
  executions: Execution[],
  nonceKey: bigint,
): Promise<Op_0_7> {
  const execMode =
    '0x0100000000000000000000000000000000000000000000000000000000000000';
  const executionCalldata = encodeAbiParameters(
    [
      {
        type: 'tuple[]',
        components: [
          {
            type: 'address',
            name: 'target',
          },
          {
            type: 'uint256',
            name: 'value',
          },
          {
            type: 'bytes',
            name: 'callData',
          },
        ],
      },
    ],
    [executions],
  );

  const callData = encodeFunctionData({
    abi: kernelV3ImplementationAbi,
    functionName: 'execute',
    args: [execMode, executionCalldata],
  });

  const nonce = await readContract(publicClient, {
    address: entryPoint07Address,
    abi: entryPoint07Abi,
    functionName: 'getNonce',
    args: [ownerAddress, nonceKey],
  });

  const { maxFeePerGas, maxPriorityFeePerGas } =
    await publicClient.estimateFeesPerGas();

  let paymasterPostOpGasLimit: bigint | undefined;
  let paymasterVerificationGasLimit: bigint | undefined;
  let paymaster: Address | undefined;
  let paymasterData: Hex | undefined;
  if (paymasterClient) {
    const paymasterStubDataResult = await paymasterClient.getPaymasterStubData({
      chainId: odysseyTestnet.id,
      entryPointAddress: entryPoint07Address,
      callData,
      callGasLimit,
      verificationGasLimit,
      preVerificationGas,
      maxFeePerGas,
      maxPriorityFeePerGas,
      nonce,
      sender: ownerAddress,
    });
    paymasterPostOpGasLimit = paymasterStubDataResult.paymasterPostOpGasLimit;
    paymasterVerificationGasLimit =
      paymasterStubDataResult.paymasterVerificationGasLimit;

    const paymasterDataResult = await paymasterClient.getPaymasterData({
      chainId: odysseyTestnet.id,
      entryPointAddress: entryPoint07Address,
      callData,
      callGasLimit,
      verificationGasLimit,
      preVerificationGas,
      maxFeePerGas,
      maxPriorityFeePerGas,
      paymasterPostOpGasLimit,
      paymasterVerificationGasLimit,
      nonce,
      sender: ownerAddress,
    });
    paymaster = paymasterDataResult.paymaster;
    paymasterData = paymasterDataResult.paymasterData;
  }

  const op: Op_0_7 = {
    sender: ownerAddress,
    nonce,
    // Should be already initialized
    initCode: '0x',
    callData,
    accountGasLimits: concat([
      padHex(verificationGasLimit.toString(16) as Hex, { size: 16 }),
      padHex(callGasLimit.toString(16) as Hex, { size: 16 }),
    ]),
    preVerificationGas,
    gasFees: concat([
      padHex(maxPriorityFeePerGas.toString(16) as Hex, { size: 16 }),
      padHex(maxFeePerGas.toString(16) as Hex, { size: 16 }),
    ]),
    paymasterAndData:
      paymaster &&
      paymasterData &&
      paymasterVerificationGasLimit &&
      paymasterPostOpGasLimit
        ? concat([
            padHex(paymaster.toLowerCase() as Hex, { size: 20 }),
            padHex(paymasterVerificationGasLimit.toString(16) as Hex, {
              size: 16,
            }),
            padHex(paymasterPostOpGasLimit.toString(16) as Hex, { size: 16 }),
            paymasterData,
          ])
        : '0x',
    signature: '0x',
  };

  return op;
}

async function submitOp(
  ownerAddress: Address,
  bundlerClient: BundlerClient,
  op: Op_0_7,
): Promise<Hex> {
  const gasFees = op.gasFees;
  const maxPriorityFeePerGas = BigInt(slice(gasFees, 0, 16));
  const maxFeePerGas = BigInt(slice(gasFees, 16, 32));
  const paymaster =
    size(op.paymasterAndData) > 0
      ? slice(op.paymasterAndData, 0, 20)
      : undefined;
  const paymasterVerificationGasLimit =
    size(op.paymasterAndData) > 0
      ? BigInt(slice(op.paymasterAndData, 20, 36))
      : undefined;
  const paymasterPostOpGasLimit =
    size(op.paymasterAndData) > 0
      ? BigInt(slice(op.paymasterAndData, 36, 52))
      : undefined;
  const paymasterData =
    size(op.paymasterAndData) > 0 ? slice(op.paymasterAndData, 52) : undefined;
  const userOpHash = await sendUserOperation(bundlerClient, {
    entryPointAddress: entryPoint07Address,
    sender: ownerAddress,
    nonce: op.nonce,
    callData: op.callData,
    callGasLimit,
    verificationGasLimit,
    preVerificationGas,
    maxPriorityFeePerGas,
    maxFeePerGas,
    signature: op.signature,
    paymaster,
    paymasterData,
    paymasterPostOpGasLimit,
    paymasterVerificationGasLimit,
  });

  return userOpHash;
}

async function getOpTxHash(
  bundlerClient: BundlerClient,
  opHash: Hex,
): Promise<Hex | null> {
  try {
    const receipt = await bundlerClient.waitForUserOperationReceipt({
      hash: opHash,
    });
    return receipt.receipt.transactionHash;
  } catch {
    return null;
  }
}

export {
  getEnableSmartSessionModuleExecution,
  getDisableSmartSessionModuleExecution,
  getOpHash,
  prepareOp,
  submitOp,
  getOpTxHash,
};
