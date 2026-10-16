// tests/test_config_verification.mjs
import fs from "node:fs";
import path from "node:path";

function runConfigCheck() {
  console.log("Running Supabase Configuration & Security Verification...\n");

  const projectRoot = process.cwd();
  const envLocalPath = path.join(projectRoot, ".env.local");
  const envExamplePath = path.join(projectRoot, ".env.example");
  const gitignorePath = path.join(projectRoot, ".gitignore");

  // 1. Check .env.local existence and format
  if (!fs.existsSync(envLocalPath)) {
    console.error("❌ FAILED: .env.local does not exist.");
    process.exit(1);
  }
  const envLocalContent = fs.readFileSync(envLocalPath, "utf-8");
  const lines = envLocalContent.split(/\r?\n/);
  let urlFound = false;
  let anonKeyPresent = false;
  let isPlaceholder = false;
  let keyLengthOk = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    const val = rest.join("=").trim().replace(/^['"]|['"]$/g, "");

    if (key.trim() === "NEXT_PUBLIC_SUPABASE_URL") {
      if (val.startsWith("https://") && val.includes(".supabase.co") && !val.includes("your-project")) {
        urlFound = true;
      }
    }
    if (key.trim() === "NEXT_PUBLIC_SUPABASE_ANON_KEY" || key.trim() === "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") {
      if (val.length > 0) {
        anonKeyPresent = true;
        if (val.startsWith("your-") || val.includes("placeholder") || val === "undefined" || val === "null") {
          isPlaceholder = true;
        } else if (val.length >= 20) {
          keyLengthOk = true;
        }
      }
    }
  }

  console.log("1. .env.local checks:");
  console.log(`   - File exists: ✅ Pass`);
  console.log(`   - Project URL configured correctly: ${urlFound ? "✅ Pass" : "❌ Fail"}`);
  console.log(`   - Publishable key variable present: ${anonKeyPresent ? "✅ Pass" : "❌ Fail"}`);
  console.log(`   - Publishable key is not a placeholder: ${(!isPlaceholder && keyLengthOk) ? "✅ Pass" : "❌ Fail"}`);

  // 2. Check .env.example existence
  console.log("\n2. .env.example checks:");
  const exampleExists = fs.existsSync(envExamplePath);
  console.log(`   - .env.example exists: ${exampleExists ? "✅ Yes" : "❌ No"}`);

  // 3. Check .gitignore rules
  console.log("\n3. Git Ignore verification:");
  const gitignoreContent = fs.readFileSync(gitignorePath, "utf-8");
  const ignoresEnvLocalPattern = gitignoreContent.includes(".env*.local");
  const ignoresEnvGlob = gitignoreContent.includes(".env*");
  const allowsExample = gitignoreContent.includes("!.env.example");

  console.log(`   - Excludes .env*.local: ${ignoresEnvLocalPattern ? "✅ Yes" : "❌ No"}`);
  console.log(`   - Excludes .env*: ${ignoresEnvGlob ? "✅ Yes" : "❌ No"}`);
  console.log(`   - Allows .env.example: ${allowsExample ? "✅ Yes" : "❌ No"}`);

  // 4. Ensure no secret service-role key is in NEXT_PUBLIC_ namespace
  console.log("\n4. Security & Secret Leak Check:");
  const publicServiceRoleExposed = envLocalContent.includes("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY");
  if (publicServiceRoleExposed) {
    console.error("❌ CRITICAL SECURITY FLAW: Service role key found in NEXT_PUBLIC_ variable!");
    process.exit(1);
  } else {
    console.log("   - No secret service role key exposed under NEXT_PUBLIC_: ✅ Clean");
  }

  console.log("\n✅ Configuration verification completed successfully.");
}

runConfigCheck();
