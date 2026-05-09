'use server';

import { Resend } from 'resend';
import { supabase } from '@/lib/supabase';

export async function sendAuthorizationEmail(data: {
  jobId: string;
  vehicleLabel: string;
  totalCost: string;
  items: any[];
  requiresApproval: boolean;
  pdfUrl?: string;
  isFinalDecision?: boolean;
  verdict?: string;
  remarks?: string;
}) {
  const resendKey = process.env.RESEND_API_KEY;
  const resend = new Resend(resendKey);
  
  // Fetch all users with admin role
  const { data: admins } = await supabase
    .from('profiles')
    .select('email')
    .eq('role', 'admin');

  const adminEmails = admins?.map(a => a.email).filter(Boolean) || [];
  
  // Fallback to env if no admins found
  const toEmails = adminEmails.length > 0 
    ? adminEmails 
    : [(process.env.ADMIN_EMAIL || "admin@workshop.com").trim()];
  const dashboardUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/control-tower`;

  const itemsHtml = data.items.map(item => {
    const isApproved = item.status === 'approved' || !data.isFinalDecision;
    const isDeclined = item.status === 'declined';
    const statusColor = isDeclined ? '#ef4444' : (isApproved ? '#22c55e' : '#64748b');
    const statusLabel = data.isFinalDecision ? (item.status?.toUpperCase() || 'PENDING') : 'REQUESTED';
    
    const proposedCost = parseFloat(item.cost || "0");
    const finalCost = parseFloat(item.finalCost || item.cost || "0");
    const isModified = data.isFinalDecision && Math.abs(finalCost - proposedCost) > 0.01;

    return `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 0; font-size: 11px; color: #94a3b8; font-weight: 800;">${item.code || 'SVC'}</td>
        <td style="padding: 12px 0; font-size: 13px; color: #1e293b; font-weight: 500;">
          ${item.description}
          ${item.remarks ? `<br/><span style="font-size: 10px; color: #64748b; font-style: italic;">Note: ${item.remarks}</span>` : ''}
        </td>
        <td style="padding: 12px 0; font-size: 11px; font-weight: 900; color: ${statusColor}; text-align: center;">
          <span style="background: ${statusColor}10; padding: 4px 8px; border-radius: 4px; border: 1px solid ${statusColor}20;">
            ${statusLabel}
          </span>
        </td>
        <td style="padding: 12px 0; font-size: 14px; color: #1e3a8a; font-weight: 800; text-align: right;">
          ${isModified ? `
            <div style="font-size: 10px; color: #94a3b8; text-decoration: line-through; margin-bottom: 2px;">$${item.cost}</div>
            <div style="color: #2563eb;">$${item.finalCost}</div>
          ` : `
            <div>$${data.isFinalDecision ? (item.finalCost || item.cost) : item.cost}</div>
          `}
        </td>
      </tr>
    `;
  }).join('');

  const subject = data.isFinalDecision 
    ? `FINAL DECISION: Service Authorization for ${data.vehicleLabel}`
    : `Action Required: Service Authorization for ${data.vehicleLabel}`;

  const title = data.isFinalDecision ? "Approval Finalized" : "Service Authorization";
  const headerBg = data.isFinalDecision ? "#0f172a" : "#2563eb";

  try {
    const { data: resendData, error } = await resend.emails.send({
      from: 'Workshop Ops <onboarding@resend.dev>',
      to: toEmails,
      subject: subject,
      html: `
        <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 40px; border-radius: 24px;">
          <div style="background: white; padding: 0; border-radius: 24px; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1); overflow: hidden; border: 1px solid #e2e8f0;">
            
            <div style="background: ${headerBg}; padding: 32px; text-align: center;">
              <h1 style="color: white; font-size: 20px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 0.1em;">
                ${title}
              </h1>
              <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin-top: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
                Vehicle ID: ${data.vehicleLabel}
              </p>
            </div>

            <div style="padding: 32px;">
              ${data.isFinalDecision ? `
                <div style="background: #f1f5f9; padding: 20px; border-radius: 16px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
                  <div style="font-size: 10px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px;">Manager Verdict</div>
                  <div style="font-size: 18px; font-weight: 900; color: #0f172a;">${data.verdict || 'Processed'}</div>
                  ${data.remarks ? `<div style="font-size: 12px; color: #475569; margin-top: 8px; line-height: 1.5; border-top: 1px solid #cbd5e1; padding-top: 8px;">${data.remarks}</div>` : ''}
                </div>
              ` : ''}

              <div style="background: #eff6ff; padding: 24px; border-radius: 16px; margin-bottom: 32px; border: 1px solid #dbeafe;">
                <span style="display: block; font-size: 10px; font-weight: 900; color: #2563eb; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px;">
                  Total Authorized Value
                </span>
                <span style="font-size: 36px; font-weight: 900; color: #1e3a8a; letter-spacing: -0.02em;">$${data.totalCost}</span>
              </div>

              <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
                <thead>
                  <tr style="border-bottom: 2px solid #f1f5f9;">
                    <th style="text-align: left; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; padding-bottom: 12px;">Code</th>
                    <th style="text-align: left; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; padding-bottom: 12px;">Description</th>
                    <th style="text-align: center; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; padding-bottom: 12px;">Status</th>
                    <th style="text-align: right; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; padding-bottom: 12px;">Final Cost</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <div style="margin-bottom: 24px;">
                ${!data.isFinalDecision ? `
                  <a href="${dashboardUrl.split('/control-tower')[0]}/api/workflow/approve?jobId=${data.jobId}&action=approve" 
                     style="display: block; background: #22c55e; color: white; text-align: center; padding: 20px; border-radius: 16px; font-weight: 900; text-decoration: none; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; box-shadow: 0 10px 15px -3px rgba(34, 197, 94, 0.3); margin-bottom: 12px;">
                    Approve All Items Instantly
                  </a>
                ` : ''}
                <a href="${dashboardUrl}" style="display: block; background: #0f172a; color: white; text-align: center; padding: 18px; border-radius: 12px; font-weight: 800; text-decoration: none; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid rgba(255,255,255,0.1);">
                  ${data.isFinalDecision ? 'View Final Audit Trail' : 'Review & Edit Details'}
                </a>
              </div>
            </div>
          </div>
          <p style="text-align: center; color: #94a3b8; font-size: 10px; margin-top: 32px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">
            Workshop Operations Command Center • Security Verified Notification
          </p>
        </div>
      `,
    });

    if (error) return { success: false, message: error.message };
    return { success: true, message: "Email delivered successfully." };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
