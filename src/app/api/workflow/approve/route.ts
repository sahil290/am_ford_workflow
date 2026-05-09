import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  // Use Service Role key to bypass RLS in the API route
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceKey) {
    console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing from environment variables!');
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { searchParams } = new URL(req.url);
  const rawJobId = searchParams.get('jobId');
  const jobId = rawJobId?.trim();
  const action = searchParams.get('action');
  
  console.log('API RECEIVED JOB ID:', jobId, 'Length:', jobId?.length);

  if (!jobId || action !== 'approve') {
    return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
  }

  try {
    // 1. Fetch current job to get line items
    const { data: jobs, error: fetchError } = await supabaseAdmin
      .from('recon_jobs')
      .select(`
        id, 
        authorization_data, 
        current_stage_code, 
        total_cost,
        vehicle:vehicles(year, make, model)
      `)
      .eq('id', jobId);

    const job = jobs?.[0];

    if (fetchError || !job) {
      console.error('SUPABASE FETCH ERROR:', fetchError);
      console.error('ID LOOKUP FAILED, TRYING FALLBACK SEARCH...', fetchError);
      
      // FALLBACK: If ID lookup fails, search by VIN or Stock Number as a safety net
      // We'll need the original VIN/Stock if we want to do this perfectly, 
      // but for now, let's just log why the ID might be failing.
      
      const { data: allJobs } = await supabaseAdmin
        .from('recon_jobs')
        .select('id, vehicle_label, current_stage_code')
        .in('current_stage_code', ['approval-sent', 'finalize-approval']);
      
      console.log('ACTIVE JOBS IN DB:', allJobs?.map(j => ({ id: j.id, label: j.vehicle_label, stage: j.current_stage_code })));

      return new NextResponse(`
        <html>
          <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0f172a; color: white;">
            <div style="text-align: center; background: #1e293b; padding: 40px; border-radius: 20px; border: 1px solid #ef4444;">
              <h1 style="color: #ef4444;">Error</h1>
              <p>Could not find recon job with ID: <code style="background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 4px; color: #ef4444;">${jobId}</code></p>
              <div style="font-size: 10px; color: #64748b; margin-bottom: 20px;">Length: ${jobId?.length} chars</div>
              ${fetchError ? `
                <div style="margin-top: 20px; padding: 15px; background: rgba(239,68,68,0.1); border: 1px solid #ef4444; border-radius: 12px; text-align: left;">
                  <b style="color: #ef4444; font-size: 12px; display: block; margin-bottom: 5px;">DATABASE ERROR:</b>
                  <p style="color: #ccc; font-size: 11px; margin: 0;">${fetchError.message} (${fetchError.code})</p>
                </div>
              ` : ''}
              ${!serviceKey ? `
                <div style="margin-top: 20px; padding: 15px; background: rgba(255,165,0,0.1); border: 1px solid orange; border-radius: 12px; text-align: left;">
                  <b style="color: orange; font-size: 12px; display: block; margin-bottom: 5px;">🔧 CONFIGURATION ERROR:</b>
                  <p style="color: #ccc; font-size: 11px; margin: 0;">The <b>SUPABASE_SERVICE_ROLE_KEY</b> is missing from your server environment variables.</p>
                </div>
              ` : `
                <p style="color: #94a3b8; font-size: 14px;">It may have already been moved or deleted.</p>
              `}
            </div>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    const v = Array.isArray(job.vehicle) ? job.vehicle[0] : job.vehicle;
    const vehicleLabel = v ? `${v.year} ${v.make} ${v.model}` : 'Vehicle';

    // 2. Mark all items as approved
    const updatedLineItems = (job.authorization_data || []).map((item: any) => ({
      ...item,
      status: 'approved',
      finalCost: item.finalCost || item.cost
    }));

    // 3. Move to next stage (finalize-approval or work-completed)
    // If coming from 'approval-sent', move to 'finalize-approval' (or skip if preferred)
    // The user said "whatever we doing on finalise approval", so we move to 'work-completed'
    const { error: updateError } = await supabaseAdmin
      .from('recon_jobs')
      .update({
        current_stage_code: 'work-completed',
        authorization_data: updatedLineItems,
        final_decision: 'Approved via Email',
        final_decision_notes: 'Automated approval triggered by Admin from secure email link.',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    if (updateError) throw updateError;

    // 4. Trigger Finalization Email
    try {
      const { sendAuthorizationEmail } = await import("@/app/actions/send-authorization-email");
      await sendAuthorizationEmail({
        jobId: jobId,
        vehicleLabel: vehicleLabel,
        totalCost: job.total_cost || "0.00",
        items: updatedLineItems,
        requiresApproval: true,
        isFinalDecision: true,
        verdict: 'Approved via Email',
        remarks: 'Automated approval triggered by Admin from secure email link.'
      });
    } catch (emailErr) {
      console.error("Confirmation email failed:", emailErr);
    }

    return new NextResponse(`
      <html>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0f172a; color: white;">
          <div style="text-align: center; background: #1e293b; padding: 60px; border-radius: 32px; border: 1px solid #22c55e; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
            <div style="width: 80px; height: 80px; background: #22c55e20; color: #22c55e; border-radius: 24px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h1 style="font-size: 32px; font-weight: 900; margin-bottom: 12px; letter-spacing: -0.02em;">Approval Successful</h1>
            <p style="color: #94a3b8; font-size: 16px; margin-bottom: 32px;">The vehicle has been moved to <b>Work Completed</b> stage.</p>
            <a href="${req.nextUrl.origin}/control-tower" style="display: inline-block; background: #2563eb; color: white; padding: 16px 32px; border-radius: 12px; font-weight: 800; text-decoration: none; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em;">Open Dashboard</a>
          </div>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });

  } catch (err: any) {
    return new NextResponse(`
      <html>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0f172a; color: white;">
          <div style="text-align: center; background: #1e293b; padding: 40px; border-radius: 20px; border: 1px solid #ef4444;">
            <h1 style="color: #ef4444;">System Error</h1>
            <p>${err.message}</p>
          </div>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });
  }
}
