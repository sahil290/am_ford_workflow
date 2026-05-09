"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// Using service role to bypass RLS for administrative deletion
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function deleteReconJob(jobId: string) {
  try {
    console.log("SERVER: Attempting hard delete for job:", jobId);
    
    const { error, count } = await supabaseAdmin
      .from('recon_jobs')
      .delete()
      .eq('id', jobId);

    if (error) {
      console.error("SERVER: Deletion error:", error);
      return { success: false, error: error.message };
    }

    console.log("SERVER: Deletion confirmed. Rows affected:", count);
    
    // Clear Next.js caches
    revalidatePath('/control-tower');
    revalidatePath('/ai-insights');
    revalidatePath('/workflow-queue');
    
    return { success: true };
  } catch (err: any) {
    console.error("SERVER: Critical deletion failure:", err);
    return { success: false, error: err.message };
  }
}
