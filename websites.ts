/**
 * Universal Website Recognition and Discovery System.
 * Recognises public websites, services, and online platforms from partial queries.
 * Covers global social, shopping, tech/dev, media/streaming, education, gaming,
 * productivity, news, and utility domains.
 */

export interface WebService {
  name: string;
  domain: string;
  url: string;
  aliases?: string[];
  category?: string;
}

export const COMMON_TLDS = new Set([
  "com", "org", "net", "edu", "gov", "mil", "io", "dev", "co", "app",
  "ai", "in", "uk", "ca", "de", "fr", "jp", "au", "us", "info", "biz",
  "me", "tv", "cc", "xyz", "online", "site", "tech", "store", "shop",
  "gg", "so", "to", "link", "cloud", "live", "news", "agency"
]);

/**
 * Checks if the user explicitly typed an actual URL or domain name.
 * Examples: 'example.com', 'https://github.com/test', 'www.google.com'
 */
export function parseExplicitUrl(input: string): { url: string; domain: string } | null {
  const trimmed = input.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;

  // Case 1: Protocol prefix
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.hostname.includes(".")) {
        return {
          url: parsed.href,
          domain: parsed.hostname.toLowerCase().replace(/^www\./, "")
        };
      }
    } catch {
      return null;
    }
  }

  // Case 2: www. prefix
  if (/^www\.[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(trimmed)) {
    try {
      const parsed = new URL(`https://${trimmed}`);
      return {
        url: parsed.href,
        domain: parsed.hostname.toLowerCase().replace(/^www\./, "")
      };
    } catch {
      return null;
    }
  }

  // Case 3: Domain.tld or Domain.tld/path with recognized TLD
  const match = trimmed.match(/^([a-z0-9-]+(?:\.[a-z0-9-]+)*)\.([a-z]{2,})(?:\/.*)?$/i);
  if (match) {
    const tld = match[2].toLowerCase();
    if (COMMON_TLDS.has(tld)) {
      try {
        const parsed = new URL(`https://${trimmed}`);
        return {
          url: parsed.href,
          domain: parsed.hostname.toLowerCase().replace(/^www\./, "")
        };
      } catch {
        return null;
      }
    }
  }

  return null;
}

/**
 * Internet-wide public website registry covering major domains across all sectors.
 * Indexed by official name, canonical domain, aliases, and category.
 */
