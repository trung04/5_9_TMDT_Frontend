import { create } from "zustand";

export interface ToastMessage {
    id: string;
    tone: "success" | "info" | "warning" | "danger";
    message: string;
}

interface FeedbackState {
    toasts: ToastMessage[];
    pushToast: (toast: Omit<ToastMessage, "id">) => void;
    dismissToast: (toastId: string) => void;
    clear: () => void;
}

export const useFeedbackStore = create<FeedbackState>((set) => ({
    toasts: [],
    pushToast: (toast) =>
        set((state) => ({
            toasts: [
                ...state.toasts,
                {
                    id: `${Date.now()}-${state.toasts.length + 1}`,
                    ...toast,
                },
            ],
        })),
    dismissToast: (toastId) =>
        set((state) => ({
            toasts: state.toasts.filter((toast) => toast.id !== toastId),
        })),
    clear: () => set({ toasts: [] }),
}));
