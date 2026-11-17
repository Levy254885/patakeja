import type { Faq } from "@/lib/types";

const f = (order: number, audience: Faq["audience"], question: string, answer: string): Faq => ({ id: `default-${order}`, order, audience, question, answer, published: true });

/** Shown when the `faqs` collection is empty. Admins can replace these from the admin console. */
export const DEFAULT_FAQS: Faq[] = [
  f(1, "tenants", "Is it free to search for a home on PataKeja?", "Yes. Browsing, searching, saving listings and sending enquiries are free."),
  f(2, "tenants", "How do I get a landlord's phone number?", "Open a listing and choose to unlock the contact details. A small one-time M-Pesa fee applies per property, and the contact then stays available in your account."),
  f(3, "tenants", "What happens if the unlock payment fails?", "You are not charged for a failed payment. If money left your M-Pesa account but the contact was not unlocked, open the payment in your account and contact support with its reference."),
  f(4, "tenants", "How do I know a listing is genuine?", "Look for the Verified badge, which means our team reviewed the lister. Never pay a deposit or rent before viewing the property, and report any suspicious listing using the report button."),
  f(5, "landlords", "How do I list my property?", "Create a landlord or agent account, pay the one-time registration fee by M-Pesa, then add your listing. It goes live once our team approves it."),
  f(6, "landlords", "Can I promote my listing?", "Yes. You can boost a listing for 24 hours from your portal so it appears higher in search results."),
  f(7, "all", "How do I reset my password?", "Use the Forgot password link on the sign-in page, or Settings in your account, and we will email you a reset link."),
  f(8, "all", "How is my personal data used?", "We only use it to run your account and connect tenants with listers. See our Privacy Policy for details."),
];
