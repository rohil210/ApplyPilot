(() => {
  function contains(text, phrase) {
    return text.toLowerCase().includes(phrase.toLowerCase());
  }

  function scoreLead(text) {
    let score = 0;
    const hasDataEngineer = /\bdata engineer(?:ing)?\b/i.test(text);

    if (hasDataEngineer) score += 3;

    ["AWS Glue", "PySpark", "Snowflake", "Databricks", "Airflow"].forEach((skill) => {
      if (contains(text, skill)) score += 2;
    });

    if (/\bimmediate (?:joiner|joining)\b/i.test(text)) score += 2;

    ["Gurgaon", "Gurugram", "Noida", "Delhi NCR", "Remote", "Remote India"].forEach((location) => {
      if (contains(text, location)) score += 1;
    });

    ["Bangalore", "Pune", "Hyderabad"].forEach((location) => {
      if (contains(text, location)) score += 1;
    });

    const unrelatedRole = /\b(?:business analyst|java developer|devops|qa|ui developer)\b/i.test(text) ||
      (/\bdata analyst\b/i.test(text) && !hasDataEngineer);
    if (unrelatedRole && !hasDataEngineer) score -= 3;

    return score;
  }

  window.ApplyPilotScorer = { scoreLead };
})();
