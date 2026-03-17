export type TreasureStep = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  hint: string;
  description: string;
  validationCode: string;
};

export const huntConfig = {
  brandName: "Archives Concept Store",
  logo: {
    src: "/brand/archives-logo.png",
    alt: "Logo Archives Concept Store"
  },
  cityLabel: "Rennes",
  title: "Archives Treasures Hunt",
  subtitle:
    "Commencez a la boutique, suivez la route, trouvez les boites et entrez le bon code pour ouvrir l'etape suivante.",
  intro:
    "Progression partagee en direct entre tous les participants. Une fois une boite trouvee, l'etape suivante s'ouvre pour tout le monde.",
  startButtonLabel: "Voir l'etape active",
  codeInputLabel: "Code a 4 chiffres",
  codeInputPlaceholder: "0000",
  codeHelperText: "Entrez le code trouve sur place.",
  codeErrorMessage: "Code incorrect. Verifiez la boite et ressayez.",
  validateButtonLabel: "Valider le code",
  successTitle: "Boite trouvee",
  successMessage:
    "Felicitations ta trouver la boite, mot de passe a dire au vendeur : Enzo est trop beau avec ca chevelure. PS : Prendre un screen et ramene la boite avec toi.",
  finalMessage:
    "Toutes les etapes sont validees. Faites votre capture d'ecran et revenez chez Archives Concept Store avec la boite.",
  finalCode: "Enzo est trop beau avec ca chevelure",
  finalRewardHint: "Montrez ce message au vendeur et venez avec la boite.",
  center: {
    lat: 48.10964,
    lng: -1.680148
  }
};

export const treasureSteps: TreasureStep[] = [
  {
    id: "archives-store-start",
    name: "Archives Concept Store",
    address: "11 rue Victor Hugo, 35000 Rennes",
    lat: 48.10964,
    lng: -1.680148,
    hint:
      "Le depart se fait a la boutique. Trouvez la premiere boite ou le premier indice avant de prendre la route.",
    description:
      "Point de depart officiel. La chasse s'ouvre ici avant de se deplacer dans Rennes.",
    validationCode: "2002"
  },
  {
    id: "parlement",
    name: "Parlement de Bretagne",
    address: "Place du Parlement de Bretagne, Rennes",
    lat: 48.111338,
    lng: -1.67749,
    hint:
      "L'endroit ou la pierre classique rencontre le rythme de la ville. Cherchez la facade qui impose le silence.",
    description:
      "Une etape monumentale au coeur de Rennes, entre heritage, lignes nettes et details caches.",
    validationCode: "1204"
  },
  {
    id: "opera",
    name: "Opera de Rennes",
    address: "Place de la Mairie, Rennes",
    lat: 48.10995,
    lng: -1.677792,
    hint:
      "Face a la mairie, une courbe parfaite regarde la place. Le prochain indice se cache dans cette geometrie.",
    description:
      "Une halte au centre de la ville, la ou la facade ronde devient un point de reperage.",
    validationCode: "2841"
  },
  {
    id: "thabor",
    name: "Parc du Thabor",
    address: "Place Saint-Melaine, Rennes",
    lat: 48.11458,
    lng: -1.66795,
    hint:
      "Traversez un jardin calme. La suite attend la ou Rennes respire entre pierre, eau et allees dessinees.",
    description:
      "Une respiration dans le parcours, plus calme, plus cachee, avant le dernier mouvement.",
    validationCode: "4632"
  },
  {
    id: "place-des-lices",
    name: "Place des Lices",
    address: "Place des Lices, Rennes",
    lat: 48.11287,
    lng: -1.68443,
    hint:
      "Finissez entre les lignes ouvertes de la place. Cherchez la derniere boite la ou le centre s'elargit.",
    description:
      "Derniere etape hors boutique. Une fois validee, le message final peut etre montre en magasin.",
    validationCode: "9175"
  }
];
