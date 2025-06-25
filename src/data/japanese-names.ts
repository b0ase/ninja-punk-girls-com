// Japanese names for NFTs
// Sourced from Wikipedia - Japanese feminine given names
export const JAPANESE_NAMES = [
  // A
  "Ageha", "Ai", "Aika", "Aiko", "Aimi", "Aina", "Aino", "Aira", "Airi", 
  "Akane", "Akari", "Akemi", "Akeno", "Aki", "Akie", "Akiko", "Akina", "Akino", 
  "Akiyo", "Ako", "Akoya", "Amane", "Ami", "Amina", "Anju", "Anna", "Anzu", 
  "Ariko", "Arisa", "Asaka", "Asako", "Asami", "Asuka", "Asumi", "Asuna", 
  "Atsuko", "Atsumi", "Aya", "Ayaka", "Ayako", "Ayame", "Ayami", "Ayana", 
  "Ayane", "Ayano", "Ayasa", "Ayu", "Ayuka", "Ayuko", "Ayumi", "Ayumu", "Azumi",

  // C
  "Chie", "Chieko", "Chiemi", "Chiho", "Chika", "Chiya", "Chiyo",

  // E
  "Eiko", "Eimi", "Ema", "Emi", "Emika", "Emiko", "Emiri", "Eri", "Erika", 
  "Eriko", "Erina", "Etsuko",

  // F
  "Fubuki", "Fujie", "Fujiko", "Fūka", "Fukumi", "Fumi", "Fumie", "Fumika", 
  "Fumiko", "Fumino", "Fusa", "Fusako", "Futaba", "Fuyuko", "Fuyumi",

  // G
  "Ginko",

  // H
  "Hana", "Hanae", "Hanako", "Hanami", "Harue", "Haruhi", "Haruko", "Haruna", 
  "Haruno", "Haruyo", "Hasumi", "Hatsue", "Hatsumi", "Hibari", 
  "Hideko", "Himiko", "Hina", "Hinako", "Hiroe", "Hiroka", "Hiroko", 
  "Hiroyo", "Hisa", "Hisae", "Hisako", "Hisayo", "Hitomi", "Hiyori", "Honami", "Honoka",

  // I
  "Ichigo", "Ichiko", "Ikue", "Ikuko", "Ikumi", "Ikura", "Ikuyo", "Inori", 
  "Io", "Iroha", "Isuzu", "Ito", "Itsuko", "Itsumi", "Iyo",

  // J
  "Junko", "Juri",

  // K
  "Kaede", "Kaho", "Kahori", "Kahoru", "Kako", "Kana", "Kanae", "Kanako", 
  "Kanami", "Kanna", "Kanoko", "Kanon", "Kaori", "Karen", "Karin", 
  "Kasumi", "Katsuko", "Kawai", "Kaya", "Kayoko", "Kazue", "Kazuha", 
  "Kazuko", "Kazusa", "Kazuyo", "Keiki", "Keiko", "Kiara", "Kie", "Kiho", 
  "Kiko", "Kiku", "Kikue", "Kikuko", "Kimi", "Kimiko", "Kimiyo", "Kinu", 
  "Kinuko", "Kira", "Kirari", "Kirie", "Kirika", "Kiriko", "Kirino", "Kiyoko",

  // M
  "Mai", "Maiko", "Mako", "Makoto", "Mami", "Mamiko", "Mana", "Manami", "Mao", 
  "Mari", "Marie", "Mariko", "Marina", "Masuyo", "Maya", "Mayu", "Mayumi", "Megumi", 
  "Mei", "Midori", "Mieko", "Miho", "Miiko", "Mika", "Miki", "Mikiko", 
  "Mikoto", "Miku", "Misaki", "Misato", "Misoka", "Miu", 
  "Miyako", "Miyoko", "Miyuki", "Mizuki", "Moe", "Momiji", "Momoka", "Momoko", 
  "Momo", "Motoyo",

  // N
  "Nagi", "Nagisa", "Nami", "Namie", "Nana", "Nanako", "Nanami", "Nao", "Naoko", 
  "Naomi", "Natsue", "Natsuki", "Natsumi", "Nene", "Nina", "Nobuko", 
  "Nori", "Noriko", "Nozomi",

  // O
  "Oki", "Okiku",

  // R
  "Ran", "Rei", "Reika", "Reiko", "Rena", "Rieko", "Rie", "Rika", "Rikako", 
  "Riko", "Rimiko", "Rin", "Rina", "Rio", "Risa", "Risako", "Ritsuko", "Riu", 
  "Rumi", "Rumiko", "Ruri", "Ruriko", "Ryoko",

  // S
  "Sachi", "Sae", "Saeko", "Sakiko", "Sakura", "Sana", 
  "Sanae", "Sayaka", "Sayoko", "Sayuri", "Sena", "Serina", "Setsu", 
  "Shiho", "Shika", "Shino", "Shiori", "Shizue", 
  "Shoko", "Sora", "Suzu", "Suzuka", "Suzuko", "Suzume",

  // T
  "Taeko", "Takako", "Takayo", "Tamaki", "Tamao", "Tamiko", "Teruko", 
  "Tomiko", "Tomoe", "Tomoka", "Tomoko", "Tomomi", "Tomono", "Tomoyo", "Toshie", 
  "Tsugumi",

  // U
  "Ui", "Ume", "Umeko", "Une", "Urara", "Usagi", "Utano",

  // W
  "Wakako", "Wakana",

  // Y
  "Yae", "Yaeko", "Yasu", "Yasuko", "Yasumi", "Yoko", "Yokiko", "Yori", "Yoriko", 
  "Yoshie", "Yoshimi", "Yoshino", "Yū", "Yuka", "Yukako", "Yukari", 
  "Yukiko", "Yukino", "Yumi", "Yumie", "Yumiko", "Yuna", "Yurie", "Yuriko", "Yuri", 
  "Yuzuki",

  // Z
  "Zenko"
];

export const getRandomName = (): string => {
  return JAPANESE_NAMES[Math.floor(Math.random() * JAPANESE_NAMES.length)];
};

// List of specific character names that should NOT be truncated
export const CHARACTER_NAME_EXCEPTIONS = [
  // Extracted from observed filenames (add more as needed)
  'Miyuki',
  'Yamarashii',
  'Hikaru',
  'Phi-Phi',
  'Joy',
  'Ayumi',
  'Kazuyo',
  'Nao',
  'Kimiko',
  'Payne',
  'Amber',
  'Peggy',
  'Matoko',
  'Scarlet',
  'Doctor', // Assuming Doctor is treated as a character name here
  'Aika',
  // Add any other specific character names from your assets
]; 