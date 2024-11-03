interface EnvironmentVariables {
  bundlerRpc: string;
  paymasterRpc: string;
}

function useEnv(): EnvironmentVariables {
  const env = (import.meta as ImportMeta).env;
  return {
    bundlerRpc: env.VITE_BUNDLER_RPC || '',
    paymasterRpc: env.VITE_PAYMASTER_RPC || '',
  };
}

export default useEnv;
