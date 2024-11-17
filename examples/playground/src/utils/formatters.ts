function formatJson(json: unknown): string {
  // handle bigints
  // return JSON.stringify(json, null, 4);
  return JSON.stringify(
    json,
    (key, value) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    },
    4,
  );
}

// eslint-disable-next-line import-x/prefer-default-export
export { formatJson };