export const UNIVERSAL_SERVICES: WebService[] = [
  // ── Social Media & Communication ───────────────────────────────────────────
  { name: "Instagram", domain: "instagram.com", url: "https://www.instagram.com/", aliases: ["ins", "ig", "insta"], category: "social" },
  { name: "Meta", domain: "meta.com", url: "https://www.meta.com/", aliases: ["met"], category: "social" },
  { name: "Facebook", domain: "facebook.com", url: "https://www.facebook.com/", aliases: ["fac", "fb"], category: "social" },
  { name: "WhatsApp", domain: "whatsapp.com", url: "https://www.whatsapp.com/", aliases: ["wh", "wa", "whatsapp web"], category: "social" },
  { name: "Telegram", domain: "telegram.org", url: "https://telegram.org/", aliases: ["tel", "tg", "telegram web"], category: "social" },
  { name: "X", domain: "x.com", url: "https://x.com/", aliases: ["x", "tw", "twitter"], category: "social" },
  { name: "Twitter", domain: "twitter.com", url: "https://twitter.com/", aliases: ["tw", "tweet"], category: "social" },
  { name: "LinkedIn", domain: "linkedin.com", url: "https://www.linkedin.com/", aliases: ["lin"], category: "social" },
  { name: "Reddit", domain: "reddit.com", url: "https://www.reddit.com/", aliases: ["red"], category: "social" },
  { name: "Discord", domain: "discord.com", url: "https://discord.com/", aliases: ["dis", "discord web"], category: "social" },
  { name: "Pinterest", domain: "pinterest.com", url: "https://www.pinterest.com/", aliases: ["pin"], category: "social" },
  { name: "TikTok", domain: "tiktok.com", url: "https://www.tiktok.com/", aliases: ["tik", "tt"], category: "social" },
  { name: "Snapchat", domain: "snapchat.com", url: "https://www.snapchat.com/", aliases: ["snap"], category: "social" },
  { name: "Threads", domain: "threads.net", url: "https://www.threads.net/", aliases: ["thr"], category: "social" },
  { name: "Tumblr", domain: "tumblr.com", url: "https://www.tumblr.com/", aliases: ["tum"], category: "social" },
  { name: "Signal", domain: "signal.org", url: "https://signal.org/", aliases: ["sig"], category: "social" },
  { name: "WeChat", domain: "wechat.com", url: "https://www.wechat.com/", aliases: ["wec"], category: "social" },
  { name: "Slack", domain: "slack.com", url: "https://slack.com/", aliases: ["sla"], category: "social" },
  { name: "Zoom", domain: "zoom.us", url: "https://zoom.us/", aliases: ["zoo"], category: "social" },
  { name: "Skype", domain: "skype.com", url: "https://www.skype.com/", aliases: ["sky"], category: "social" },
  { name: "Bluesky", domain: "bsky.app", url: "https://bsky.app/", aliases: ["blue", "bsky"], category: "social" },
  { name: "Mastodon", domain: "joinmastodon.org", url: "https://joinmastodon.org/", aliases: ["mas"], category: "social" },

  // ── Shopping & E-Commerce ──────────────────────────────────────────────────
  { name: "Amazon", domain: "amazon.in", url: "https://www.amazon.in/", aliases: ["ama", "amz", "amazon.in", "amazon.com"], category: "shopping" },
  { name: "Myntra", domain: "myntra.com", url: "https://www.myntra.com/", aliases: ["myn"], category: "shopping" },
  { name: "Flipkart", domain: "flipkart.com", url: "https://www.flipkart.com/", aliases: ["fli", "flip", "fk"], category: "shopping" },
  { name: "eBay", domain: "ebay.com", url: "https://www.ebay.com/", aliases: ["eba"], category: "shopping" },
  { name: "Etsy", domain: "etsy.com", url: "https://www.etsy.com/", aliases: ["ets"], category: "shopping" },
  { name: "Walmart", domain: "walmart.com", url: "https://www.walmart.com/", aliases: ["wal"], category: "shopping" },
  { name: "AliExpress", domain: "aliexpress.com", url: "https://www.aliexpress.com/", aliases: ["ali"], category: "shopping" },
  { name: "Target", domain: "target.com", url: "https://www.target.com/", aliases: ["tar"], category: "shopping" },
  { name: "Best Buy", domain: "bestbuy.com", url: "https://www.bestbuy.com/", aliases: ["bes"], category: "shopping" },
  { name: "Home Depot", domain: "homedepot.com", url: "https://www.homedepot.com/", aliases: ["hom"], category: "shopping" },
  { name: "Shopify", domain: "shopify.com", url: "https://www.shopify.com/", aliases: ["sho"], category: "shopping" },
  { name: "Shein", domain: "shein.com", url: "https://www.shein.com/", aliases: ["she"], category: "shopping" },
  { name: "Temu", domain: "temu.com", url: "https://www.temu.com/", aliases: ["tem"], category: "shopping" },
  { name: "ASOS", domain: "asos.com", url: "https://www.asos.com/", aliases: ["aso"], category: "shopping" },
  { name: "Zara", domain: "zara.com", url: "https://www.zara.com/", aliases: ["zar"], category: "shopping" },
  { name: "Nike", domain: "nike.com", url: "https://www.nike.com/", aliases: ["nik"], category: "shopping" },
  { name: "Adidas", domain: "adidas.com", url: "https://www.adidas.com/", aliases: ["adi"], category: "shopping" },
  { name: "Ikea", domain: "ikea.com", url: "https://www.ikea.com/", aliases: ["ike"], category: "shopping" },
  { name: "Costco", domain: "costco.com", url: "https://www.costco.com/", aliases: ["cos"], category: "shopping" },
  { name: "Wayfair", domain: "wayfair.com", url: "https://www.wayfair.com/", aliases: ["way"], category: "shopping" },
  { name: "Newegg", domain: "newegg.com", url: "https://www.newegg.com/", aliases: ["new"], category: "shopping" },
  { name: "Ajio", domain: "ajio.com", url: "https://www.ajio.com/", aliases: ["aji"], category: "shopping" },
  { name: "Meesho", domain: "meesho.com", url: "https://www.meesho.com/", aliases: ["mee"], category: "shopping" },
  { name: "Nykaa", domain: "nykaa.com", url: "https://www.nykaa.com/", aliases: ["nyk"], category: "shopping" },

  // ── Technology, Software & AI ──────────────────────────────────────────────
  { name: "Google", domain: "google.com", url: "https://www.google.com/", aliases: ["goo"], category: "tech" },
  { name: "Microsoft", domain: "microsoft.com", url: "https://www.microsoft.com/", aliases: ["mic", "ms"], category: "tech" },
  { name: "Apple", domain: "apple.com", url: "https://www.apple.com/", aliases: ["app"], category: "tech" },
  { name: "GitHub", domain: "github.com", url: "https://github.com/", aliases: ["git", "gh"], category: "tech" },
  { name: "GitLab", domain: "gitlab.com", url: "https://gitlab.com/", aliases: ["gitl"], category: "tech" },
  { name: "Bitbucket", domain: "bitbucket.org", url: "https://bitbucket.org/", aliases: ["bit"], category: "tech" },
  { name: "OpenAI", domain: "openai.com", url: "https://openai.com/", aliases: ["ope"], category: "tech" },
  { name: "ChatGPT", domain: "chatgpt.com", url: "https://chatgpt.com/", aliases: ["chat", "gpt", "chat gpt"], category: "tech" },
  { name: "Claude", domain: "claude.ai", url: "https://claude.ai/", aliases: ["cla"], category: "tech" },
  { name: "Anthropic", domain: "anthropic.com", url: "https://www.anthropic.com/", aliases: ["ant"], category: "tech" },
  { name: "Gemini", domain: "gemini.google.com", url: "https://gemini.google.com/", aliases: ["gem"], category: "tech" },
  { name: "Stack Overflow", domain: "stackoverflow.com", url: "https://stackoverflow.com/", aliases: ["sta", "stack"], category: "tech" },
  { name: "W3Schools", domain: "w3schools.com", url: "https://www.w3schools.com/", aliases: ["w3", "w3s"], category: "tech" },
  { name: "MDN Web Docs", domain: "developer.mozilla.org", url: "https://developer.mozilla.org/", aliases: ["mdn", "mozilla"], category: "tech" },
  { name: "npm", domain: "npmjs.com", url: "https://www.npmjs.com/", aliases: ["npm"], category: "tech" },
  { name: "PyPI", domain: "pypi.org", url: "https://pypi.org/", aliases: ["pyp"], category: "tech" },
  { name: "Docker", domain: "docker.com", url: "https://www.docker.com/", aliases: ["doc"], category: "tech" },
  { name: "Cloudflare", domain: "cloudflare.com", url: "https://www.cloudflare.com/", aliases: ["clo"], category: "tech" },
  { name: "Vercel", domain: "vercel.com", url: "https://vercel.com/", aliases: ["ver"], category: "tech" },
  { name: "Netlify", domain: "netlify.com", url: "https://www.netlify.com/", aliases: ["netl"], category: "tech" },
  { name: "Supabase", domain: "supabase.com", url: "https://supabase.com/", aliases: ["sup"], category: "tech" },
  { name: "Firebase", domain: "firebase.google.com", url: "https://firebase.google.com/", aliases: ["fir"], category: "tech" },
  { name: "AWS", domain: "aws.amazon.com", url: "https://aws.amazon.com/", aliases: ["aws"], category: "tech" },
  { name: "Azure", domain: "azure.microsoft.com", url: "https://azure.microsoft.com/", aliases: ["azu"], category: "tech" },
  { name: "DigitalOcean", domain: "digitalocean.com", url: "https://www.digitalocean.com/", aliases: ["dig"], category: "tech" },
  { name: "Heroku", domain: "heroku.com", url: "https://www.heroku.com/", aliases: ["her"], category: "tech" },
  { name: "Python", domain: "python.org", url: "https://www.python.org/", aliases: ["pyt"], category: "tech" },
  { name: "Rust", domain: "rust-lang.org", url: "https://www.rust-lang.org/", aliases: ["rus"], category: "tech" },
  { name: "Node.js", domain: "nodejs.org", url: "https://nodejs.org/", aliases: ["nod"], category: "tech" },
  { name: "React", domain: "react.dev", url: "https://react.dev/", aliases: ["rea"], category: "tech" },
  { name: "Vue.js", domain: "vuejs.org", url: "https://vuejs.org/", aliases: ["vue"], category: "tech" },
  { name: "Vite", domain: "vite.dev", url: "https://vite.dev/", aliases: ["vit"], category: "tech" },
  { name: "VS Code", domain: "code.visualstudio.com", url: "https://code.visualstudio.com/", aliases: ["vs", "vsc", "vscode", "vs code", "visual studio code"], category: "tech" },
  { name: "Visual Studio", domain: "visualstudio.microsoft.com", url: "https://visualstudio.microsoft.com/", aliases: ["visual studio"], category: "tech" },
  { name: "CodePen", domain: "codepen.io", url: "https://codepen.io/", aliases: ["codep", "pen", "codepen"], category: "tech" },
  { name: "Replit", domain: "replit.com", url: "https://replit.com/", aliases: ["rep", "replit"], category: "tech" },
  { name: "Postman", domain: "postman.com", url: "https://www.postman.com/", aliases: ["post", "postman"], category: "tech" },
  { name: "StackBlitz", domain: "stackblitz.com", url: "https://stackblitz.com/", aliases: ["stackb", "stackblitz"], category: "tech" },
  { name: "Hugging Face", domain: "huggingface.co", url: "https://huggingface.co/", aliases: ["hug", "hf", "huggingface", "hugging face"], category: "tech" },
  { name: "Tailwind CSS", domain: "tailwindcss.com", url: "https://tailwindcss.com/", aliases: ["tai"], category: "tech" },

  // ── Entertainment, Media & Streaming ───────────────────────────────────────
  { name: "YouTube", domain: "youtube.com", url: "https://www.youtube.com/", aliases: ["you", "yt"], category: "entertainment" },
  { name: "Netflix", domain: "netflix.com", url: "https://www.netflix.com/", aliases: ["net", "nflx"], category: "entertainment" },
  { name: "Spotify", domain: "spotify.com", url: "https://www.spotify.com/", aliases: ["spo"], category: "entertainment" },
  { name: "Twitch", domain: "twitch.tv", url: "https://www.twitch.tv/", aliases: ["twi"], category: "entertainment" },
  { name: "IMDb", domain: "imdb.com", url: "https://www.imdb.com/", aliases: ["imd"], category: "entertainment" },
  { name: "Disney+", domain: "disneyplus.com", url: "https://www.disneyplus.com/", aliases: ["disn"], category: "entertainment" },
  { name: "Hulu", domain: "hulu.com", url: "https://www.hulu.com/", aliases: ["hul"], category: "entertainment" },
  { name: "Max", domain: "max.com", url: "https://www.max.com/", aliases: ["hbo", "max"], category: "entertainment" },
  { name: "Prime Video", domain: "primevideo.com", url: "https://www.primevideo.com/", aliases: ["pri"], category: "entertainment" },
  { name: "SoundCloud", domain: "soundcloud.com", url: "https://soundcloud.com/", aliases: ["sou"], category: "entertainment" },
  { name: "Bandcamp", domain: "bandcamp.com", url: "https://bandcamp.com/", aliases: ["ban"], category: "entertainment" },
  { name: "Vimeo", domain: "vimeo.com", url: "https://vimeo.com/", aliases: ["vim"], category: "entertainment" },
  { name: "Rotten Tomatoes", domain: "rottentomatoes.com", url: "https://www.rottentomatoes.com/", aliases: ["rot"], category: "entertainment" },
  { name: "Crunchyroll", domain: "crunchyroll.com", url: "https://www.crunchyroll.com/", aliases: ["cru"], category: "entertainment" },
  { name: "Wikipedia", domain: "wikipedia.org", url: "https://www.wikipedia.org/", aliases: ["wik"], category: "reference" },
  { name: "Medium", domain: "medium.com", url: "https://medium.com/", aliases: ["med"], category: "media" },
  { name: "Substack", domain: "substack.com", url: "https://substack.com/", aliases: ["sub"], category: "media" },
  { name: "Dev.to", domain: "dev.to", url: "https://dev.to/", aliases: ["devt"], category: "media" },

  // ── Education & Learning ───────────────────────────────────────────────────
  { name: "Coursera", domain: "coursera.org", url: "https://www.coursera.org/", aliases: ["cou", "course"], category: "education" },
  { name: "Udemy", domain: "udemy.com", url: "https://www.udemy.com/", aliases: ["ude"], category: "education" },
  { name: "Khan Academy", domain: "khanacademy.org", url: "https://www.khanacademy.org/", aliases: ["kha", "khan"], category: "education" },
  { name: "edX", domain: "edx.org", url: "https://www.edx.org/", aliases: ["edx"], category: "education" },
  { name: "Codecademy", domain: "codecademy.com", url: "https://www.codecademy.com/", aliases: ["cod"], category: "education" },
  { name: "LeetCode", domain: "leetcode.com", url: "https://leetcode.com/", aliases: ["lee", "leet", "leetcode", "leet code"], category: "education" },
  { name: "HackerRank", domain: "hackerrank.com", url: "https://www.hackerrank.com/", aliases: ["hac", "hack", "hackerrank", "hacker rank"], category: "education" },
  { name: "Codeforces", domain: "codeforces.com", url: "https://codeforces.com/", aliases: ["codef", "cf", "codeforces"], category: "education" },
  { name: "GeeksforGeeks", domain: "geeksforgeeks.org", url: "https://www.geeksforgeeks.org/", aliases: ["gee", "gfg", "geeks", "geeksforgeeks", "geeks for geeks"], category: "education" },
  { name: "Duolingo", domain: "duolingo.com", url: "https://www.duolingo.com/", aliases: ["duo"], category: "education" },
  { name: "Quizlet", domain: "quizlet.com", url: "https://quizlet.com/", aliases: ["qui"], category: "education" },
  { name: "Britannica", domain: "britannica.com", url: "https://www.britannica.com/", aliases: ["bri"], category: "education" },
  { name: "arXiv", domain: "arxiv.org", url: "https://arxiv.org/", aliases: ["arx"], category: "education" },

  // ── Travel, Food, Mobility & Delivery ──────────────────────────────────────
  { name: "Ixigo", domain: "ixigo.com", url: "https://www.ixigo.com/", aliases: ["ixi", "ixigo", "ixigo trains", "ixigo flights"], category: "travel" },
  { name: "Skyscanner", domain: "skyscanner.com", url: "https://www.skyscanner.com/", aliases: ["sky", "skys", "skyscanner", "skyscanner flights"], category: "travel" },
  { name: "Airbnb", domain: "airbnb.com", url: "https://www.airbnb.com/", aliases: ["air", "airb", "airbnb"], category: "travel" },
  { name: "Booking.com", domain: "booking.com", url: "https://www.booking.com/", aliases: ["boo", "book", "booking"], category: "travel" },
  { name: "MakeMyTrip", domain: "makemytrip.com", url: "https://www.makemytrip.com/", aliases: ["mmt", "make", "makemytrip"], category: "travel" },
  { name: "Expedia", domain: "expedia.com", url: "https://www.expedia.com/", aliases: ["exp", "expedia"], category: "travel" },
  { name: "Tripadvisor", domain: "tripadvisor.com", url: "https://www.tripadvisor.com/", aliases: ["trip", "tripadvisor"], category: "travel" },
  { name: "Agoda", domain: "agoda.com", url: "https://www.agoda.com/", aliases: ["ago", "agoda"], category: "travel" },
  { name: "Swiggy", domain: "swiggy.com", url: "https://www.swiggy.com/", aliases: ["swi", "swig", "swiggy"], category: "food" },
  { name: "Zomato", domain: "zomato.com", url: "https://www.zomato.com/", aliases: ["zom", "zomato"], category: "food" },
  { name: "Blinkit", domain: "blinkit.com", url: "https://www.blinkit.com/", aliases: ["bli", "blink", "blinkit"], category: "shopping" },
  { name: "Zepto", domain: "zeptonow.com", url: "https://www.zeptonow.com/", aliases: ["zep", "zepto"], category: "shopping" },
  { name: "BigBasket", domain: "bigbasket.com", url: "https://www.bigbasket.com/", aliases: ["bigb", "bigbasket"], category: "shopping" },
  { name: "Uber", domain: "uber.com", url: "https://www.uber.com/", aliases: ["ube", "uber"], category: "travel" },
  { name: "Ola", domain: "olacabs.com", url: "https://www.olacabs.com/", aliases: ["ola", "olacabs"], category: "travel" },
  { name: "IRCTC", domain: "irctc.co.in", url: "https://www.irctc.co.in/", aliases: ["irc", "irctc"], category: "travel" },
  { name: "Redbus", domain: "redbus.in", url: "https://www.redbus.in/", aliases: ["redb", "redbus"], category: "travel" },
  { name: "Yatra", domain: "yatra.com", url: "https://www.yatra.com/", aliases: ["yat", "yatra"], category: "travel" },
  { name: "Cleartrip", domain: "cleartrip.com", url: "https://www.cleartrip.com/", aliases: ["cle", "cleartrip"], category: "travel" },
  { name: "Kayak", domain: "kayak.com", url: "https://www.kayak.com/", aliases: ["kay", "kayak"], category: "travel" },
  { name: "Trivago", domain: "trivago.com", url: "https://www.trivago.com/", aliases: ["tri", "trivago"], category: "travel" },

  // ── Gaming & Platforms ─────────────────────────────────────────────────────
  { name: "Steam", domain: "steampowered.com", url: "https://store.steampowered.com/", aliases: ["ste"], category: "gaming" },
  { name: "Epic Games", domain: "epicgames.com", url: "https://www.epicgames.com/", aliases: ["epi"], category: "gaming" },
  { name: "CrazyGames", domain: "crazygames.com", url: "https://www.crazygames.com/", aliases: ["cra", "crazy"], category: "gaming" },
  { name: "Roblox", domain: "roblox.com", url: "https://www.roblox.com/", aliases: ["rob"], category: "gaming" },
  { name: "Minecraft", domain: "minecraft.net", url: "https://www.minecraft.net/", aliases: ["min"], category: "gaming" },
  { name: "PlayStation", domain: "playstation.com", url: "https://www.playstation.com/", aliases: ["play", "ps"], category: "gaming" },
  { name: "Xbox", domain: "xbox.com", url: "https://www.xbox.com/", aliases: ["xbo"], category: "gaming" },
  { name: "Nintendo", domain: "nintendo.com", url: "https://www.nintendo.com/", aliases: ["nin"], category: "gaming" },
  { name: "IGN", domain: "ign.com", url: "https://www.ign.com/", aliases: ["ign"], category: "gaming" },
  { name: "GameSpot", domain: "gamespot.com", url: "https://www.gamespot.com/", aliases: ["gam"], category: "gaming" },
  { name: "itch.io", domain: "itch.io", url: "https://itch.io/", aliases: ["itc"], category: "gaming" },
  { name: "GOG", domain: "gog.com", url: "https://www.gog.com/", aliases: ["gog"], category: "gaming" },
  { name: "Riot Games", domain: "riotgames.com", url: "https://www.riotgames.com/", aliases: ["rio"], category: "gaming" },

  // ── Productivity, Design & Utilities ───────────────────────────────────────
  { name: "Notion", domain: "notion.so", url: "https://www.notion.so/", aliases: ["not"], category: "productivity" },
  { name: "Figma", domain: "figma.com", url: "https://www.figma.com/", aliases: ["fig"], category: "design" },
  { name: "Canva", domain: "canva.com", url: "https://www.canva.com/", aliases: ["can"], category: "design" },
  { name: "Trello", domain: "trello.com", url: "https://trello.com/", aliases: ["tre"], category: "productivity" },
  { name: "Asana", domain: "asana.com", url: "https://asana.com/", aliases: ["asa"], category: "productivity" },
  { name: "Jira", domain: "atlassian.com", url: "https://www.atlassian.com/", aliases: ["jir", "atl"], category: "productivity" },
  { name: "Linear", domain: "linear.app", url: "https://linear.app/", aliases: ["line"], category: "productivity" },
  { name: "Miro", domain: "miro.com", url: "https://miro.com/", aliases: ["mir"], category: "productivity" },
  { name: "Dropbox", domain: "dropbox.com", url: "https://www.dropbox.com/", aliases: ["dro"], category: "productivity" },
  { name: "Google Drive", domain: "drive.google.com", url: "https://drive.google.com/", aliases: ["gdrive"], category: "productivity" },
  { name: "Google Docs", domain: "docs.google.com", url: "https://docs.google.com/", aliases: ["gdocs"], category: "productivity" },
  { name: "OneDrive", domain: "onedrive.live.com", url: "https://onedrive.live.com/", aliases: ["one"], category: "productivity" },
  { name: "1Password", domain: "1password.com", url: "https://1password.com/", aliases: ["1pass"], category: "utility" },
  { name: "Bitwarden", domain: "bitwarden.com", url: "https://bitwarden.com/", aliases: ["bitw"], category: "utility" },
  { name: "Speedtest", domain: "speedtest.net", url: "https://www.speedtest.net/", aliases: ["spe"], category: "utility" },
  { name: "Unsplash", domain: "unsplash.com", url: "https://unsplash.com/", aliases: ["uns"], category: "utility" },
  { name: "Internet Archive", domain: "archive.org", url: "https://archive.org/", aliases: ["arc", "wayback"], category: "utility" },

  // ── News, Reference & Finance ──────────────────────────────────────────────
  { name: "BBC", domain: "bbc.com", url: "https://www.bbc.com/", aliases: ["bbc"], category: "news" },
  { name: "CNN", domain: "cnn.com", url: "https://www.cnn.com/", aliases: ["cnn"], category: "news" },
  { name: "The New York Times", domain: "nytimes.com", url: "https://www.nytimes.com/", aliases: ["nyt"], category: "news" },
  { name: "The Guardian", domain: "theguardian.com", url: "https://www.theguardian.com/", aliases: ["gua"], category: "news" },
  { name: "Reuters", domain: "reuters.com", url: "https://www.reuters.com/", aliases: ["reu"], category: "news" },
  { name: "Bloomberg", domain: "bloomberg.com", url: "https://www.bloomberg.com/", aliases: ["blo"], category: "news" },
  { name: "Forbes", domain: "forbes.com", url: "https://www.forbes.com/", aliases: ["for"], category: "news" },
  { name: "TechCrunch", domain: "techcrunch.com", url: "https://techcrunch.com/", aliases: ["tec"], category: "news" },
  { name: "The Verge", domain: "theverge.com", url: "https://www.theverge.com/", aliases: ["ver"], category: "news" },
  { name: "Wired", domain: "wired.com", url: "https://www.wired.com/", aliases: ["wir"], category: "news" },
  { name: "Hacker News", domain: "news.ycombinator.com", url: "https://news.ycombinator.com/", aliases: ["hn", "ycomb"], category: "news" },
  { name: "ESPN", domain: "espn.com", url: "https://www.espn.com/", aliases: ["esp"], category: "sports" },
  { name: "PayPal", domain: "paypal.com", url: "https://www.paypal.com/", aliases: ["pay"], category: "finance" },
  { name: "Stripe", domain: "stripe.com", url: "https://stripe.com/", aliases: ["str"], category: "finance" },
  { name: "Coinbase", domain: "coinbase.com", url: "https://www.coinbase.com/", aliases: ["coi"], category: "finance" },
];

