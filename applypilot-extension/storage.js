(() => {
  const STORAGE_KEY = "applypilot_leads";

  async function getLeads() {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : [];
  }

  async function importLeads(newLeads) {
    const storedLeads = await getLeads();
    const knownKeys = new Set(storedLeads.map((lead) => lead.dedupe_key).filter(Boolean));
    const accepted = [];
    let duplicatesSkipped = 0;

    for (const lead of newLeads) {
      if (knownKeys.has(lead.dedupe_key)) {
        duplicatesSkipped += 1;
        continue;
      }
      knownKeys.add(lead.dedupe_key);
      accepted.push(lead);
    }

    const allLeads = [...accepted, ...storedLeads];
    await chrome.storage.local.set({ [STORAGE_KEY]: allLeads });
    return { accepted, duplicatesSkipped, allLeads };
  }

  async function clearLeads() {
    await chrome.storage.local.remove(STORAGE_KEY);
  }

  window.ApplyPilotStorage = { getLeads, importLeads, clearLeads };
})();
