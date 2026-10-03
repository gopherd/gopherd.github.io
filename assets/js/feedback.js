(() => {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const numberParam = (name) => {
    const value = parseInt(params.get(name), 10);
    return value && !Number.isNaN(value) ? value : null;
  };
  const appID = numberParam("app");
  const slug = params.get("slug");
  const form = document.getElementById("feedback-form");
  const content = document.getElementById("feedback-content");
  const email = document.getElementById("feedback-email");
  const count = document.getElementById("feedback-count");
  const button = document.getElementById("feedback-submit");
  const error = document.getElementById("feedback-error");
  const success = document.getElementById("feedback-success");
  let submitting = false;

  const clearError = () => {
    error.hidden = true;
    error.textContent = "";
    content.removeAttribute("aria-invalid");
    email.removeAttribute("aria-invalid");
  };
  const showError = (message, field) => {
    error.textContent = message;
    error.hidden = false;
    if (field) {
      field.setAttribute("aria-invalid", "true");
      field.focus();
    }
  };
  content.addEventListener("input", () => {
    count.textContent = `${content.value.length} / 500`;
    count.classList.toggle("near-limit", content.value.length >= 450);
    clearError();
  });
  email.addEventListener("input", clearError);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submitting) return;
    clearError();
    if (!appID && !slug) {
      showError("Please open this feedback page from your app so we can identify it.");
      return;
    }
    if (!content.value.trim()) {
      showError("Please enter your feedback.", content);
      return;
    }
    const trimmedEmail = email.value.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      showError("Please enter a valid email address.", email);
      return;
    }
    const payload = { appID: appID || 0, content: content.value.trim() };
    const optional = {
      slug,
      storeType: params.get("store"),
      userID: numberParam("uid"),
      email: trimmedEmail,
      osVersion: params.get("os") || params.get("osVersion"),
      appVersion: params.get("ver") || params.get("appver") || params.get("appVersion"),
      deviceModel: params.get("device") || params.get("model") || params.get("deviceModel"),
    };
    Object.entries(optional).forEach(([key, value]) => {
      if (value) payload[key] = value;
    });
    submitting = true;
    content.disabled = email.disabled = button.disabled = true;
    button.textContent = "Submitting…";
    form.setAttribute("aria-busy", "true");
    try {
      const response = await fetch("https://api.zeroplay.io/v1/developer/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      form.reset();
      count.textContent = "0 / 500";
      document.getElementById("feedback-fields").hidden = true;
      success.hidden = false;
      success.focus();
    } catch {
      showError("Failed to submit feedback. Please try again later.");
    } finally {
      submitting = false;
      content.disabled = email.disabled = button.disabled = false;
      button.textContent = "Submit feedback";
      form.removeAttribute("aria-busy");
    }
  });
})();
