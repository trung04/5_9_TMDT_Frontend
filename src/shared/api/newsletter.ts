import type { BackendNewsletterSubscriptionResponse } from "@/shared/api/backend-types";
import { apiRequest } from "@/shared/api/backend-client";

export function subscribeNewsletter(email: string, source: string) {
    return apiRequest<BackendNewsletterSubscriptionResponse>("/newsletter-subscriptions", {
        method: "POST",
        body: {
            email,
            source,
        },
    });
}
