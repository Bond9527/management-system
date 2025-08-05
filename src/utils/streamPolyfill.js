// Stream polyfill for browser compatibility
// This provides a minimal implementation for xlsx-js-style compatibility

if (typeof window !== 'undefined') {
  window.stream = {
    Readable: class {
      constructor() {
        this.readable = true;
        this.destroyed = false;
      }
      read() { return null; }
      destroy() { 
        this.destroyed = true; 
        this.readable = false; 
      }
      pipe() { return this; }
    },
    Writable: class {},
    Duplex: class {},
    Transform: class {},
    PassThrough: class {}
  };
}

if (typeof global !== 'undefined') {
  global.stream = {
    Readable: class {
      constructor() {
        this.readable = true;
        this.destroyed = false;
      }
      read() { return null; }
      destroy() { 
        this.destroyed = true; 
        this.readable = false; 
      }
      pipe() { return this; }
    },
    Writable: class {},
    Duplex: class {},
    Transform: class {},
    PassThrough: class {}
  };
} 