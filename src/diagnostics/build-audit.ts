import { execSync } from 'child_process';
import * as fs from 'fs';

async function runAudit() {
  console.log("\n==========================================");
  console.log("🚀 STARTING FULL BUILD AUDIT...");
  console.log("==========================================\n");

  console.log("📂 SCANNING PROJECT FOR ALL ERRORS...");
  
  let output = "";
  try {
    // Run tsc to find all type errors at once
    output = execSync('npx tsc --noEmit', { encoding: 'utf8', stdio: 'pipe' });
    console.log("✅ NO TYPE ERRORS FOUND!");
  } catch (error: any) {
    output = error.stdout || error.message;
    const errorCount = (output.match(/error TS/g) || []).length;
    
    console.log(`❌ FOUND ${errorCount} TYPE ERRORS.`);
    
    // Write to log file
    fs.writeFileSync('build-errors.log', output);
    console.log("📄 All errors have been saved to: build-errors.log");
    
    // Show a preview of the first few errors
    console.log("\n--- ERROR PREVIEW (First 5) ---");
    const lines = output.split('\n').filter(l => l.includes(': error TS'));
    lines.slice(0, 5).forEach(line => console.log(line));
    
    if (lines.length > 5) {
      console.log(`... and ${lines.length - 5} more.`);
    }
  }

  console.log("\n==========================================");
  console.log("💡 TIP: Fix these errors before running 'npm run build'");
  console.log("==========================================\n");
}

runAudit();
