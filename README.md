## TODO

- Take subject and message body and sender as input then send mail.
- If possible to take mail id as input (IFF prod) - X

# Documentation

## What is AWS SES

Amazon Simple Email Service (SES) is an email platform that provides an easy, cost-effective way for you to send and receive email using your own email addresses and domains.

### `Api Endpoint`:

- Asia Pacific (Mumbai)

  > **email.ap-south-1.amazonaws.com**

### `Sending Quota`: Each supported Region: 200 emails in 24 hours

### `Sending rate`: Each supported Region: 1 email per second

### Message quotas:

- Using the SES v1 API - Maximum message size (including attachments): `10 MB per message (after base64 encoding)`

- Using the SES v2 API or SMTP - Maximum message size (including attachments): `40 MB per message (after base64 encoding)`

#### Maximum number of recipients per message: `50 recipients per message`.

#### Maximum number of identities that you can verify: `10,000 identities per AWS Region.`

> #### Note:
>
> - An identity is a domain or email address that you use to send email through SES.

### SES API sending quotas

- **Rate at which you can call Amazon SES API actions**: All actions (except for SendEmail, SendRawEmail, and SendTemplatedEmail) are throttled at one request per second.

- **MIME parts**: 500

### If you want to access the `Amazon SES API`:

- **Credentials**: `Access key ID and secret access key`

### If you want to access the `Amazon SES SMTP interface`:

- **Credentials**: `User name and password`

### If you want to access the `Amazon SES console`:

- **Credentials**: `IAM user name and password`

## How email sending works in Amazon SES:

![Email sending in AWS SES](/arch_overview-diagram.png "Email sending in AWS SE")

---

1. A client application, acting as an email sender, makes a request to SES to send email to one or more recipients.

2. If the request is valid, SES accepts the email.

3. SES sends the message over the Internet to the recipient's receiver. Once the message is passed to SES, it is usually sent immediately, with the first delivery attempt normally occurring within milliseconds.

4. At this point, there are different possibilities. For example:

   1. The ISP successfully delivers the message to the recipient's inbox.

   2. The recipient's email address does not exist, so the ISP sends a bounce notification to SES. SES then forwards the notification to the sender.

   3. The recipient receives the message but considers it to be spam and registers a complaint with the ISP. The ISP, which has a feedback loop set up with SES, sends the complaint to SES, which then forwards it to the sender.

The following sections review the individual possible outcomes after a sender sends an email request to SES and after SES sends an email message to the recipient.

### For more detail: [How email sending works in Amazon SES](https://docs.aws.amazon.com/ses/latest/dg/send-email-concepts-process.html)

---

## Email format in Amazon SES

> **An email consists of a header, a body, and an envelope, as described below.**

- `Header`—Contains routing instructions and information about the message. Examples are the sender's address, the recipient's address, the subject, and the date. The header is analogous to the information at the top of a postal letter, though it can contain many other types of information, such as the format of the message.

- `Body`—Contains the text of the message itself.

- `Envelope`—Contains the actual routing information that is communicated between the email client and the mail server during the SMTP session. This email envelope information is analogous to the information on a postal envelope. The routing information of the email envelope is usually the same as the routing information in the email header, but not always. For example, when you send a blind carbon copy (BCC), the actual recipient address (derived from the envelope) is not the same as the "To" address that is displayed in the recipient's email client, which is derived from the header.

---

### Amazon SES API

> If you call the Amazon SES API directly, you call either the **`SendEmail`** or the **`SendRawEmail`** API. The amount of information you need to provide depends on which API you call.

- The **`SendEmail`** API requires you to provide only a source address, destination address, message subject, and a message body. You can optionally provide "Reply-To" addresses. When you call this API, Amazon SES automatically assembles a properly formatted multi-part Multipurpose Internet Mail Extensions (MIME) email message optimized for display by email client software.

For more information, see [Sending formatted email using the Amazon SES API](https://docs.aws.amazon.com/ses/latest/dg/send-email-formatted.html).

- The **`SendRawEmail`** API provides you the flexibility to format and send your own raw email message by specifying headers, MIME parts, and content types. SendRawEmail is typically used by advanced users. You need to provide the body of the message and all header fields that are specified as required in the Internet Message Format specification.
  For more information, see [Sending raw email using the Amazon SES API v2](https://docs.aws.amazon.com/ses/latest/dg/send-email-raw.html).

## Understanding email deliverability in Amazon SES

![Understanding email deliverability in Amazon SES](/image.png)

---

### Understand email delivery issues

In most cases, your messages are delivered successfully to recipients who expect them. In some cases, however, a delivery might fail, or a recipient might not want to receive the mail that you are sending. `Bounces`, `complaints`, and the `suppression list` are related to these delivery issues and are described in the following sections.

- ### Bounce

  > If your recipient's receiver (for example, an email provider) fails to deliver your message to the recipient, the receiver bounces the message back to Amazon SES. Amazon SES then notifies you of the bounced email through email or through Amazon Simple Notification Service (Amazon SNS), depending on how you have your system set up.

  > There are **hard bounces** and **soft bounces**, as follows:

  - **`Hard bounce`** – A persistent email delivery failure. For example, the mailbox does not exist. Amazon SES does not retry hard bounces, with the exception of DNS lookup failures. We strongly recommend that you do not make repeated delivery attempts to email addresses that hard bounce.

  - **`Soft bounce`** – A temporary email delivery failure. For example, the mailbox is full, there are too many connections (also called throttling), or the connection times out. Amazon SES retries soft bounces multiple times. If the email still cannot be delivered, then Amazon SES stops retrying it.

> **Bounces can also be `synchronous` or `asynchronous`**.
>
> > A synchronous bounce occurs while the email servers of the sender and receiver are actively communicating.
>
> > An asynchronous bounce occurs when a receiver initially accepts an email message for delivery and then subsequently fails to deliver it to the recipient.

---

- ### Complaint

  - Most email client programs provide a button labeled "`Mark as Spam`," or similar, which moves the message to a spam folder, and forwards it to the email provider.

  - Additionally, most email providers maintain an abuse address (e.g., abuse@example.net), where users can forward unwanted email messages and request that the email provider take action to prevent them.

  - In both of these cases, the recipient is making a complaint. If the email provider concludes that you are a spammer, and Amazon SES has a feedback loop set up with the email provider, then the email provider will send the complaint back to Amazon SES.

  - When Amazon SES receives such a complaint, it forwards the complaint to you either by email or by using an Amazon SNS notification, depending on how you have your system set up.

---

- ### Global suppression list

  - The Amazon SES global suppression list, owned and managed by SES to protect the reputation of addresses in the SES shared IP pool, contains recipient email addresses that have recently caused a hard bounce for any SES customer.

  - If you try to send an email through SES to an address that is on the suppression list, the call to SES succeeds, but SES treats the email as a hard bounce instead of attempting to send it. Like any hard bounce, suppression list bounces count towards your sending quota and your bounce rate.

  - An email address can remain on the suppression list for up to 14 days.

  - If you're sure that the email address that you're trying to send to is valid, you can override the global suppression list by making sure the address isn't listed in your account-level suppression list and SES will still attempt delivery, but if it bounces, the bounce will affect your own reputation, but no one else will get bounces because they can’t send to that email address if they aren’t using their own account-level suppression list.

  - To understand more about the account-level suppression list, see [Using the Amazon SES account-level suppression list.](https://docs.aws.amazon.com/ses/latest/dg/sending-email-suppression-list.html)

---
