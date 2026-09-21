const API = '/api';
const sessionKey = 'afric-connect-token';

async function api(path, options = {}) {
  const token = localStorage.getItem(sessionKey);
  const response = await fetch(`${API}${path}`, { headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) }, ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Une erreur est survenue.');
  return data;
}
function notice(message, type = 'success') { let element = document.querySelector('.runtime-notice'); if (!element) { element = document.createElement('div'); element.className = 'runtime-notice'; document.body.appendChild(element); } element.className = `runtime-notice ${type}`; element.textContent = message; setTimeout(() => element.remove(), 4200); }
function storeSession(data) { localStorage.setItem(sessionKey, data.token); localStorage.setItem('afric-connect-user', JSON.stringify(data.user)); }
function currentUser() { try { return JSON.parse(localStorage.getItem('afric-connect-user')); } catch { return null; } }
function offerCard(offer) { return `<article class="offer-card"><div class="offer-top"><span class="offer-badge">${offer.urgency}</span><span class="text-link">${offer.category}</span></div><h3>${offer.title}</h3><div class="meta-list"><div class="meta-item"><span>Ville</span><strong>${offer.city}</strong></div><div class="meta-item"><span>Budget</span><strong>${offer.budgetLabel}</strong></div><div class="meta-item"><span>Échéance</span><strong>${offer.deadline}</strong></div></div><div class="offer-meta"><span class="offer-price">${offer.applicationsCount} candidature(s)</span><button class="btn btn-secondary apply-offer" data-id="${offer.id}">Postuler</button></div></article>`; }

async function loadOffers() { const target = document.querySelector('[data-live-offers]'); if (!target) return; try { const { offers } = await api('/offers'); target.innerHTML = offers.map(offerCard).join(''); target.addEventListener('click', async event => { const button = event.target.closest('.apply-offer'); if (!button) return; try { await api(`/offers/${button.dataset.id}/apply`, { method: 'POST', body: JSON.stringify({}) }); notice('Votre candidature a été envoyée.'); button.textContent = 'Candidature envoyée'; button.disabled = true; } catch (error) { notice(error.message, 'error'); } }); } catch (error) { notice(error.message, 'error'); } }

function wireAuth() { const login = document.querySelector('[data-login-form]'); const register = document.querySelector('[data-register-form]'); if (login) login.addEventListener('submit', async event => { event.preventDefault(); try { const data = await api('/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(login))) }); storeSession(data); location.href = 'dashboard-client.html'; } catch (error) { notice(error.message, 'error'); } }); if (register) register.addEventListener('submit', async event => { event.preventDefault(); try { const data = await api('/register', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(register))) }); storeSession(data); location.href = 'dashboard-client.html'; } catch (error) { notice(error.message, 'error'); } }); }
function wireDashboard() { const form = document.querySelector('[data-offer-form]'); const user = currentUser(); const name = document.querySelector('[data-user-name]'); if (name && user) name.textContent = user.name; if (!form) return; form.addEventListener('submit', async event => { event.preventDefault(); try { await api('/offers', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(form))) }); notice('Votre appel d’offre est publié et visible par les professionnels.'); form.reset(); } catch (error) { notice(error.message, 'error'); } }); }

document.addEventListener('DOMContentLoaded', () => { wireAuth(); wireDashboard(); loadOffers(); });
