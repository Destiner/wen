<template>
  <div class="page">
    <div class="content">
      <div class="card">
        <div class="row">
          <div class="side">
            <a
              href="https://github.com/Destiner/wen"
              class="link"
              target="_blank"
              rel="noopener noreferrer"
            >
              wen wallet ↗
            </a>
            playground
          </div>
          <div class="side">
            <a
              href="https://github.com/Destiner/wen/tree/main/examples/playground"
              class="link"
              target="_blank"
              rel="noopener noreferrer"
            >
              source ↗
            </a>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="account">
          <template v-if="!isConnected">
            <div>Connect a wallet to get started</div>
            <div>
              <PlayButton
                type="primary"
                @click="openConnectorDialog"
              >
                Connect
              </PlayButton>
            </div>
          </template>
          <template v-else>
            <div>
              <PlayButton
                type="secondary"
                @click="handleDisconnectClick"
              >
                Disconnect
              </PlayButton>
            </div>
            <div class="data-row">
              <div class="label">Account</div>
              <div class="value">{{ accountAddress }}</div>
            </div>

            <div
              class="data-row"
              :class="{
                invalid:
                  !isValidDelegatee && !accountCodeResult.isFetching.value,
              }"
            >
              <div class="label">Delegatee</div>
              <div class="value">
                <template v-if="accountCodeResult.isFetching.value">
                  Loading...
                </template>
                <template v-else-if="isValidDelegatee">
                  {{ delegateeAddress }}
                </template>
                <template
                  v-else-if="
                    delegateeAddress === KERNEL_V3_IMPLEMENTATION_LEGACY_ADDRESS
                  "
                >
                  Legacy Kernel V3, please delegate to
                  {{ KERNEL_V3_IMPLEMENTATION_ADDRESS }}
                </template>
                <template v-else-if="delegateeAddress">
                  {{ delegateeAddress }} (not supported, please delegate to
                  Kernel V3)
                </template>
                <template v-else> Not delegating </template>
              </div>
            </div>

            <div
              v-if="isValidDelegatee"
              class="data-row"
              :class="{ invalid: !isInitialized }"
            >
              <div class="label">Is initialized?</div>
              <div class="value">
                <template v-if="isInitialized">Yes</template>
                <template v-else>
                  No: please initialize the account first
                </template>
              </div>
            </div>

            <div
              v-if="isInitialized"
              class="data-row"
              :class="{ invalid: !hasValidRootValidator }"
            >
              <div class="label">Has valid root validator?</div>
              <div class="value">
                <template v-if="hasValidRootValidator">Yes</template>
                <template v-else>
                  No: please use multi-chain validator
                </template>
              </div>
            </div>

            <div
              v-if="hasValidRootValidator"
              class="data-row"
              :class="{ invalid: !isValidOwner }"
            >
              <div class="label">Is valid owner?</div>
              <div class="value">
                <template v-if="isValidOwner">Yes</template>
                <template v-else> No: please make your EOA an owner </template>
              </div>
            </div>
          </template>
        </div>
      </div>
      <CardActions
        :is-valid-owner="isValidOwner"
        :is-pending="isPending"
        :tx-hash="txHash"
        :op-tx-hash="opTxHash"
        :capabilities="capabilities"
        :call-identifier="callIdentifier"
        :call-status="callStatus"
        :are-session-keys-enabled="areSessionKeysEnabled"
        :is-session-enabled="isSessionEnabled"
        :count="count"
        :enable-session-tx-hash="enableSessionTxHash"
        :increase-tx-hash="increaseTxHash"
        :decrease-tx-hash="decreaseTxHash"
        @send-transaction="handleSendTransactionClick"
        @send-user-op="handleSendUserOpClick"
        @get-capabilities="handleGetCapabilities"
        @send-calls="handleSendCalls"
        @get-call-status="handleGetCallStatus"
        @show-call-status="handleShowCallStatus"
        @enable-session="handleEnableSession"
        @increase="handleIncrease"
        @decrease="handleDecrease"
      />
    </div>
  </div>
  <DialogConnectors
    v-model:model-value="isDialogConnectorsOpen"
    @select="handleConnectorSelect"
  />
</template>