/**
 * Intelligently matches a partial query against the universal website catalog.
 * Prioritizes:
 * 1. Exact name/alias/clean-domain matches.
 * 2. Prefix matches on the service name.
 * 3. Prefix matches on the primary domain.
 * 4. Prefix matches on known aliases.
 */
export function findMatchingWebsites(query: string, maxResults = 2): WebService[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  // Single-character queries only match if there is an explicit single-character alias (like 'x' for X)
  if (q.length === 1) {
    const single = UNIVERSAL_SERVICES.filter(s =>
      s.aliases?.some(a => a.toLowerCase() === q)
    );
    return single.slice(0, maxResults);
  }

  const exactMatches: WebService[] = [];
  const namePrefixMatches: WebService[] = [];
  const domainPrefixMatches: WebService[] = [];
  const aliasPrefixMatches: WebService[] = [];
  const seenDomains = new Set<string>();

  for (const service of UNIVERSAL_SERVICES) {
    const nameLower = service.name.toLowerCase();
    const domainLower = service.domain.toLowerCase();
    const domainWithoutTld = domainLower.replace(/\.[a-z]+$/i, "");

    // 1. Exact match
    if (
      nameLower === q ||
      domainLower === q ||
      domainWithoutTld === q ||
      service.aliases?.some(a => a.toLowerCase() === q)
    ) {
      if (!seenDomains.has(domainLower)) {
        exactMatches.push(service);
        seenDomains.add(domainLower);
      }
      continue;
    }

    // 2. Name prefix match (e.g. "Instagram" for "ins", "WhatsApp" for "wh")
    if (nameLower.startsWith(q)) {
      if (!seenDomains.has(domainLower)) {
        namePrefixMatches.push(service);
        seenDomains.add(domainLower);
      }
      continue;
    }

    // 3. Domain prefix match (e.g. "instagram.com" for "ins")
    if (domainLower.startsWith(q) || domainLower.startsWith("www." + q)) {
      if (!seenDomains.has(domainLower)) {
        domainPrefixMatches.push(service);
        seenDomains.add(domainLower);
      }
      continue;
    }

    // 4. Alias prefix match (e.g. alias "whatsapp" for "wh")
    if (service.aliases?.some(a => a.toLowerCase().startsWith(q))) {
      if (!seenDomains.has(domainLower)) {
        aliasPrefixMatches.push(service);
        seenDomains.add(domainLower);
      }
      continue;
    }
  }

  return [
    ...exactMatches,
    ...namePrefixMatches,
    ...domainPrefixMatches,
    ...aliasPrefixMatches,
  ].slice(0, maxResults);
}

const STOP_WORDS = new Set([
  "what", "when", "where", "which", "who", "whom", "whose", "why", "how",
  "the", "and", "for", "with", "about", "against", "between", "into", "through",
  "during", "before", "after", "above", "below", "from", "down", "in", "out",
  "on", "off", "over", "under", "again", "further", "then", "once", "here",
  "there", "all", "any", "both", "each", "few", "more", "most", "other", "some",
  "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very",
  "can", "will", "just", "should", "now", "weather", "news", "meaning", "definition",
  "lyrics", "images", "videos", "map", "calculator", "translate", "test", "best",
  "good", "free", "online", "download", "login", "price", "review"
]);

/**
 * Universal dynamic fallback: converts any single-word brand, company, or service
 * into a website navigation suggestion if no hardcoded registry entry matched.
 */
export function inferWebsiteSuggestion(word: string): WebService | null {
  const clean = word.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (!clean || clean.length < 3 || clean.length > 30) return null;
  if (STOP_WORDS.has(clean)) return null;

  const domain = `${clean}.com`;
  const name = clean.charAt(0).toUpperCase() + clean.slice(1);
  return {
    name,
    domain,
    url: `https://www.${clean}.com/`,
    aliases: [clean]
  };
}
