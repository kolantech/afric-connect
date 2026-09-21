const categoryData = [
  { icon: 'M', title: 'Maçonnerie', text: 'Briques, façades, murs, terrassement et gros œuvre.' },
  { icon: 'E', title: 'Électricité', text: 'Câblage, installations, tableaux et maintenance.' },
  { icon: 'R', title: 'Routes', text: 'Travaux de voirie, drainage, pavage et terrassement.' },
  { icon: 'A', title: 'Architecture', text: 'Études, plans, conception et supervision.' },
  { icon: 'F', title: 'Forage', text: 'Forages, pompes, équipements de captage et eau.' }
];

const offers = [
  { title: 'Construction maison villa', city: 'Abidjan', price: '18 500 000 FCFA', type: 'Bâtiment', deadline: '12 jours', urgency: 'Urgent' },
  { title: 'Rénovation de complex sportif', city: 'Dakar', price: '42 000 000 FCFA', type: 'Rénovation', deadline: '18 jours', urgency: 'Moyen' },
  { title: 'Aménagement route de desserte', city: 'Bamako', price: '56 000 000 FCFA', type: 'Route', deadline: '24 jours', urgency: 'Urgent' }
];

const pros = [
  { name: 'Moussa Diop', role: 'Chef de chantier', city: 'Abidjan', rating: 4.9, tasks: 122, badges: ['KYC Vérifié', 'Top Pro'] },
  { name: 'Awa Toure', role: 'Électricienne', city: 'Dakar', rating: 4.8, tasks: 96, badges: ['Pro Recommandé', 'Abonné Actif'] },
  { name: 'Koffi N’Guessan', role: 'Géomètre', city: 'Yamoussoukro', rating: 5.0, tasks: 87, badges: ['Top Pro', 'KYC Vérifié'] },
  { name: 'Mariam Sanogo', role: 'Architecte', city: 'Bamako', rating: 4.9, tasks: 148, badges: ['Pro Recommandé', 'Abonné Actif'] }
];

function renderCategories() {
  const target = document.getElementById('category-grid');
  if (!target) return;

  target.innerHTML = categoryData.map(item => `
    <article class="category-card">
      <div class="category-icon">${item.icon}</div>
      <h3>${item.title}</h3>
      <p>${item.text}</p>
    </article>
  `).join('');
}

function renderOffers() {
  const target = document.getElementById('featured-offers');
  if (!target) return;

  target.innerHTML = offers.map(item => `
    <article class="offer-card">
      <div class="offer-top">
        <span class="offer-badge">${item.urgency}</span>
        <span class="text-link">${item.type}</span>
      </div>
      <h3>${item.title}</h3>
      <div class="meta-list">
        <div class="meta-item"><span>Localisation</span><strong>${item.city}</strong></div>
        <div class="meta-item"><span>Échéance</span><strong>${item.deadline}</strong></div>
      </div>
      <div class="offer-meta">
        <span class="offer-price">${item.price}</span>
        <a href="dashboard-client.html" class="btn btn-secondary">Postuler</a>
      </div>
    </article>
  `).join('');
}

function renderPros() {
  const target = document.getElementById('featured-pros');
  if (!target) return;

  target.innerHTML = pros.map(item => `
    <article class="pro-card">
      <div class="pro-cover"></div>
      <div class="pro-body">
        <div class="pro-head">
          <h3>${item.name}</h3>
          <span class="badge">${item.city}</span>
        </div>
        <div class="badges">
          ${item.badges.map(b => `<span class="badge">${b}</span>`).join('')}
        </div>
        <p>${item.role}</p>
        <div class="rating">★ ${item.rating} <span>(${item.tasks} missions)</span></div>
        <div class="pro-footer">
          <strong>Tarif: 18 000 FCFA/j</strong>
          <a href="professionnels.html" class="btn btn-secondary">Voir profil</a>
        </div>
      </div>
    </article>
  `).join('');
}

renderCategories();
renderOffers();
renderPros();
