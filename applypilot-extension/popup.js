(() => {
  const elements = {
    extractButton: document.getElementById("extractButton"),
    downloadButton: document.getElementById("downloadButton"),
    clearButton: document.getElementById("clearButton"),
    message: document.getElementById("message"),
    visibleCount: document.getElementById("visibleCount"),
    validCount: document.getElementById("validCount"),
    duplicateCount: document.getElementById("duplicateCount"),
    storedCount: document.getElementById("storedCount"),
    previewCaption: document.getElementById("previewCaption"),
    leadRows: document.getElementById("leadRows"),
    emptyState: document.getElementById("emptyState")
  };

  function showMessage(text = "", type = "") {
    elements.message.textContent = text;
    elements.message.className = `message ${type}`.trim();
  }

  function setBusy(isBusy) {
    elements.extractButton.disabled = isBusy;
    elements.extractButton.textContent = isBusy ? "Extracting..." : "Extract Visible Leads";
  }

  function addCell(row, value, title = value) {
    const cell = document.createElement("td");
    cell.textContent = value === "" || value == null ? "-" : String(value);
    if (title) cell.title = String(title);
    row.appendChild(cell);
  }

  function renderLeads(leads) {
    elements.leadRows.replaceChildren();
    elements.emptyState.hidden = leads.length > 0;
    elements.storedCount.textContent = String(leads.length);
    elements.previewCaption.textContent = `${leads.length} stored locally`;

    leads.slice(0, 50).forEach((lead) => {
      const row = document.createElement("tr");
      addCell(row, lead.score);
      addCell(row, lead.recruiter_name);
      addCell(row, lead.company_name);
      addCell(row, lead.job_title);
      addCell(row, lead.location);
      addCell(row, lead.skills_mentioned);
      addCell(row, lead.email_id);
      addCell(row, lead.phone_number);
      addCell(row, lead.status);
      elements.leadRows.appendChild(row);
    });
  }

  async function activeLinkedInTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !/^https:\/\/www\.linkedin\.com\//i.test(tab.url || "")) {
      throw new Error("Please open LinkedIn first");
    }
    return tab;
  }

  function requestExtraction(tabId) {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, { type: "APPLYPILOT_EXTRACT_VISIBLE" }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error("Refresh LinkedIn and try again"));
          return;
        }
        if (!response?.ok) {
          reject(new Error(response?.error || "Refresh LinkedIn and try again"));
          return;
        }
        resolve(response);
      });
    });
  }

  async function extract() {
    setBusy(true);
    showMessage();
    try {
      const tab = await activeLinkedInTab();
      const response = await requestExtraction(tab.id);
      elements.visibleCount.textContent = String(response.visibleCount);

      if (!response.posts.length) {
        elements.validCount.textContent = "0";
        elements.duplicateCount.textContent = "0";
        showMessage("No visible job posts found", "error");
        return;
      }

      const parsedLeads = response.posts.map(window.ApplyPilotParser.parsePost);
      const result = await window.ApplyPilotStorage.importLeads(parsedLeads);
      elements.validCount.textContent = String(parsedLeads.length);
      elements.duplicateCount.textContent = String(result.duplicatesSkipped);
      renderLeads(result.allLeads);
      showMessage(
        result.accepted.length ? `Saved ${result.accepted.length} new lead${result.accepted.length === 1 ? "" : "s"}.` : "All visible leads were already stored.",
        "success"
      );
    } catch (error) {
      showMessage(error.message || "Refresh LinkedIn and try again", "error");
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    try {
      const leads = await window.ApplyPilotStorage.getLeads();
      if (!window.ApplyPilotCsv.exportLeads(leads)) {
        showMessage("No stored leads to download", "error");
        return;
      }
      showMessage("CSV download started.", "success");
    } catch (_) {
      showMessage("Could not download stored leads", "error");
    }
  }

  async function clear() {
    try {
      await window.ApplyPilotStorage.clearLeads();
      elements.visibleCount.textContent = "0";
      elements.validCount.textContent = "0";
      elements.duplicateCount.textContent = "0";
      renderLeads([]);
      showMessage("Stored leads cleared.", "success");
    } catch (_) {
      showMessage("Could not clear stored leads", "error");
    }
  }

  elements.extractButton.addEventListener("click", extract);
  elements.downloadButton.addEventListener("click", download);
  elements.clearButton.addEventListener("click", clear);

  window.ApplyPilotStorage.getLeads()
    .then(renderLeads)
    .catch(() => showMessage("Could not read local storage", "error"));
})();
