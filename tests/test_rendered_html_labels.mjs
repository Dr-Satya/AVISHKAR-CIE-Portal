// tests/test_rendered_html_labels.mjs
import { spawn } from "child_process";
import http from "http";

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ status: res.statusCode, data }));
    }).on("error", reject);
  });
}

async function main() {
  console.log("Starting preview server on port 3005...");
  const child = spawn("cmd.exe", ["/c", "npx vite preview --port 3005"], {
    stdio: "pipe",
    detached: false,
  });

  let serverReady = false;

  child.stdout.on("data", (d) => {
    const text = d.toString();
    if (text.includes("3005") || text.includes("Local:")) {
      serverReady = true;
    }
  });

  try {
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      try {
        const res = await fetchPage("http://127.0.0.1:3005/");
        if (res.status === 200) {
          serverReady = true;
          console.log("✓ Preview server responded with 200 OK!");
          
          const html = res.data;

          // 1. Verify VENUE & INQUIRIES
          console.log("\nInspecting rendered Contact section HTML...");
          if (html.includes("VENUE &amp; INQUIRIES") || html.includes("VENUE & INQUIRIES")) {
            console.log("  ✓ PASS: Rendered HTML contains 'VENUE & INQUIRIES'");
          } else {
            throw new Error("Rendered HTML missing 'VENUE & INQUIRIES'");
          }

          // 2. Verify OFFICIAL EVENT POLICY
          console.log("Inspecting rendered Guidelines section HTML...");
          if (html.includes("OFFICIAL EVENT POLICY")) {
            console.log("  ✓ PASS: Rendered HTML contains 'OFFICIAL EVENT POLICY'");
          } else {
            throw new Error("Rendered HTML missing 'OFFICIAL EVENT POLICY'");
          }

          // 3. Verify OFFICIAL EVENTS & COMPETITIONS
          console.log("Inspecting rendered Competitions section HTML...");
          if (html.includes("OFFICIAL EVENTS &amp; COMPETITIONS") || html.includes("OFFICIAL EVENTS & COMPETITIONS")) {
            console.log("  ✓ PASS: Rendered HTML contains 'OFFICIAL EVENTS & COMPETITIONS'");
          } else {
            throw new Error("Rendered HTML missing 'OFFICIAL EVENTS & COMPETITIONS'");
          }

          // 4. Verify no old pill box classes in contact label
          const contactIdx = html.indexOf('id="contact"');
          if (contactIdx !== -1) {
            const contactSub = html.substring(contactIdx, contactIdx + 1200);
            if (!contactSub.includes("px-3 py-1 rounded-md bg-white")) {
              console.log("  ✓ PASS: Contact section label has no box container");
            } else {
              throw new Error("Found old box container in Contact section");
            }
          }

          // 5. Verify Header
          const headerIdx = html.indexOf('<header');
          const headerEnd = html.indexOf('</header>');
          if (headerIdx !== -1 && headerEnd !== -1) {
            const headerHtml = html.substring(headerIdx, headerEnd);
            if (!headerHtml.includes("avishkar-logo.png")) {
              console.log("  ✓ PASS: Header does NOT contain avishkar-logo.png");
            } else {
              throw new Error("Header still contains avishkar-logo.png");
            }
          }

          console.log("\n========================================================");
          console.log("🎉 ALL RENDERED HTML VERIFICATIONS PASSED!");
          console.log("========================================================");
          break;
        }
      } catch (e) {
        // Retry
      }
    }
  } finally {
    console.log("Shutting down preview server...");
    child.kill("SIGKILL");
    spawn("taskkill", ["/PID", child.pid.toString(), "/T", "/F"], { stdio: "ignore" });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
