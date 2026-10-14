export type Category = "Audio" | "Workspace" | "Everyday";
export interface Product {
  id: number;
  name: string;
  brand: string;
  category: Category;
  kind: string;
  price: number;
  original?: number;
  rating: number;
  reviews: number;
  description: string;
  badge?: string;
  color: string;
  specs: Record<string, string>;
  tags: string[];
  stock: number;
}
export const products: Product[] = [
  {
    id: 101,
    name: "AirPods Max",
    brand: "Apple",
    category: "Audio",
    kind: "Headphones",
    price: 44900,
    original: 54900,
    rating: 4.7,
    reviews: 1284,
    description:
      "A little less world. A lot more music. Over-ear listening with a beautifully considered fit.",
    badge: "The listening edit",
    color: "Silver",
    specs: {
      Style: "Over-ear",
      Battery: "20 hours",
      "Noise cancellation": "Active",
      Connection: "Bluetooth",
      Weight: "385 g",
    },
    tags: ["music", "travel", "focus", "noise cancelling", "headphones"],
    stock: 12,
  },
  {
    id: 100,
    name: "AirPods",
    brand: "Apple",
    category: "Audio",
    kind: "Headphones",
    price: 12900,
    rating: 4.6,
    reviews: 862,
    description:
      "Your everyday soundtrack, without the wires. Light, familiar, and ready when you are.",
    color: "White",
    specs: {
      Style: "In-ear",
      Battery: "5 hours",
      "Noise cancellation": "No",
      Connection: "Bluetooth",
      Weight: "8 g",
    },
    tags: ["music", "travel", "lightweight", "earbuds", "headphones"],
    stock: 24,
  },
  {
    id: 107,
    name: "Beats Flex",
    brand: "Beats",
    category: "Audio",
    kind: "Headphones",
    price: 4999,
    original: 6999,
    rating: 4.4,
    reviews: 631,
    description:
      "Easy listening for the everyday commute. A flexible neckband keeps your earbuds close.",
    badge: "Small price, big sound",
    color: "Black",
    specs: {
      Style: "Neckband",
      Battery: "12 hours",
      "Noise cancellation": "No",
      Connection: "Bluetooth",
      Weight: "18.6 g",
    },
    tags: ["budget", "commute", "music", "headphones"],
    stock: 18,
  },
  {
    id: 103,
    name: "HomePod mini",
    brand: "Apple",
    category: "Audio",
    kind: "Speakers",
    price: 9900,
    rating: 4.5,
    reviews: 428,
    description:
      "Room-filling sound from a surprisingly small speaker. Make a little space for good music.",
    color: "Space gray",
    specs: {
      Style: "Home speaker",
      Power: "Mains",
      Connection: "Wi-Fi",
      "Voice assistant": "Siri",
    },
    tags: ["home", "speaker", "music", "desk"],
    stock: 15,
  },
  {
    id: 78,
    name: "MacBook Pro 14″",
    brand: "Apple",
    category: "Workspace",
    kind: "Laptops",
    price: 159900,
    original: 179900,
    rating: 4.8,
    reviews: 376,
    description:
      "A focused workspace, wherever you open it. A brilliant display and power for your next idea.",
    badge: "Work, beautifully",
    color: "Space gray",
    specs: {
      Display: "14 inches",
      Memory: "16 GB",
      Storage: "512 GB",
      Platform: "macOS",
    },
    tags: ["work", "creative", "laptop", "coding"],
    stock: 8,
  },
  {
    id: 79,
    name: "Zenbook Pro Duo",
    brand: "Asus",
    category: "Workspace",
    kind: "Laptops",
    price: 149900,
    rating: 4.5,
    reviews: 218,
    description:
      "Give your ideas a second screen. More room for the tools you reach for every day.",
    color: "Blue",
    specs: {
      Display: "15.6 inches",
      Memory: "16 GB",
      Storage: "1 TB",
      Platform: "Windows",
    },
    tags: ["work", "creative", "laptop", "dual screen"],
    stock: 6,
  },
  {
    id: 82,
    name: "XPS 13",
    brand: "Dell",
    category: "Workspace",
    kind: "Laptops",
    price: 109900,
    original: 129900,
    rating: 4.6,
    reviews: 309,
    description:
      "A compact companion for a productive day. An easy fit for your desk, bag, and next destination.",
    color: "Silver",
    specs: {
      Display: "13.4 inches",
      Memory: "16 GB",
      Storage: "512 GB",
      Platform: "Windows",
    },
    tags: ["work", "travel", "laptop", "coding"],
    stock: 10,
  },
  {
    id: 80,
    name: "MateBook X Pro",
    brand: "Huawei",
    category: "Workspace",
    kind: "Laptops",
    price: 119900,
    rating: 4.5,
    reviews: 183,
    description:
      "A generous view in a slim silhouette. Built for the work that moves with you.",
    color: "Space gray",
    specs: {
      Display: "13.9 inches",
      Memory: "16 GB",
      Storage: "512 GB",
      Platform: "Windows",
    },
    tags: ["work", "travel", "laptop"],
    stock: 7,
  },
  {
    id: 99,
    name: "Echo Plus",
    brand: "Amazon",
    category: "Everyday",
    kind: "Speakers",
    price: 8999,
    original: 11999,
    rating: 4.4,
    reviews: 724,
    description:
      "A helping hand, a favorite playlist, a more connected home. One small addition to your day.",
    color: "Charcoal",
    specs: {
      Style: "Home speaker",
      Power: "Mains",
      Connection: "Wi-Fi",
      "Voice assistant": "Alexa",
    },
    tags: ["home", "speaker", "music", "smart home"],
    stock: 20,
  },
  {
    id: 104,
    name: "USB power adapter",
    brand: "Apple",
    category: "Everyday",
    kind: "Accessories",
    price: 1900,
    rating: 4.5,
    reviews: 412,
    description:
      "A dependable little essential. Keep one at your desk so you are always ready to recharge.",
    color: "White",
    specs: { Type: "Wall adapter", Connection: "USB", Use: "Charging" },
    tags: ["charger", "desk", "budget", "travel"],
    stock: 35,
  },
  {
    id: 105,
    name: "MagSafe battery pack",
    brand: "Apple",
    category: "Everyday",
    kind: "Accessories",
    price: 7900,
    rating: 4.3,
    reviews: 286,
    description:
      "A little extra energy for days that go a little longer. A compact magnetic charging companion.",
    color: "White",
    specs: {
      Type: "Battery pack",
      Connection: "MagSafe",
      Use: "Portable charging",
    },
    tags: ["charger", "travel", "portable"],
    stock: 16,
  },
  {
    id: 108,
    name: "Silicone case",
    brand: "Apple",
    category: "Everyday",
    kind: "Accessories",
    price: 2900,
    original: 3900,
    rating: 4.4,
    reviews: 195,
    description:
      "A soft finish, a comfortable grip, and a little everyday protection for iPhone 12.",
    color: "Plum",
    specs: {
      Type: "Phone case",
      Compatibility: "iPhone 12",
      Material: "Silicone",
    },
    tags: ["case", "phone", "budget"],
    stock: 22,
  },
];
export const productById = (id: number) => products.find((p) => p.id === id);
export const imageFor = (p: Product) => `/products/${p.id}.webp`;
export const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100,
  );
