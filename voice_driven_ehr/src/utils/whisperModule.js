// src/utils/whisperModule.js
export const initializeWhisper = async () => {
    const Module = {
      wasmBinary: await fetch('/wasm/whisper-react.wasm').then((response) =>
        response.arrayBuffer()
      ),
      onRuntimeInitialized: () => {},
      FS: {
        lookupPath: (path) => ({ node: { mount: { opts: {} } } }),
      },
    };
  
    return new Promise((resolve) => {
      Module.onRuntimeInitialized = () => {
        resolve(Module);
      };
      importScripts('/wasm/main.js'); // Load the Emscripten glue code
    });
  };