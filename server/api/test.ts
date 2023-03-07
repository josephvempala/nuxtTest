export default defineEventHandler((event) => {
  const result = useRuntimeConfig();
  return {
    result,
  };
});
