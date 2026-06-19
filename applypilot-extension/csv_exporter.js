(() => {
  const COLUMNS = [
    "post_date", "source_url", "post_url", "recruiter_name", "recruiter_profile_url",
    "company_name", "job_title", "location", "skills_mentioned", "email_id",
    "phone_number", "apply_link", "full_post_text", "status", "score", "message_draft",
    "dedupe_key", "created_at"
  ];

  function escapeCell(value) {
    const stringValue = String(value ?? "");
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  function exportLeads(leads) {
    if (!leads.length) return false;

    const rows = [COLUMNS.map(escapeCell).join(",")];
    leads.forEach((lead) => rows.push(COLUMNS.map((column) => escapeCell(lead[column])).join(",")));

    const blob = new Blob(["\uFEFF", rows.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const now = new Date();
    const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("_");
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `applypilot_leads_${date}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  }

  window.ApplyPilotCsv = { exportLeads, COLUMNS };
})();
