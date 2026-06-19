# WhatsApp Cloud API: What You Can Use for Free

LeadFlow AI only uses official/legal WhatsApp paths:

1. **Meta WhatsApp Cloud API** for real API sends.
2. **wa.me click-to-chat links** when Cloud API is not connected.

It does **not** use unofficial WhatsApp Web automation, QR-session bots, browser scraping, or fake delivery statuses.

## The honest free path

Meta's developer setup can create a **test WhatsApp Business Account** and a **test business phone number**. That test number can send free test messages to a limited set of recipient numbers that you add and verify in the Meta developer dashboard.

This is good for development and proving LeadFlow works, but it is not unlimited free production broadcasting.

## How to get the free WhatsApp test credentials

1. Go to Meta for Developers:
   - https://developers.facebook.com/

2. Create an app:
   - Choose a business app type if prompted.

3. Add the **WhatsApp** product to the app.

4. Go to:
   - App Dashboard → WhatsApp → API Setup

5. Meta will provide:
   - A temporary **Access Token**
   - A test **Phone Number ID**
   - A pre-approved `hello_world` template
   - A test WhatsApp Business Account/test business number

6. Add your own WhatsApp number as a recipient:
   - In the **To** field, click **Manage phone number list**.
   - Add your phone number.
   - Verify the code sent to WhatsApp.

7. Copy these into LeadFlow:
   - `Access Token` → Connections → WhatsApp → Meta access token
   - `Phone Number ID` → Connections → WhatsApp → Phone Number ID

8. Test from LeadFlow:
   - Connections → WhatsApp → Validate
   - Lead detail page → Generate WhatsApp → Send WhatsApp

## Important limitations

- Temporary developer tokens expire. For longer use, create a system user/permanent access token in Meta Business settings.
- For production sending to real customers at scale, you normally need:
  - A Meta Business portfolio
  - A WhatsApp Business Account
  - A production phone number
  - Approved message templates for business-initiated messages
  - Compliance with WhatsApp Business Messaging Policy
- Free `wa.me` links are always available and real, but they require the user/browser to open WhatsApp and confirm/send the message manually.

## LeadFlow behavior

- If Cloud API credentials are connected: LeadFlow sends using the official API.
- If credentials are missing: LeadFlow generates a real `https://wa.me/...` click-to-chat link.
- If the phone number format is invalid: LeadFlow marks it invalid and does not fake a send.
