<template>
  <WenPage
    title="Permission Request"
    subtitle="Allow the app to access your account"
  >
    <template #default>
      <DetailsView :sender>
        <template #details>
          <ul v-if="hasEthAccountsPermission">
            <li>Can see your wallet address</li>
          </ul>
          <div v-else>Unknown permissions</div>
        </template>
      </DetailsView>
    </template>

    <template #footer>
      <ActionList
        @allow="allow"
        @deny="deny"
      />
    </template>
  </WenPage>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import WenPage from '@/components/__common/WenPage.vue';
import ActionList from '@/components/__common/request/ActionList.vue';
import DetailsView from '@/components/__common/request/DetailsView.vue';
import { useProvider } from '@/composables/useProvider';

const {
  sender,
  permissionRequest,
  allowRequestPermissions: providerAllow,
  denyRequestPermissions: providerDeny,
} = useProvider();

function allow(): void {
  providerAllow();
  window.close();
}

function deny(): void {
  providerDeny();
  window.close();
}

const hasEthAccountsPermission = computed(() => {
  if (!permissionRequest.value) {
    return false;
  }
  return Object.keys(permissionRequest.value).includes('eth_accounts');
});
</script>

<style scoped>
ul {
  padding-left: 16px;
  color: var(--text-secondary);
  font-size: 13px;
}
</style>
