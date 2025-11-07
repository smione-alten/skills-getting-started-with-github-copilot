document.addEventListener('DOMContentLoaded', () => {
  const activitiesList = document.getElementById('activities-list');
  const activitySelect = document.getElementById('activity');
  const signupForm = document.getElementById('signup-form');
  const messageEl = document.getElementById('message');

  const showMessage = (text, type = 'info') => {
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    messageEl.classList.remove('hidden');
    clearTimeout(showMessage._t);
    showMessage._t = setTimeout(() => messageEl.classList.add('hidden'), 5000);
  };

  const escape = (s = '') =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  let activitiesData = {};

  const renderActivities = (data) => {
    activitiesList.innerHTML = '';
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

    Object.keys(data).forEach((name) => {
      const a = data[name];
      const currentCount = (a.participants && a.participants.length) || 0;
      const max = Number.isFinite(a.max_participants) ? a.max_participants : null;
      const spots = max !== null ? Math.max(0, max - currentCount) : null;

      const participantsHtml =
        a.participants && a.participants.length
          ? `<ul>${a.participants.map((p) => `<li>${escape(p)}</li>`).join('')}</ul>`
          : `<div class="empty">No participants yet.</div>`;

      const spotsHtml =
        spots === null
          ? ''
          : `<span class="spots-badge ${spots === 0 ? 'full' : ''}">${spots === 0 ? 'Full' : `${spots} spot${spots !== 1 ? 's' : ''} available`}</span>`;

      const cardHtml = `
        <div class="activity-card">
          <h4>
            ${escape(name)}
            <span class="participant-count">${currentCount}</span>
            ${spotsHtml}
          </h4>
          <p>${escape(a.description)}</p>
          <p><strong>Schedule:</strong> ${escape(a.schedule)}</p>
          <div class="participants">
            <h5>Participants</h5>
            ${participantsHtml}
          </div>
        </div>
      `;
      activitiesList.insertAdjacentHTML('beforeend', cardHtml);

      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      activitySelect.appendChild(opt);
    });
  };

  fetch('/activities')
    .then((res) => {
      if (!res.ok) throw new Error('Failed to load activities');
      return res.json();
    })
    .then((data) => {
      activitiesData = data;
      renderActivities(activitiesData);
    })
    .catch((err) => {
      activitiesList.innerHTML = `<p class="error">Could not load activities: ${escape(err.message)}</p>`;
    });

  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const activity = activitySelect.value;
    if (!email || !activity) {
      showMessage('Please enter your email and select an activity.', 'error');
      return;
    }

    showMessage('Signing up...', 'info');

    fetch(`/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`, {
      method: 'POST'
    })
      .then(async (res) => {
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(payload.detail || payload.message || 'Signup failed');
        }
        return payload;
      })
      .then((payload) => {
        // update local model and re-render
        if (!activitiesData[activity]) activitiesData[activity] = { participants: [] };
        activitiesData[activity].participants = activitiesData[activity].participants || [];
        activitiesData[activity].participants.push(email);
        renderActivities(activitiesData);
        signupForm.reset();
        showMessage(payload.message || 'Signed up successfully', 'success');
      })
      .catch((err) => {
        showMessage(err.message || 'Signup failed', 'error');
      });
  });
});
