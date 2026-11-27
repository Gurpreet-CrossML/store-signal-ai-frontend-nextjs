import type {
  CheckoutOptions,
  CheckoutResult,
} from "@/redux/api-slice/billing-slice";

const CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";
// Brand purple used across the dashboard.
const THEME_COLOR = "#6500d6";

/** The bits of Razorpay's Checkout class we use. */
type RazorpayInstance = {
  open: () => void;
  on: (
    event: "payment.failed",
    handler: (response: { error: { description?: string } }) => void,
  ) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

/** Raised when the owner closes Checkout without paying. */
export class CheckoutDismissed extends Error {}

let scriptPromise: Promise<void> | null = null;

/** Loads Razorpay's checkout.js once per page. */
function loadCheckoutScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = CHECKOUT_SCRIPT;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error("Could not load Razorpay. Check your connection."));
      };
      document.body.appendChild(script);
    });
  }
  return scriptPromise;
}

/**
 * Opens Razorpay Checkout for a subscription or an order.
 * Resolves with what Razorpay returns after a successful payment; rejects
 * with CheckoutDismissed when the owner closes it, or an Error on failure.
 */
export async function openRazorpayCheckout(
  options: CheckoutOptions,
): Promise<CheckoutResult> {
  await loadCheckoutScript();
  const Razorpay = window.Razorpay;
  if (!Razorpay) throw new Error("Could not load Razorpay.");

  return new Promise((resolve, reject) => {
    let lastError = "";
    const checkout = new Razorpay({
      key: options.key_id,
      name: options.name,
      description: options.description,
      // A subscription takes its amount from the plan; an order needs it.
      ...(options.subscription_id
        ? { subscription_id: options.subscription_id }
        : {
            order_id: options.order_id,
            amount: options.amount,
            currency: options.currency,
          }),
      prefill: options.prefill,
      theme: { color: THEME_COLOR },
      handler: (response: CheckoutResult) =>
        resolve({
          ...response,
          // Send back the ids we opened with, not whatever came back.
          ...(options.subscription_id
            ? { razorpay_subscription_id: options.subscription_id }
            : { razorpay_order_id: options.order_id ?? undefined }),
        }),
      modal: {
        // Closing Checkout: a failed attempt says why, otherwise just closed.
        ondismiss: () =>
          reject(lastError ? new Error(lastError) : new CheckoutDismissed()),
      },
    });
    // Razorpay keeps Checkout open on a failed attempt so the owner can
    // retry; remember the reason in case they give up.
    checkout.on("payment.failed", (response) => {
      lastError = response.error.description || "Payment failed.";
    });
    checkout.open();
  });
}
