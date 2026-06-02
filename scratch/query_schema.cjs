const { createClient } = require('@supabase/supabase-js');

const SB_URL = "https://uuxggoydnjvsssbenkkt.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1eGdnb3lkbmp2c3NzYmVua2t0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwODg4OTgsImV4cCI6MjA5MjY2NDg5OH0.VniG6qm6Z9spdezyw-85k4liEuyC9i3B_T2Pxo-9nK0";
const sb = createClient(SB_URL, SB_KEY);

async function run() {
  const { data, error } = await sb.from("comments").select("*").limit(1);
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Sample Comment Keys:", data.length > 0 ? Object.keys(data[0]) : "No comments found in database yet");
  }
}

run();
