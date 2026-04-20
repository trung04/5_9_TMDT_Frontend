const cleanupHandlers = new Set<() => void>();

export function registerProtectedSessionCleanup(handler: () => void) {
    cleanupHandlers.add(handler);

    return () => {
        cleanupHandlers.delete(handler);
    };
}

export function runProtectedSessionCleanup() {
    for (const cleanupHandler of cleanupHandlers) {
        cleanupHandler();
    }
}