<script setup lang="ts">
import { useStorage } from '@vueuse/core';
import {
  GetCapabilitiesReturnType,
  getCapabilities,
  sendCalls,
  getCallsStatus,
  showCallsStatus,
} from '@wagmi/core/experimental';
import {
  Connector,
  useAccount,
  useBytecode,
  useConnect,
  useDisconnect,
  useReadContract,
  useSendTransaction,
  useSignMessage,
} from '@wagmi/vue';
import {
  Account,
  Address,
  createPublicClient,
  encodeFunctionData,
  getAbiItem,
  Hex,
  http,
  slice,
  toFunctionSelector,
  zeroAddress,
  zeroHash,
} from 'viem';
import {
  createBundlerClient,
  createPaymasterClient,
  entryPoint07Address,
} from 'viem/account-abstraction';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { odysseyTestnet } from 'viem/chains';
import { GetCallsStatusReturnType } from 'viem/experimental';
import { computed, ref, watch } from 'vue';

import counterAbi from '@/abi/counter';
import kernelMultiChainValidatorAbi from '@/abi/kernelMultiChainValidator';
import kernelV3ImplementationAbi from '@/abi/kernelV3Implementation';
import smartSessionModuleAbi from '@/abi/smartSessionModule';
import CardActions from '@/components/CardActions.vue';
import DialogConnectors from '@/components/DialogConnectors.vue';
import PlayButton from '@/components/PlayButton.vue';
import useEnv from '@/composables/useEnv';
import {
  type Execution,
  STUB_ECDSA_SIGNATURE,
  getOpHash,
  getOpTxHash,
  prepareOp,
  submitOp,
} from '@/utils/aa';
import {
  COUNTER_ADDRESS,
  ECDSA_SIGNER_ADDRESS,
  KERNEL_V3_IMPLEMENTATION_ADDRESS,
  KERNEL_V3_IMPLEMENTATION_LEGACY_ADDRESS,
  KERNEL_V3_MULTI_CHAIN_VALIDATOR_ADDRESS,
  KERNEL_V3_MULTI_CHAIN_VALIDATOR_ID,
  KERNEL_V3_SESSION_KEY_VALIDATOR_ID,
  SMART_SESSION_VALIDATOR_ADDRESS,
  YES_POLICY_ADDRESS,
} from '@/utils/consts';
import {
  encodeSessionSignature,
  getEnableSessionsCallData,
  getPermissionId,
  Permission,
} from '@/utils/sessionKeys';
import { config } from '@/wagmi';

const { bundlerRpc, paymasterRpc } = useEnv();

const connectedAccount = useAccount();
const accountCodeResult = useBytecode({
  address: connectedAccount.address,
});
const { connect } = useConnect();
const { disconnect } = useDisconnect();
const { sendTransactionAsync } = useSendTransaction();
const { signMessageAsync } = useSignMessage();

const isConnected = computed(() => connectedAccount.isConnected.value);
const accountAddress = computed(() => connectedAccount.address.value);
const delegateeAddress = computed<Address | null>(() => {
  if (!accountCodeResult.data.value) {
    return null;
  }
  if (!accountCodeResult.data.value.startsWith('0xef0100')) {
    return null;
  }
  if (accountCodeResult.data.value.length !== 48) {
    return null;
  }
  return slice(accountCodeResult.data.value, 3, 3 + 20);
});
const isValidDelegatee = computed(() => {
  return delegateeAddress.value === KERNEL_V3_IMPLEMENTATION_ADDRESS;
});

const rootValidatorResult = useReadContract({
  address: accountAddress,
  abi: kernelV3ImplementationAbi,
  functionName: 'rootValidator',
});
const isInitialized = computed(
  () =>
    rootValidatorResult.data.value !== undefined &&
    rootValidatorResult.data.value !== '0x',
);
const hasValidRootValidator = computed(() => {
  if (!isInitialized.value) {
    return false;
  }
  return rootValidatorResult.data.value === KERNEL_V3_MULTI_CHAIN_VALIDATOR_ID;
});

const ecdsaValidatorStorageAddress = computed(() => {
  if (!accountAddress.value) {
    return zeroAddress;
  }
  return accountAddress.value;
});
const validatorStorage = useReadContract({
  address: KERNEL_V3_MULTI_CHAIN_VALIDATOR_ADDRESS,
  abi: kernelMultiChainValidatorAbi,
  functionName: 'ecdsaValidatorStorage',
  args: [ecdsaValidatorStorageAddress],
});
watch(accountAddress, () => {
  validatorStorage.refetch();
});
const isValidOwner = computed(() => {
  if (!hasValidRootValidator.value) {
    return false;
  }
  return validatorStorage.data.value === accountAddress.value;
});

