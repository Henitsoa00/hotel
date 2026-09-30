const u = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=70`;

export const menuCategories = ["Entrées", "Plats", "Desserts", "Boissons"];

export const menu = [
  { id: 1, category: "Entrées", name: "Carpaccio de Saint-Jacques", description: "Agrumes, huile de yuzu, caviar d'Aquitaine", price: 24, image: u("photo-1546039907-7fa05f864c02") },
  { id: 2, category: "Entrées", name: "Velouté de châtaigne", description: "Éclats de noisette, crème fumée", price: 16, image: u("photo-1547592166-23ac45744acd") },
  { id: 3, category: "Entrées", name: "Tartare de bœuf", description: "Condiments maison, jaune d'œuf confit", price: 19, image: u("photo-1432139555190-58524dae6a55") },
  { id: 4, category: "Plats", name: "Filet de bar de ligne", description: "Beurre blanc, légumes glacés du potager", price: 38, image: u("photo-1519708227418-c8fd9a32b7a2") },
  { id: 5, category: "Plats", name: "Filet de bœuf Rossini", description: "Foie gras poêlé, jus truffé, pommes Anna", price: 46, image: u("photo-1558030006-450675393462") },
  { id: 6, category: "Plats", name: "Risotto aux cèpes", description: "Parmesan 24 mois, huile de truffe blanche", price: 32, image: u("photo-1476124369491-e7addf5db371") },
  { id: 7, category: "Desserts", name: "Soufflé au Grand Marnier", description: "Sorbet orange sanguine", price: 15, image: u("photo-1551024601-bec78aea704b") },
  { id: 8, category: "Desserts", name: "Tarte au chocolat grand cru", description: "Praliné, glace vanille de Madagascar", price: 14, image: u("photo-1606313564200-e75d5e30476c") },
  { id: 9, category: "Desserts", name: "Pavlova aux fruits rouges", description: "Meringue croustillante, crème légère", price: 13, image: u("photo-1488477181946-6428a0291777") },
  { id: 10, category: "Boissons", name: "Champagne Brut – coupe", description: "Sélection du sommelier", price: 18, image: u("photo-1547595628-c61a29f496f0") },
  { id: 11, category: "Boissons", name: "Cocktail Signature Aurèle", description: "Gin, sureau, champagne, citron", price: 17, image: u("photo-1514362545857-3bc16c4c7d1b") },
  { id: 12, category: "Boissons", name: "Jus pressé du jour", description: "Fruits de saison", price: 8, image: u("photo-1600271886742-f049cd451bba") },
];

export const openingHours = [
  { label: "Petit-déjeuner", hours: "07h00 – 10h30" },
  { label: "Déjeuner", hours: "12h00 – 14h30" },
  { label: "Dîner", hours: "19h00 – 22h30" },
  { label: "Bar", hours: "17h00 – 01h00" },
];

export const timeSlots = ["12:00", "12:30", "13:00", "13:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"];
