import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { RewardSnapshot, UserAddress, UserProfile } from "@/entities/user/model/types";
import {
    rewardSnapshot as seedRewardSnapshot,
    userProfile as seedUserProfile,
} from "@/shared/api/mock-data";

interface AddressInput {
    label: string;
    recipient: string;
    phone: string;
    line1: string;
    city: string;
    note?: string;
}

interface AccountState {
    profile: UserProfile;
    rewardSnapshot: RewardSnapshot;
    nextAddressSequence: number;
    updateProfile: (updates: Partial<UserProfile>) => void;
    updateAvatar: (avatar: string) => void;
    removeAvatar: () => void;
    addAddress: (input: AddressInput) => UserAddress;
    updateAddress: (addressId: string, updates: Partial<UserAddress>) => void;
    removeAddress: (addressId: string) => void;
    setDefaultAddress: (addressId: string) => void;
    redeemReward: (title: string, pointsCost: number) => { success: boolean; error?: string };
    reset: () => void;
}

function buildSeedProfile(): UserProfile {
    return {
        ...seedUserProfile,
        orderEmail: true,
        securityAlerts: true,
        addresses: [
            {
                id: "address-home",
                label: "Nhà riêng",
                recipient: seedUserProfile.name,
                phone: seedUserProfile.phone,
                line1: seedUserProfile.address,
                city: seedUserProfile.city,
                note: "Giao sau 18h nếu có thể.",
                isDefault: true,
            },
        ],
        rewardHistory: [],
    };
}

const initialState = {
    profile: buildSeedProfile(),
    rewardSnapshot: seedRewardSnapshot,
    nextAddressSequence: 1,
};

export const useAccountStore = create<AccountState>()(
    persist(
        (set, get) => ({
            ...initialState,
            updateProfile: (updates) =>
                set((state) => ({
                    profile: {
                        ...state.profile,
                        ...updates,
                    },
                })),
            updateAvatar: (avatar) =>
                set((state) => ({
                    profile: {
                        ...state.profile,
                        avatar,
                    },
                })),
            removeAvatar: () =>
                set((state) => ({
                    profile: {
                        ...state.profile,
                        avatar: "",
                    },
                })),
            addAddress: (input) => {
                const address: UserAddress = {
                    id: `address-${get().nextAddressSequence}`,
                    label: input.label.trim(),
                    recipient: input.recipient.trim(),
                    phone: input.phone.trim(),
                    line1: input.line1.trim(),
                    city: input.city.trim(),
                    note: input.note?.trim(),
                    isDefault: get().profile.addresses.length === 0,
                };

                set((state) => ({
                    profile: {
                        ...state.profile,
                        addresses: [...state.profile.addresses, address],
                    },
                    nextAddressSequence: state.nextAddressSequence + 1,
                }));

                return address;
            },
            updateAddress: (addressId, updates) =>
                set((state) => ({
                    profile: {
                        ...state.profile,
                        addresses: state.profile.addresses.map((address) =>
                            address.id === addressId ? { ...address, ...updates } : address,
                        ),
                    },
                })),
            removeAddress: (addressId) =>
                set((state) => {
                    const remainingAddresses = state.profile.addresses.filter(
                        (address) => address.id !== addressId,
                    );

                    const normalizedAddresses = remainingAddresses.map((address, index) => ({
                        ...address,
                        isDefault: index === 0 ? true : address.isDefault,
                    }));

                    return {
                        profile: {
                            ...state.profile,
                            addresses: normalizedAddresses,
                        },
                    };
                }),
            setDefaultAddress: (addressId) =>
                set((state) => {
                    const nextAddresses = state.profile.addresses.map((address) => ({
                        ...address,
                        isDefault: address.id === addressId,
                    }));
                    const selected = nextAddresses.find((address) => address.id === addressId);

                    return {
                        profile: {
                            ...state.profile,
                            address: selected?.line1 ?? state.profile.address,
                            city: selected?.city ?? state.profile.city,
                            addresses: nextAddresses,
                        },
                    };
                }),
            redeemReward: (title, pointsCost) => {
                if (pointsCost > get().rewardSnapshot.points) {
                    return {
                        success: false,
                        error: "Điểm thưởng hiện tại không đủ để đổi ưu đãi này.",
                    };
                }

                set((state) => ({
                    rewardSnapshot: {
                        ...state.rewardSnapshot,
                        points: state.rewardSnapshot.points - pointsCost,
                    },
                    profile: {
                        ...state.profile,
                        rewardHistory: [
                            {
                                id: `reward-${state.profile.rewardHistory.length + 1}`,
                                title,
                                pointsUsed: pointsCost,
                                createdAt: new Date().toISOString(),
                                status: "completed",
                            },
                            ...state.profile.rewardHistory,
                        ],
                    },
                }));

                return { success: true };
            },
            reset: () => set(initialState),
        }),
        {
            name: "heritage-account-store",
            storage: createJSONStorage(() => localStorage),
        },
    ),
);
