(() => {
  const SKILLS = [
    "Data Engineer", "Python", "PySpark", "Spark", "AWS Glue", "AWS", "Snowflake",
    "Databricks", "Airflow", "SQL", "ETL", "ELT", "Redshift", "PostgreSQL",
    "Big Data", "Hadoop", "Azure", "GCP"
  ];
  const LOCATIONS = [
    "Remote India", "Delhi NCR", "Gurgaon", "Gurugram", "Noida", "Delhi",
    "Bangalore", "Bengaluru", "Pune", "Hyderabad", "Remote", "India"
  ];
  const JOB_TITLES = [
    "Data Engineering Developer", "Big Data Engineer", "AWS Data Engineer",
    "PySpark Developer", "Snowflake Developer", "Databricks Engineer",
    "ETL Developer", "Data Engineer"
  ];
  const APPLY_HOSTS = [
    "forms.gle", "docs.google.com/forms", "greenhouse.io", "lever.co", "workable",
    "naukri", "instahyre", "wellfound", "linkedin.com/jobs"
  ];

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function findTerms(text, terms) {
    return terms.filter((term) => new RegExp(`\\b${escapeRegExp(term)}\\b`, "i").test(text));
  }

  function normalizeUrl(url) {
    return (url || "").replace(/[),.;]+$/, "");
  }

  function extractApplyLink(text, visibleLinks = []) {
    const textUrls = text.match(/https?:\/\/[^\s<>"']+/gi) || [];
    const links = [...visibleLinks, ...textUrls].map(normalizeUrl);
    return links.find((url) => {
      const lower = url.toLowerCase();
      return APPLY_HOSTS.some((host) => lower.includes(host)) ||
        /\/(?:careers?|jobs?|open-positions?|vacancies)(?:\/|\?|$)/i.test(url);
    }) || "";
  }

  function extractCompany(text) {
    const patterns = [
      /\b(?:company|client)\s*:\s*([A-Z][A-Za-z0-9&.' -]{1,60})/i,
      /\b(?:at|for)\s+([A-Z][A-Za-z0-9&.'-]*(?:\s+[A-Z][A-Za-z0-9&.'-]*){0,4})/
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (!match) continue;
      const company = match[1]
        .split(/\s*(?:\||\n|,|;|\.|\bis hiring\b|\bwe are\b|\blocation\b|\brole\b|\bposition\b)/i)[0]
        .trim();
      const looksLikeRoleOrLocation = JOB_TITLES.some((title) => title.toLowerCase() === company.toLowerCase()) ||
        LOCATIONS.some((location) => location.toLowerCase() === company.toLowerCase()) ||
        /\b(?:developer|engineer|analyst|joiner|candidate|opportunity|position|role)\b/i.test(company);
      if (company && company.length <= 60 && !looksLikeRoleOrLocation) return company;
    }
    return "";
  }

  function hashText(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function buildDedupeKey(lead) {
    if (lead.post_url) return `post:${lead.post_url.toLowerCase()}`;
    if (lead.email_id) return `email:${lead.email_id.toLowerCase()}`;
    if (lead.recruiter_profile_url && (lead.job_title || lead.company_name)) {
      return `recruiter:${[lead.recruiter_profile_url, lead.job_title, lead.company_name]
        .join("|").toLowerCase()}`;
    }
    const normalized = lead.full_post_text.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 300);
    return `text:${hashText(normalized)}`;
  }

  function buildMessageDraft(lead) {
    const experience = "I have 4.5 years of experience in Data Engineering with Python, PySpark, AWS Glue, Airflow, and cloud data pipelines. I am available as an Immediate Joiner and interested in this opportunity.";
    const closing = "Please let me know if my profile is suitable.";

    if (lead.recruiter_name && lead.job_title && lead.company_name) {
      return `Hi ${lead.recruiter_name},\n\nI came across your post for the ${lead.job_title} role at ${lead.company_name}.\n\n${experience}\n\n${closing}`;
    }
    if (lead.recruiter_name) {
      const title = lead.job_title || "Data Engineer";
      return `Hi ${lead.recruiter_name},\n\nI came across your post for a ${title} opportunity.\n\n${experience}\n\n${closing}`;
    }
    return `Hi,\n\nI came across your post for a Data Engineer opportunity.\n\n${experience}\n\n${closing}`;
  }

  function parsePost(rawPost) {
    const text = rawPost.full_post_text || "";
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/i);
    const phoneMatch = text.match(/(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b/);
    const jobTitle = JOB_TITLES.find((title) => new RegExp(`\\b${escapeRegExp(title)}\\b`, "i").test(text)) ||
      (/\bdata engineer\b/i.test(text) ? "Data Engineer" : "");
    const createdAt = rawPost.extracted_at || new Date().toISOString();

    const lead = {
      post_date: "",
      source_url: rawPost.source_url || "",
      post_url: rawPost.post_url || "",
      recruiter_name: rawPost.recruiter_name || "",
      recruiter_profile_url: rawPost.recruiter_profile_url || "",
      company_name: extractCompany(text),
      job_title: jobTitle,
      location: findTerms(text, LOCATIONS).join(", "),
      skills_mentioned: findTerms(text, SKILLS).join(", "),
      email_id: emailMatch ? emailMatch[0] : "",
      phone_number: phoneMatch ? phoneMatch[0] : "",
      apply_link: extractApplyLink(text, rawPost.visible_links || []),
      full_post_text: text,
      status: "New",
      score: window.ApplyPilotScorer.scoreLead(text),
      message_draft: "",
      dedupe_key: "",
      created_at: createdAt
    };
    lead.message_draft = buildMessageDraft(lead);
    lead.dedupe_key = buildDedupeKey(lead);
    return lead;
  }

  window.ApplyPilotParser = { parsePost, buildDedupeKey };
})();
