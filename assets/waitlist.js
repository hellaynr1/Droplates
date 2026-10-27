// Droplates waitlist form.
// Validates the email, saves it to the waitlist endpoint, and shows loading, error and success states.

(function () {
  var form = document.getElementById("waitlist");
  var emailInput = document.getElementById("email");
  var honeypot = form.querySelector('input[name="website"]');
  var statusText = document.getElementById("form-status");
  var button = form.querySelector("button[type='submit']");
  var idleLabel = button.querySelector(".btn-idle");
  var busyLabel = button.querySelector(".btn-busy");
  var success = document.getElementById("success");

  // Deliberately simple: checks the shape of the address, not whether it exists.
  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setStatus(message, isError) {
    statusText.textContent = message;
    statusText.classList.toggle("is-error", Boolean(isError));
    emailInput.setAttribute("aria-invalid", isError ? "true" : "false");
  }

  function setBusy(isBusy) {
    button.disabled = isBusy;
    idleLabel.hidden = isBusy;
    busyLabel.hidden = !isBusy;
  }

  function showSuccess() {
    form.hidden = true;
    success.hidden = false;
    success.focus();
  }

  // Saves one address. Resolves when saved, or when the address is already on the list.
  // Rejects when the request fails.
  async function saveEmail(email) {
    var config = window.DROPLATES_CONFIG || {};

    if (!config.waitlistEndpoint) {
      // Not connected yet: show the success state, but nothing is stored.
      console.warn("Droplates: waitlistEndpoint is empty, so this signup was not saved.");
      await new Promise(function (resolve) { setTimeout(resolve, 600); });
      return;
    }

    var response = await fetch(config.waitlistEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": config.waitlistKey,
        "Authorization": "Bearer " + config.waitlistKey,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({ email: email, source: "landing" })
    });

    // 409 means the address is already on the list. Treat that as success.
    if (response.status === 409) return;
    if (!response.ok) throw new Error("Waitlist request failed with status " + response.status);
  }

  function trackSignup() {
    // Lightweight analytics hook. Works once a script such as Plausible is added.
    if (typeof window.plausible === "function") window.plausible("waitlist_signup");
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    // Bots tend to fill every field, so pretend it worked without saving anything.
    if (honeypot.value) return showSuccess();

    var email = emailInput.value.trim();

    if (!EMAIL_PATTERN.test(email)) {
      setStatus("Enter a valid email address, for example name@example.com.", true);
      emailInput.focus();
      return;
    }

    setStatus("", false);
    setBusy(true);

    try {
      await saveEmail(email);
      trackSignup();
      showSuccess();
    } catch (error) {
      console.error(error);
      setStatus("Something went wrong. Check your connection and try again.", true);
    } finally {
      setBusy(false);
    }
  });

  // Clear a validation error as soon as the reader starts correcting it.
  emailInput.addEventListener("input", function () {
    if (statusText.classList.contains("is-error")) setStatus("", false);
  });
})();