const capabilities = ref<GetCapabilitiesReturnType | null>(null);
async function handleGetCapabilities(): Promise<void> {
  isPending.value = true;
  capabilities.value = null;
  if (!accountAddress.value) {
    return;
  }
  const result = await getCapabilities(config, {
    account: accountAddress.value,
  });
  capabilities.value = result;
  isPending.value = false;
}

const callIdentifier = ref<string | null>(null);
async function handleSendCalls(): Promise<void> {
  isPending.value = true;
  callIdentifier.value = null;
  if (!accountAddress.value) {
    return;
  }
  const result = await sendCalls(config, {
    account: accountAddress.value,
    calls: [
      {
        to: '0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa',
        data: '0xdeadbeef',
      },
      {
        to: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
        data: '0xbeefdead',
      },
    ],
  });
  callIdentifier.value = result;
  isPending.value = false;
}
const callStatus = ref<GetCallsStatusReturnType | null>(null);
async function handleGetCallStatus(): Promise<void> {
  isPending.value = true;
  callStatus.value = null;
  if (!callIdentifier.value) {
    return;
  }
  const result = await getCallsStatus(config, {
    id: callIdentifier.value,
  });
  callStatus.value = result;
  isPending.value = false;
}
async function handleShowCallStatus(): Promise<void> {
  isPending.value = true;
  if (!callIdentifier.value) {
    return;
  }
  await showCallsStatus(config, {
    id: callIdentifier.value,
  });
  isPending.value = false;
}

const isSmartSessionModuleInstalled = useReadContract({
  address: accountAddress,
  abi: kernelV3ImplementationAbi,
  functionName: 'isModuleInstalled',
  args: [1n, SMART_SESSION_VALIDATOR_ADDRESS, '0x'],
});
watch(accountAddress, () => {
  isSmartSessionModuleInstalled.refetch();
});
const areSessionKeysEnabled = computed(
  () => isSmartSessionModuleInstalled.data.value,
);
const sessionPrivateKey = useStorage<Hex>(
  'wen-demo-session-private-key',
  generatePrivateKey(),
);
const sessionAccount = computed<Account | null>(() => {
  if (!sessionPrivateKey.value) {
    return null;
  }
  return privateKeyToAccount(sessionPrivateKey.value);
});
const permission = computed<Permission | null>(() => {
  if (!sessionAccount.value) {
    return null;
  }

  return {
    validator: ECDSA_SIGNER_ADDRESS,
    validatorInitData: sessionAccount.value.address,
    salt: zeroHash,
  };
});
const permissionId = computed(() => {
  if (!permission.value) {
    return zeroHash;
  }
  return getPermissionId(permission.value);
});
const isSessionEnabledResult = useReadContract({
  address: SMART_SESSION_VALIDATOR_ADDRESS,
  abi: smartSessionModuleAbi,
  functionName: 'isSessionEnabled',
  args: [permissionId, ecdsaValidatorStorageAddress],
});
watch(ecdsaValidatorStorageAddress, () => {
  isSessionEnabledResult.refetch();
});
const isSessionEnabled = computed(() => isSessionEnabledResult.data.value);
const enableSessionTxHash = ref<Hex | null>(null);
async function handleEnableSession(): Promise<void> {
  isPending.value = true;
  enableSessionTxHash.value = null;
  const bundlerClient = createBundlerClient({
    client: createPublicClient({
      chain: odysseyTestnet,
      transport: http(),
    }),
    transport: http(bundlerRpc),
  });
  const opHash = await sendEnableSessionOp();
  if (!opHash) {
    isPending.value = false;
    return;
  }
  const txHash = await getOpTxHash(bundlerClient, opHash);
  isPending.value = false;
  enableSessionTxHash.value = txHash;
  isSessionEnabledResult.refetch();
}
async function sendEnableSessionOp(): Promise<Hex | null> {
  if (!accountAddress.value) {
    return null;
  }
  if (!permission.value) {
    return null;
  }
  const bundlerClient = createBundlerClient({
    client: createPublicClient({
      chain: odysseyTestnet,
      transport: http(),
    }),
    transport: http(bundlerRpc),
  });
  const paymasterClient = createPaymasterClient({
    transport: http(paymasterRpc),
  });
  const callData = getEnableSessionsCallData(permission.value, [
    {
      target: COUNTER_ADDRESS,
      selector: toFunctionSelector(
        getAbiItem({
          abi: counterAbi,
          name: 'increase',
        }),
      ),
      policies: [
        {
          policy: YES_POLICY_ADDRESS,
          initData: '0x',
        },
      ],
    },
    {
      target: COUNTER_ADDRESS,
      selector: toFunctionSelector(
        getAbiItem({
          abi: counterAbi,
          name: 'decrease',
        }),
      ),
      policies: [
        {
          policy: YES_POLICY_ADDRESS,
          initData: '0x',
        },
      ],
    },
  ]);
  const op = await prepareOp(
    accountAddress.value,
    bundlerClient,
    paymasterClient,
    [
      {
        target: SMART_SESSION_VALIDATOR_ADDRESS,
        value: 0n,
        callData,
      },
    ],
    BigInt(KERNEL_V3_MULTI_CHAIN_VALIDATOR_ID),
    STUB_ECDSA_SIGNATURE,
  );
  const hash = getOpHash(odysseyTestnet.id, entryPoint07Address, op);
  if (!hash) {
    throw new Error('Failed to get hash');
  }
  try {
    const signature = await signMessageAsync({
      message: {
        raw: hash,
      },
    });
    op.signature = signature;
    await submitOp(accountAddress.value, bundlerClient, op);
    return hash;
  } catch {
    return null;
  }
}

