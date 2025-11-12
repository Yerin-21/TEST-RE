
export interface AttachedFile {
  name: string;
  type: string;
  content: string; // base64 encoded
}

export interface SelectionRange {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface Suggestion {
  find: string;
  replace: string;
}
