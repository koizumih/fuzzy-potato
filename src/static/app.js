document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      // request fresh data to ensure the UI always reflects the latest state
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // reset dropdown to avoid accumulating duplicate options
      activitySelect.innerHTML =
        '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // build participants section with remove icon
        let participantsMarkup = "";
        if (details.participants && details.participants.length > 0) {
          participantsMarkup = `<p><strong>Participants:</strong></p>
            <ul class=\"participants-list\">`;
          details.participants.forEach((email) => {
            participantsMarkup += `<li>
              ${email} <span class=\"remove-participant\" data-activity=\"${name}\" data-email=\"${email}\">✖</span>
            </li>`;
          });
          participantsMarkup += `</ul>`;
        } else {
          participantsMarkup = `<p class=\"no-participants\">No participants yet.</p>`;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsMarkup}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // after rendering all cards, wire up remove handlers
      attachRemovalHandlers();
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
        // update the activities list so participants section reflects the new signup
        fetchActivities();
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

  // helper to attach click handlers to removal icons
  function attachRemovalHandlers() {
    document.querySelectorAll('.remove-participant').forEach((span) => {
      span.addEventListener('click', async () => {
        const activity = span.dataset.activity;
        const email = span.dataset.email;
        try {
          const response = await fetch(
            `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
            { method: 'DELETE' }
          );
          const result = await response.json();
          if (response.ok) {
            messageDiv.textContent = result.message;
            messageDiv.className = 'success';
            fetchActivities();
          } else {
            messageDiv.textContent = result.detail || 'An error occurred';
            messageDiv.className = 'error';
          }
          messageDiv.classList.remove('hidden');
          setTimeout(() => messageDiv.classList.add('hidden'), 5000);
        } catch (err) {
          messageDiv.textContent = 'Failed to remove participant.';
          messageDiv.className = 'error';
          messageDiv.classList.remove('hidden');
          console.error(err);
        }
      });
    });
  }

  // Initialize app
  fetchActivities();