const countResult = useReadContract({
  address: COUNTER_ADDRESS,
  abi: counterAbi,
  functionName: 'counts',
  args: [ecdsaValidatorStorageAddress],
});
watch(ecdsaValidatorStorageAddress, () => {
  countResult.refetch();
});
const count = computed(() => countResult.data.value);
const increaseTxHash = ref<Hex | null>(null);
async function handleIncrease(): Promise<void> {
  isPending.value = true;
  increaseTxHash.value = null;
  const hash = await sendCounterOp(true);
  if (!hash) {
    isPending.value = false;
    return;
  }
  const bundlerClient = createBundlerClient({
    client: createPublicClient({
      chain: odysseyTestnet,
      transport: http(),
    }),
    transport: http(bundlerRpc),
  });
  const txHash = await getOpTxHash(bundlerClient, hash);
  isPending.value = false;
  increaseTxHash.value = txHash;
  countResult.refetch();
}
const decreaseTxHash = ref<Hex | null>(null);
async function handleDecrease(): Promise<void> {
  isPending.value = true;
  decreaseTxHash.value = null;
  const hash = await sendCounterOp(false);
  if (!hash) {
    isPending.value = false;
    return;
  }
  const bundlerClient = createBundlerClient({
    client: createPublicClient({
      chain: odysseyTestnet,
      transport: http(),
    }),
    transport: http(bundlerRpc),
  });
  const txHash = await getOpTxHash(bundlerClient, hash);
  isPending.value = false;
  decreaseTxHash.value = txHash;
  countResult.refetch();
}
async function sendCounterOp(increase: boolean): Promise<Hex | null> {
  if (!accountAddress.value) {
    return null;
  }
  if (!sessionAccount.value) {
    return null;
  }
  const bundlerClient = createBundlerClient({
    client: createPublicClient({
      chain: odysseyTestnet,
      transport: http(),
    }),
    transport: http(bundlerRpc),
  });
  const paymasterClient = createPaymasterClient({
    transport: http(paymasterRpc),
  });
  const op = await prepareOp(
    accountAddress.value,
    bundlerClient,
    paymasterClient,
    [
      {
        target: COUNTER_ADDRESS,
        value: 0n,
        callData: encodeFunctionData({
          abi: counterAbi,
          functionName: increase ? 'increase' : 'decrease',
        }),
      },
    ],
    BigInt(KERNEL_V3_SESSION_KEY_VALIDATOR_ID),
    encodeSessionSignature(permissionId.value, STUB_ECDSA_SIGNATURE),
  );
  const hash = getOpHash(odysseyTestnet.id, entryPoint07Address, op);
  if (!hash) {
    throw new Error('Failed to get hash');
  }
  if (!sessionAccount.value.signMessage) {
    throw new Error('Session account does not support signMessage');
  }
  const signature = await sessionAccount.value.signMessage({
    message: {
      raw: hash,
    },
  });
  op.signature = encodeSessionSignature(permissionId.value, signature);
  await submitOp(accountAddress.value, bundlerClient, op);
  return hash;
}

