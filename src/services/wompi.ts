const getEnv = (key: string, def: string) => {
  try { // @ts-ignore
    return import.meta.env[key] || def;
  } catch (e) { return def; }
};
export const startWompiPayment = (email: string, name: string, onCompleted: () => void) => {
    setTimeout(onCompleted, 2000); // Simulación
};