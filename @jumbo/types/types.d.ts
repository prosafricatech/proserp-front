declare module 'beautiful-react-hooks' {
    export function useDebouncedCallback<T extends (...args: any[]) => any>(
      callback: T,
      delay: number,
      deps?: React.DependencyList
    ): (...args: Parameters<T>) => void;
}