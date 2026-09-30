const u = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=75`;

export const rooms = [
  {
    id: 1, slug: "chambre-classique", name: "Chambre Classique", category: "Chambre", price: 150, capacity: 2, size: 26, bed: "Queen Size", available: true,
    images: [u("photo-1631049307264-da0ec9d70304"), u("photo-1618773928121-c32242e63f39"), u("photo-1584132967334-10e028bd69f7")],
    amenities: ["Wi-Fi", "Climatisation", "Télévision", "Coffre-fort"],
    description: "Une chambre raffinée aux tons ivoire, pensée pour un séjour serein en plein cœur de la ville. Literie haut de gamme, salle de bain en marbre et lumière douce.",
    bookedRanges: [],
  },
  {
    id: 2, slug: "chambre-deluxe", name: "Chambre Deluxe", category: "Chambre", price: 190, capacity: 2, size: 32, bed: "King Size", available: true,
    images: [u("photo-1590490360182-c33d57733427"), u("photo-1566665797739-1674de7a421a"), u("photo-1552321554-5fefe8c9ef14")],
    amenities: ["Wi-Fi", "Climatisation", "Vue jardin", "Mini-bar", "Machine Nespresso"],
    description: "Spacieuse et lumineuse, la Chambre Deluxe s'ouvre sur nos jardins intérieurs. Un lit King Size, un coin lecture et une salle de bain avec douche à l'italienne.",
    bookedRanges: [["2026-07-10", "2026-07-20"]],
  },
  {
    id: 3, slug: "chambre-superieure", name: "Chambre Supérieure Famille", category: "Chambre", price: 230, capacity: 4, size: 38, bed: "King Size + 2 lits simples", available: true,
    images: [u("photo-1596394516093-501ba68a0ba6"), u("photo-1595576508898-0ad5c879a061"), u("photo-1507652313519-d4e9174996dd")],
    amenities: ["Wi-Fi", "Climatisation", "Mini-bar", "Baignoire", "Télévision"],
    description: "Idéale pour les familles, cette chambre combine confort et praticité avec un espace nuit parental et deux lits simples pour les enfants.",
    bookedRanges: [],
  },
  {
    id: 4, slug: "suite-junior", name: "Suite Junior", category: "Suite", price: 280, capacity: 3, size: 48, bed: "King Size", available: true,
    images: [u("photo-1582719478250-c89cae4dc85b"), u("photo-1578683010236-d716f9a3f461"), u("photo-1600210492486-724fe5c67fb0")],
    amenities: ["Wi-Fi", "Climatisation", "Salon", "Balcon", "Mini-bar", "Baignoire"],
    description: "Une suite élégante avec salon séparé et balcon privatif. L'adresse parfaite pour prolonger les soirées face aux toits de la ville.",
    bookedRanges: [["2026-08-01", "2026-08-15"]],
  },
  {
    id: 5, slug: "suite-executive", name: "Suite Executive", category: "Suite", price: 360, capacity: 3, size: 62, bed: "King Size", available: false,
    images: [u("photo-1611892440504-42a792e24d32"), u("photo-1591088398332-8a7791972843"), u("photo-1560185893-a55cbc8c57e8")],
    amenities: ["Wi-Fi", "Climatisation", "Salon", "Bureau", "Vue panoramique", "Accès lounge"],
    description: "Pensée pour les voyageurs d'affaires exigeants : bureau dédié, accès au lounge exécutif et vue dégagée sur l'horizon.",
    bookedRanges: [],
  },
  {
    id: 6, slug: "suite-presidentielle", name: "Suite Présidentielle", category: "Premium", price: 890, capacity: 4, size: 90, bed: "King Size", available: true,
    images: [u("photo-1618773928121-c32242e63f39"), u("photo-1629140727571-9b5c6f6267b4"), u("photo-1600566753086-00f18fb6b3ea")],
    amenities: ["Wi-Fi", "Climatisation", "Salon privé", "Terrasse", "Vue panoramique", "Majordome", "Jacuzzi"],
    description: "Le sommet de l'hospitalité Maison Aurèle. 90 m² de pur raffinement, terrasse privée, jacuzzi et service de majordome 24h/24.",
    bookedRanges: [["2026-12-20", "2027-01-03"]],
  },
  {
    id: 7, slug: "penthouse", name: "Penthouse Aurèle", category: "Premium", price: 1200, capacity: 4, size: 120, bed: "2 × King Size", available: true,
    images: [u("photo-1600607687939-ce8a6c25118c"), u("photo-1600585154340-be6161a56a0c"), u("photo-1600566753190-17f0baa2a6c3")],
    amenities: ["Wi-Fi", "Climatisation", "Terrasse", "Vue panoramique", "Majordome", "Piscine privée", "Cuisine"],
    description: "Au dernier étage, le Penthouse offre deux chambres, une piscine privée à débordement et une vue à 360° sur la ville.",
    bookedRanges: [],
  },
];

export const allAmenities = ["Wi-Fi", "Climatisation", "Balcon", "Terrasse", "Vue panoramique", "Salon", "Mini-bar", "Baignoire", "Majordome"];

export const includedServices = ["Petit-déjeuner buffet", "Accès spa & piscine", "Salle de fitness 24h/24", "Conciergerie", "Service en chambre", "Wi-Fi haut débit"];

export const bookingPolicy = [
  "Arrivée à partir de 15h00, départ avant 12h00",
  "Annulation gratuite jusqu'à 48h avant l'arrivée",
  "Taxes de 10 % incluses dans le total",
  "Animaux acceptés sur demande",
];
