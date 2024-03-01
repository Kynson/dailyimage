declare module '*.wasm' {
  const wasmModule: WebAssembly.Module;
  export default wasmModule;
}

interface Environment {
	IMAGE_BUCKET: R2Bucket;
	AI: any;
}