const isDialogConnectorsOpen = ref(false);
function openConnectorDialog(): void {
  isDialogConnectorsOpen.value = true;
}
async function handleConnectorSelect(connector: Connector): Promise<void> {
  isDialogConnectorsOpen.value = false;
  connect({
    connector,
    chainId: odysseyTestnet.id,
  });
}
async function handleDisconnectClick(): Promise<void> {
  disconnect();
}

const isPending = ref(false);

const txHash = ref<Hex | null>(null);
async function handleSendTransactionClick(): Promise<void> {
  isPending.value = true;
  txHash.value = null;
  try {
    const hash = await sendTransactionAsync({
      to: accountAddress.value,
      value: 0n,
    });
    txHash.value = hash;
  } catch {
    // Ignore
  }
  isPending.value = false;
}

const opHash = ref<Hex | null>(null);
const opTxHash = ref<Hex | null>(null);
async function handleSendUserOpClick(): Promise<void> {
  isPending.value = true;
  opTxHash.value = null;
  const hash = await sendUserOp();
  if (!hash) {
    isPending.value = false;
    return;
  }
  const bundlerClient = createBundlerClient({
    client: createPublicClient({
      chain: odysseyTestnet,
      transport: http(),
    }),
    transport: http(bundlerRpc),
  });
  const txHash = await getOpTxHash(bundlerClient, hash);
  isPending.value = false;
  opHash.value = hash;
  opTxHash.value = txHash;
  if (!txHash) {
    return;
  }
}

async function sendUserOp(): Promise<null | Hex> {
  if (!accountAddress.value) {
    return null;
  }
  const bundlerClient = createBundlerClient({
    client: createPublicClient({
      chain: odysseyTestnet,
      transport: http(),
    }),
    transport: http(bundlerRpc),
  });
  const paymasterClient = createPaymasterClient({
    transport: http(paymasterRpc),
  });
  const executions: Execution[] = [
    {
      target: accountAddress.value,
      value: 0n,
      callData: '0x',
    },
  ];
  const nonceKey = BigInt(KERNEL_V3_MULTI_CHAIN_VALIDATOR_ID);
  const op = await prepareOp(
    accountAddress.value,
    bundlerClient,
    paymasterClient,
    executions,
    nonceKey,
    STUB_ECDSA_SIGNATURE,
  );
  const hash = getOpHash(odysseyTestnet.id, entryPoint07Address, op);
  if (!hash) {
    throw new Error('Failed to get hash');
  }
  try {
    const signature = await signMessageAsync({
      message: {
        raw: hash,
      },
    });
    op.signature = signature;
    const publicClient = createPublicClient({
      chain: odysseyTestnet,
      transport: http(),
    });
    const bundlerClient = createBundlerClient({
      client: publicClient,
      transport: http(bundlerRpc),
    });
    const opHash = await submitOp(accountAddress.value, bundlerClient, op);
    return opHash;
  } catch {
    return null;
  }
}
</script>

<style scoped>
.page {
  display: flex;
  align-items: start;
  justify-content: center;
  min-height: 100vh;
  margin: 32px 16px;
  margin-top: 32px;
}

@media (width >= 768px) {
  .page {
    margin: 0;
    margin-top: 96px;
  }
}

.content {
  display: flex;
  flex-direction: column;
  width: 640px;
  max-width: 100%;
  gap: 8px;
}

.card {
  display: flex;
  flex-direction: column;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--background-secondary);
  gap: 24px;
}

.row {
  display: flex;
  justify-content: space-between;
  gap: 4px;
}

.side {
  display: flex;
  gap: 6px;
}

.link {
  display: flex;
  align-items: center;
  gap: 2px;
  justify-content: center;
  color: #eb2ab1;
  text-decoration: none;
}

.account,
.sessions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.data-row {
  display: flex;
  gap: 2px;
  flex-direction: column;

  .value {
    color: var(--text-primary);
    word-wrap: break-word;
  }

  &.invalid {
    .value {
      color: #db3807;
    }
  }

  .label {
    color: var(--text-secondary);
    font-size: 12px;
  }
}

.actions {
  display: flex;
  gap: 8px;
  flex-direction: column;

  .action {
    display: flex;
    gap: 2px;
    flex-direction: column;

    .action-result {
      display: inline-flex;
      padding: 6px 10px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: var(--background-primary);
      font-family: Consolas, Inconsolata, monospace;
      font-size: 13px;
      gap: 4px;

      .icon {
        width: 16px;
        height: 16px;
        color: var(--text-primary);
      }
    }
  }
}
</style>
