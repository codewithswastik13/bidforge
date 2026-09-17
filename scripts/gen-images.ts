import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const OUT = '/home/z/my-project/public/products';

const STYLE =
  'premium studio product photography, centered composition, dramatic cinematic lighting, ' +
  'dark charcoal background with subtle cyan rim light, soft reflections, ultra sharp, high quality, luxury aesthetic';

const JOBS: Array<[string, string]> = [
  ['p-watch-chronograph', 'luxury limited edition chronograph wristwatch with deep black dial, steel case and cyan accent second hand, floating upright'],
  ['p-sneaker', 'futuristic limited edition sneaker in graphite black with electric cyan sole details, floating at slight angle'],
  ['p-art', 'abstract modern canvas art print with flowing cyan and violet brushstrokes on dark background, leaning on minimal stand'],
  ['p-camera', 'vintage film camera with black leather body and silver metal top plate, classic rangefinder design'],
  ['p-guitar', 'electric guitar in midnight black with cyan neon edge light, signed by artist, on minimal stand'],
  ['p-whisky', 'rare single malt whisky bottle with amber liquid and elegant dark label, gift box beside it'],
  ['p-handbag', 'luxury designer handbag in deep black leather with gold hardware, structured silhouette'],
  ['p-sculpture', 'modern bronze abstract sculpture of flowing geometric forms on black marble base'],
  ['p-ring', 'rare blue diamond ring in white gold setting, sparkling gemstone, macro detail on dark velvet display'],
  ['p-robot', 'collectible designer robot figurine in matte black and chrome with glowing cyan visor, on display base'],
];

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const zai = await ZAI.create();
  const results: string[] = [];
  for (const [name, subject] of JOBS) {
    const out = path.join(OUT, `${name}.png`);
    if (fs.existsSync(out)) { results.push(`SKIP ${name}`); continue; }
    let ok = false;
    for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
      try {
        const res = await zai.images.generations.create({
          prompt: `${subject}, ${STYLE}`,
          size: '1024x1024',
        });
        const b64 = res.data?.[0]?.base64;
        if (!b64) throw new Error('empty base64');
        fs.writeFileSync(out, Buffer.from(b64, 'base64'));
        results.push(`OK ${name}`);
        ok = true;
      } catch (e) {
        console.error(`attempt ${attempt} failed for ${name}:`, (e as Error).message);
        await new Promise(r => setTimeout(r, 1200 * attempt));
      }
    }
    if (!ok) results.push(`FAIL ${name}`);
  }
  console.log(results.join('\n'));
}

main();
