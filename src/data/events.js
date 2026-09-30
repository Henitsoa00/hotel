const u = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&q=70`;

export const eventTypes = [
  { id: 1, title: "Mariages", description: "Une célébration sur mesure, du cocktail au dîner de gala, orchestrée par notre wedding planner.", capacity: 250, size: 420, equipment: ["Piste de danse", "Éclairage d'ambiance", "Traiteur étoilé"], image: u("photo-1519741497674-611481863552") },
  { id: 2, title: "Séminaires", description: "Des journées de travail productives avec hébergement, pauses gourmandes et activités team-building.", capacity: 80, size: 150, equipment: ["Vidéoprojecteur 4K", "Wi-Fi dédié", "Paperboards"], image: u("photo-1517457373958-b7bdd4587205") },
  { id: 3, title: "Conférences", description: "Un auditorium équipé pour vos lancements, keynotes et assemblées générales.", capacity: 180, size: 300, equipment: ["Sonorisation", "Régie technique", "Captation vidéo"], image: u("photo-1540575467063-178a50c2df87") },
  { id: 4, title: "Réunions", description: "Des salons intimistes pour vos comités de direction et rendez-vous confidentiels.", capacity: 16, size: 45, equipment: ["Écran connecté", "Visioconférence", "Service café"], image: u("photo-1497366216548-37526070297c") },
  { id: 5, title: "Anniversaires", description: "Célébrez une date importante dans un cadre élégant avec menu et décoration personnalisés.", capacity: 60, size: 120, equipment: ["Décoration florale", "DJ sur demande", "Gâteau signature"], image: u("photo-1530103862676-de8c9debad1d") },
  { id: 6, title: "Événements privés", description: "Dîners de gala, lancements de produits ou soirées exclusives en toute discrétion.", capacity: 120, size: 200, equipment: ["Privatisation", "Mixologue", "Voiturier"], image: u("photo-1511795409834-ef04bbd61622") },
];

export const spaces = [
  { name: "Grande Salle Aurèle", capacity: 250, size: 420, image: u("photo-1464366400600-7168b8af9bc3") },
  { name: "Salle de conférence", capacity: 180, size: 300, image: u("photo-1505373877841-8d25f7d46678") },
  { name: "Salon privé", capacity: 30, size: 60, image: u("photo-1600210491892-03d54c0aaf87") },
  { name: "Terrasse panoramique", capacity: 150, size: 280, image: u("photo-1519167758481-83f550bb49b3") },
];
