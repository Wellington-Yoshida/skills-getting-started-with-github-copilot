document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  let currentActivities = {};

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();
      currentActivities = activities;

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const participants = details.participants
          .map(
            (participant) => `
              <li class="participant-item">
                <span class="participant-email">${participant}</span>
                <button
                  type="button"
                  class="participant-remove-button"
                  data-activity="${name}"
                  data-participant="${participant}"
                  aria-label="Remove ${participant} from ${name}"
                  title="Remove participant"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M9 3.75a1.25 1.25 0 0 0-1.25 1.25V6H5.5a.75.75 0 0 0 0 1.5h.75l.75 10.2A2.25 2.25 0 0 0 9.24 20h5.52a2.25 2.25 0 0 0 2.24-2.3l.75-10.2h.75a.75.75 0 0 0 0-1.5h-2.25V5A1.25 1.25 0 0 0 15 3.75H9Zm1.25 1.25h3.5V6h-3.5V5ZM8.5 8.25a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm3.75.75a.75.75 0 0 0-1.5 0v7.5a.75.75 0 0 0 1.5 0V9Zm2.25-.75a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Z" />
                  </svg>
                </button>
              </li>
            `
          )
          .join("");

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <div class="participants-header">
              <span class="participants-label">Participants</span>
              <span class="participants-count">${details.participants.length}</span>
            </div>
            <ul class="participants-list">
              ${participants || '<li class="empty-participants">No participants yet</li>'}
            </ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  activitiesList.addEventListener("click", async (event) => {
    const removeButton = event.target.closest(".participant-remove-button");

    if (!removeButton) {
      return;
    }

    const { activity, participant } = removeButton.dataset;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants/${encodeURIComponent(participant)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        messageDiv.classList.remove("hidden");
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
      }

      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to remove participant. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error removing participant:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
