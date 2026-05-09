'use server';

import { Resend } from 'resend';
import { supabase } from '@/lib/supabase';

export async function sendDetailNotificationEmail(data: {
  vehicleLabel: string;
}) {
  const resendKey = process.env.RESEND_API_KEY;
  const resend = new Resend(resendKey);
  
  // Fetch all users with detailer role
  const { data: staff } = await supabase
    .from('profiles')
    .select('email')
    .eq('role', 'detailer');

  const staffEmails = staff?.map(s => s.email).filter(Boolean) || [];

  // Fallback if no staff found
  const toEmails = staffEmails.length > 0 
    ? staffEmails 
    : [(process.env.ADMIN_EMAIL || "admin@workshop.com").trim()];
  const dashboardUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/control-tower`;

  try {
    const { data: resendData, error } = await resend.emails.send({
      from: 'Workshop Ops <onboarding@resend.dev>',
      to: toEmails,
      subject: `UNIT READY FOR DETAIL: ${data.vehicleLabel}`,
      html: `
        <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 40px; border-radius: 24px;">
          <div style="background: white; padding: 0; border-radius: 24px; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1); overflow: hidden; border: 1px solid #e2e8f0;">
            
            <div style="background: #22c55e; padding: 32px; text-align: center;">
              <h1 style="color: white; font-size: 20px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 0.1em;">
                Unit Ready for Detail
              </h1>
              <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin-top: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
                Workshop Stage Completed
              </p>
            </div>

            <div style="padding: 32px; text-align: center;">
              <div style="background: #f0fdf4; border: 2px dashed #bbf7d0; padding: 24px; border-radius: 20px; margin-bottom: 24px;">
                <div style="font-size: 10px; font-weight: 900; color: #166534; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Vehicle Identifier</div>
                <div style="font-size: 24px; font-weight: 900; color: #14532d; letter-spacing: -0.02em;">${data.vehicleLabel}</div>
              </div>

              <p style="font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 32px;">
                All authorized workshop repairs and inspections have been finalized. This unit is now moving into the <strong>Detailing Stage</strong>. Please prepare for intake.
              </p>

              <a href="${dashboardUrl}" style="display: inline-block; background: #14532d; color: white; text-align: center; padding: 18px 40px; border-radius: 12px; font-weight: 800; text-decoration: none; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 10px 15px -3px rgba(20, 83, 45, 0.3);">
                Open Control Tower
              </a>
            </div>
          </div>
          <p style="text-align: center; color: #94a3b8; font-size: 10px; margin-top: 32px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">
            Workshop Operations • Automated Dispatch System
          </p>
        </div>
      `,
    });

    if (error) return { success: false, message: error.message };
    return { success: true, message: "Detail notification sent." };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
