document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Função utilitária para exibir modal
  function showModal(message) {
    const modal = document.getElementById("modal-message");
    const modalText = document.getElementById("modal-text");
    const modalClose = document.getElementById("modal-close");
    modalText.textContent = message;
    modal.classList.remove("hidden");
    // Fechar ao clicar no X
    modalClose.onclick = () => modal.classList.add("hidden");
    // Fechar ao clicar fora do conteúdo
    modal.onclick = (e) => {
      if (e.target === modal) modal.classList.add("hidden");
    };
    // Fechar automaticamente após 3s
    setTimeout(() => {
      modal.classList.add("hidden");
    }, 3000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Participantes formatados em lista
        let participantsList = '';
        if (details.participants.length > 0) {
          participantsList = `
            <div class="participants-section collapsed">
              <div class="participants-header">
                <strong>Participantes (${details.participants.length})</strong>
                <button class="toggle-participants" aria-label="Expandir/Recolher lista">
                  <span class="arrow">▼</span>
                </button>
              </div>
              <ul class="participants-list">
                ${details.participants.map(p => `
                  <li>
                    ${p}
                    <button class="delete-participant" data-activity="${name}" data-email="${p}" aria-label="Remover participante">
                      <span class="delete-icon">×</span>
                    </button>
                  </li>
                `).join('')}
              </ul>
            </div>
          `;
        } else {
          participantsList = `
            <div class="participants-section empty">
              <div class="participants-header">
                <strong>Participantes (0)</strong>
              </div>
              <span class="no-participants">Nenhum inscrito ainda</span>
            </div>
          `;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Agenda:</strong> ${details.schedule}</p>
          <p><strong>Disponibilidade:</strong> ${spotsLeft} vagas disponíveis</p>
          ${participantsList}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners for toggle buttons
      document.querySelectorAll('.toggle-participants').forEach(button => {
        button.addEventListener('click', (e) => {
          const section = e.target.closest('.participants-section');
          section.classList.toggle('collapsed');
          const arrow = button.querySelector('.arrow');
          arrow.textContent = section.classList.contains('collapsed') ? '▼' : '▲';
        });
      });

      // Add event listeners for delete buttons
      document.querySelectorAll('.delete-participant').forEach(button => {
        button.addEventListener('click', async (e) => {
          const activity = e.target.closest('button').dataset.activity;
          const email = e.target.closest('button').dataset.email;
          
          if (confirm(`Tem certeza que deseja remover ${email} da atividade?`)) {
            try {
              const response = await fetch(
                `/activities/${encodeURIComponent(activity)}/remove?email=${encodeURIComponent(email)}`,
                {
                  method: "POST",
                }
              );

              if (response.ok) {
                // Recarregar a lista de atividades
                fetchActivities();
                showModal("Participante removido com sucesso!");
              } else {
                const result = await response.json();
                showModal(result.detail || "Erro ao remover participante");
              }
            } catch (error) {
              console.error("Erro ao remover participante:", error);
              showModal("Falha ao remover participante. Por favor, tente novamente.");
            }
          }
        });
      });

    } catch (error) {
      activitiesList.innerHTML = "<p>Falha ao carregar atividades. Por favor, tente novamente mais tarde.</p>";
      console.error("Erro ao buscar atividades:", error);
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
      } else {
        messageDiv.textContent = result.detail || "Ocorreu um erro";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Falha na inscrição. Por favor, tente novamente.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Erro na inscrição:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
