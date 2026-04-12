// ==========================================
// Google Form to Supabase Integration Script
// ==========================================
// Instructions:
// 1. Open your Google Form in edit mode.
// 2. Click the three dots (⋮) in the top right corner and select "Script editor".
// 3. Delete any code there and paste this entire script.
// 4. Click the "Save" icon (or Ctrl+S / Cmd+S).
// 5. IMPORTANT: Set up the Trigger!
//    - On the left sidebar, click the "Triggers" clock icon.
//    - Click "+ Add Trigger" in the bottom right corner.
//    - Choose which function to run: "onFormSubmit"
//    - Choose which deployment should run: "Head"
//    - Select event source: "From form"
//    - Select event type: "On form submit"
//    - Click Save (you may need to allow permissions).

const SUPABASE_URL = "https://yiqbybrzgwthtlvbjszm.supabase.co";
// NOTE: Use your sb_publishable_ key here.
const SUPABASE_ANON_KEY = "sb_publishable_Xr4XSkF9F8jOIFbT9dJfnw_C2lduA07";

function onFormSubmit(e) {
  // If e or e.namedValues is empty, this means it was run manually, not by a form submit.
  if (!e || !e.namedValues) {
    console.error("This script must be triggered by a form submission, do not run manually.");
    return;
  }

  try {
    // 1. Map Google Form column names to Supabase table column names.
    // Replace the strings inside namedValues['...'] with the EXACT question names on your form.
    const payload = {
      name: e.namedValues['Name'] ? e.namedValues['Name'][0] : "Unknown",
      email: e.namedValues['Email'] ? e.namedValues['Email'][0] : "Unknown",
      phone: e.namedValues['Phone'] ? e.namedValues['Phone'][0] : null,
      program_interest: e.namedValues['Program interest'] ? e.namedValues['Program interest'][0] : null,
      message: e.namedValues['Message'] ? e.namedValues['Message'][0] : null
    };

    // 2. Set up the payload and headers
    const url = `${SUPABASE_URL}/rest/v1/eklavya_inquiries`;
    
    const options = {
      method: "post",
      contentType: "application/json",
      // CRITICAL: When using the new sb_publishable_ keys, we DO NOT put it inside an "Authorization" header.
      // We only provide it via the "apikey" header.
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        // "Prefer": "return=representation" // Optional: returns the inserted row
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    // 3. Send the request
    const response = UrlFetchApp.fetch(url, options);
    
    // 4. Log the result for debugging
    const statusCode = response.getResponseCode();
    const responseBody = response.getContentText();
    
    if (statusCode >= 200 && statusCode < 300) {
      console.log("Successfully inserted into Supabase:", responseBody);
    } else {
      console.error(`Supabase Error (${statusCode}):`, responseBody);
      // For debugging, log what we tried to send
      console.error("Payload sent:", JSON.stringify(payload));
    }
    
  } catch (err) {
    console.error("Script Error:", err.toString());
  }
}

// A simple test function you can run manually to check connection & permissions
function testSupabaseConnection() {
  const url = `${SUPABASE_URL}/rest/v1/eklavya_inquiries?select=id&limit=1`;
  const options = {
    method: "get",
    headers: {
      "apikey": SUPABASE_ANON_KEY
    },
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  console.log("Status:", response.getResponseCode());
  console.log("Response:", response.getContentText());
}
