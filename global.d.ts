export {};

declare global {
  interface Window {
    VOID_LOG: (msg: string) => void;
    gapi: any;
    google: any;
    tokenClient: any;
  }
}
