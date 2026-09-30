// Starting drafts for the About and policy pages. They describe how this store's software
// actually works and avoid business commitments (dispatch times, return windows) that the
// publisher has not given. Edit them in Admin > Settings > Pages before launch.
// Format: blank line = new paragraph, "## " = heading, "- " = bullet.

export const DEFAULT_PAGES = {
  about: `## Who we are
Aarohi Lava Publications publishes exam preparation books for Telangana competitive examinations, including TSLPRB and TGPSC.

## Our books
Our titles focus on previous question papers and General Studies, explained topic by topic so aspirants can prepare with a clear, exam-oriented approach.

## Why buy here
This is the publisher's own online store. You get the current edition directly from us, pay securely online, and can track your order from dispatch to delivery.`,

  shipping_policy: `## Where we deliver
We ship within India. You can check whether our courier partners deliver to your pincode on any book page before you order.

## Shipping charges
The shipping charge for your order is shown in your cart and at checkout before you pay. Any free-shipping threshold is also shown there.

## Dispatch and tracking
Orders are packed after payment is confirmed (or after the order is placed, for cash on delivery). When your order is dispatched we email you the courier name and tracking number (AWB). You can follow your parcel any time on the Track order page using your order ID and the phone number or email used at checkout.

## Delivery issues
If your parcel is delayed, damaged or you have not received it, contact us with your order ID and we will follow up with the courier.`,

  returns_policy: `## Damaged, defective or wrong books
If a book arrives damaged, has printing defects, or is not the book you ordered, contact us with your order ID and photos of the book and packaging. We will arrange a replacement or a refund after reviewing the issue.

## Cancellations
You can ask us to cancel an order before it is dispatched. Orders that have already shipped cannot be cancelled.

## Refunds
Refunds for online payments are made to the original payment method through our payment partner, Razorpay. Your bank may take a few working days to show the amount after we process it. You receive an email when a refund is processed.

## How to contact us
Use the Contact page or reply to your order email with your order ID.`,

  privacy_policy: `## What we collect
When you place an order we collect your name, email address, mobile number and delivery address. If you create an account, we also store your saved addresses and order history.

## How we use it
We use your details to process and deliver your order, send order and delivery updates, provide customer support, and prevent fraud. If you subscribe to our newsletter we email you about new books; you can ask us to remove you at any time.

## Payments
Online payments are processed by Razorpay. Your card, UPI and bank details are entered on Razorpay's secure checkout and are not stored by us.

## Sharing
We share your name, phone number and address with our courier partner only to deliver your order. We do not sell your personal information.

## Your choices
You can update your profile and addresses in your account, and contact us to access or delete your personal information, subject to records we must keep for accounting and legal reasons.`,

  terms: `## About these terms
These terms apply when you use this website and buy books from Aarohi Lava Publications.

## Orders and prices
All prices are in Indian Rupees. The final amount, including any shipping charge, discount or tax, is shown at checkout before you pay. An order is confirmed when payment succeeds, or when a cash on delivery order is placed. We may cancel an order if a book becomes unavailable or a pricing error occurs, and will refund any amount paid.

## Content
The books and the content on this website are protected by copyright. You may not copy, reproduce or distribute them without our written permission.

## Accounts
Keep your password confidential. You are responsible for activity on your account.

## Contact
For questions about these terms, contact us through the Contact page.`,
};

export type PageKey = keyof typeof DEFAULT_PAGES;
