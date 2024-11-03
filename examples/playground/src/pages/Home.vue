<template>
  <div>
    <template v-if="!isConnected">
      <p>Not connected</p>
      <button @click="openConnectorDialog">Connect</button>
    </template>
    <template v-else>
      <p>Connected</p>
      <button @click="handleDisconnectClick">Disconnect</button>
      <p>Address: {{ accountAddress }}</p>
      <p>Code: {{ accountCodeResult.data }}</p>
    </template>
  </div>
  <DialogConnectors
    v-model:model-value="isDialogConnectorsOpen"
    @select="handleConnectorSelect"
  />
</template>

<script setup lang="ts">
import {
  Connector,
  useAccount,
  useBytecode,
  useConnect,
  useDisconnect,
} from '@wagmi/vue';
import { odysseyTestnet } from 'viem/chains';
import { computed, ref } from 'vue';

import DialogConnectors from '@/components/DialogConnectors.vue';

const connectedAccount = useAccount();
const accountCodeResult = useBytecode({
  address: connectedAccount.address,
});
const { connect } = useConnect();
const { disconnect } = useDisconnect();

const isConnected = computed(() => connectedAccount.isConnected.value);
const accountAddress = computed(() => connectedAccount.address.value);

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
</script>
