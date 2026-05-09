'use server';

import twilio from 'twilio';

export async function sendSMS(to: string, body: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn("TWILIO CONFIGURATION MISSING: Skipping SMS alert.");
    return { success: false, error: "Configuration missing" };
  }

  const client = twilio(accountSid, authToken);

  try {
    const message = await client.messages.create({
      body: `[AM FORD OPS] ${body}`,
      from: fromNumber,
      to: to
    });
    console.log("SMS Sent successfully:", message.sid);
    return { success: true, messageId: message.sid };
  } catch (err: any) {
    console.error("TWILIO SMS ERROR:", err);
    return { success: false, error: err.message };
  }
}
