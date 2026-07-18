declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.scss' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.less' {
  const content: Record<string, string>;
  export default content;
}

declare module 'lodash/debounce' {
  type DebounceFunction<T extends (...args: any[]) => any> = T & {
    cancel: () => void;
    flush: () => ReturnType<T> | undefined;
  };

  function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait?: number,
    options?: {
      leading?: boolean;
      maxWait?: number;
      trailing?: boolean;
    }
  ): DebounceFunction<T>;

  export default debounce;
}
