(async function () {
  "use strict";

  if (window.photoDeleter?.running) {
    console.warn("Already running. Use photoDeleter.stop() first.");
    return;
  }

  const CONFIG = {
    timeout: 30000,
    selectionTimeout: 10000,
    batchSize: 100,
    batchDelay: 1500,
    checkbox: '.ckGgle[role="checkbox"]',
    deleteButton: 'button[aria-label="Move to bin"]',
    confirmationText: "Move to bin",
  };

  const state = {
    running: true,
    stopped: false,
    submitted: 0,
    stop() {
      this.stopped = true;
      console.log("Stop requested.");
    },
  };

  window.photoDeleter = state;

  const sleep = ms =>
    new Promise(resolve => setTimeout(resolve, ms));

  const visible = element =>
    element.isConnected && element.getClientRects().length > 0;

  const enabled = element =>
    !element.disabled &&
    element.getAttribute("aria-disabled") !== "true";

  function boxes(checked) {
    return Array.from(document.querySelectorAll(CONFIG.checkbox))
      .filter(element =>
        visible(element) &&
        enabled(element) &&
        element.getAttribute("aria-checked") === String(checked)
      );
  }

  async function waitUntil(condition, description, timeout = CONFIG.timeout) {
    const deadline = Date.now() + timeout;

    while (Date.now() < deadline) {
      if (state.stopped) throw new Error("Stopped by user.");
      const result = condition();
      if (result) return result;
      await sleep(200);
    }

    throw new Error("Timed out waiting for " + description + ".");
  }

  function confirmationButton() {
    const dialogues = Array.from(
      document.querySelectorAll('[role="dialog"], [role="alertdialog"]')
    ).filter(visible);

    for (const dialogue of dialogues) {
      const button = Array.from(
        dialogue.querySelectorAll('button, [role="button"]')
      ).find(element =>
        visible(element) &&
        enabled(element) &&
        (
          element.textContent.trim() === CONFIG.confirmationText ||
          element.getAttribute("aria-label") === CONFIG.confirmationText
        )
      );

      if (button) return button;
    }

    return null;
  }

  async function selectOne() {
    if (state.stopped) throw new Error("Stopped by user.");

    // Always get a fresh unchecked element. Do not scroll during selection.
    const box = boxes(false)[0];
    if (!box) return false;

    const label = box.getAttribute("aria-label");
    box.click();

    await waitUntil(
      () => {
        // Prefer the exact element that was clicked.
        if (box.isConnected) {
          return box.getAttribute("aria-checked") === "true";
        }

        // If the page replaced it, accept a unique checked replacement.
        if (!label) return false;

        const matches = Array.from(
          document.querySelectorAll(CONFIG.checkbox)
        ).filter(element =>
          element.getAttribute("aria-label") === label
        );

        return (
          matches.length === 1 &&
          matches[0].getAttribute("aria-checked") === "true"
        );
      },
      "the clicked photo to become selected",
      CONFIG.selectionTimeout
    );

    await sleep(300);
    return true;
  }

  try {
    if (boxes(true).length) {
      throw new Error("Click Clear selection before starting.");
    }

    if (confirmationButton()) {
      throw new Error("Close the existing confirmation dialogue first.");
    }

    console.log("Photo binning started. To stop: photoDeleter.stop()");

    while (!state.stopped) {
      await waitUntil(
        () => boxes(false).length > 0,
        "selectable photos"
      );

      const target = Math.min(CONFIG.batchSize, boxes(false).length);

      for (let i = 0; i < target; i++) {
        if (!(await selectOne())) break;
      }

      const selected = boxes(true);
      if (!selected.length) {
        throw new Error("No selected photos could be confirmed.");
      }

      const deleteButton = await waitUntil(
        () => Array.from(
          document.querySelectorAll(CONFIG.deleteButton)
        ).find(element => visible(element) && enabled(element)),
        'the main "Move to bin" button'
      );

      if (state.stopped) throw new Error("Stopped by user.");
      deleteButton.click();

      const confirmButton = await waitUntil(
        confirmationButton,
        'the confirmation "Move to bin" button'
      );

      if (state.stopped) throw new Error("Stopped by user.");
      confirmButton.click();

      state.submitted += selected.length;

      await waitUntil(
        () => selected.every(element => !element.isConnected),
        "the selected thumbnails to leave the page"
      );

      await waitUntil(
        () => !confirmationButton(),
        "the confirmation dialogue to close"
      );

      console.log(
        "Batch submitted: " + selected.length + ". " +
        "Total submitted to the bin: " + state.submitted + "."
      );

      await sleep(CONFIG.batchDelay);
    }
  } catch (error) {
    console.warn(error.message + " Script stopped.");
    console.log(
      "Check the page and clear any remaining selection before " +
      "restarting. A timeout does not prove the library is empty."
    );
  } finally {
    state.running = false;
    console.log(
      "Finished. Items submitted to the bin this run: " +
      state.submitted + "."
    );
  }
})();
