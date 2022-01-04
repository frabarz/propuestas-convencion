import { cheerio, TagElement } from "https://deno.land/x/cheerio@1.0.4/mod.ts";
import { Semaphore } from "https://deno.land/x/semaphore@v1.1.0/mod.ts";

const filename = Deno.args[0];
const buffer = await Deno.readFile(filename);
const decoder = new TextDecoder("iso-8859-1");

const html = decoder.decode(buffer);
const $ = cheerio.load(html);
const cards = $(".card.iniciativa");

const semaphore = new Semaphore(10);

// Create and store the category dictionary
const categories: Record<string, string> = {};

// Get all the proposals in the index page and save them at `index.json`
const proposals: Proposal[] = Array.from(cards, (card) => {
  const $ = cheerio.load(card);
  const ini = card as TagElement;

  const category = ini.attribs["class"].replace(/card|iniciativa/g, "").trim();
  categories[category] = $("div.pill.rainbow").text();

  return {
    title: $("h1").text(),
    href: "https://plataforma.chileconvencion.cl/m/iniciativa_popular/" +
      $("h1 a").attr("href"),
    supporters: parseInt(ini.attribs["data-apoyos"]),
    id: parseInt($("h2").text().replace(/\D/g, "")),
    category,
  };
});
proposals.sort((a, b) => a.id - b.id);

await Deno.writeTextFile("index.json", JSON.stringify(proposals, null, 2));
await Deno.writeTextFile(
  "categories.json",
  JSON.stringify(categories, null, 2),
);

// Fetch the detailed page contents and save them in the `propuestas/` folder
await Deno.mkdir("propuestas", { recursive: true });
await Promise.all(
  proposals.map((proposal) =>
    fetchProposal(proposal)
      .then((html) => {
        const detailed = { ...proposal, ...parseProposal(html) };
        const filename = "./propuestas/" + proposal.id + ".json";
        return Deno.writeTextFile(filename, JSON.stringify(detailed, null, 2));
      }, (error) => {
        console.error(`Error fetching proposal ${proposal.id}:`, error.message);
      })
  ),
);

async function fetchProposal(proposal: Proposal): Promise<string> {
  const release = await semaphore.acquire();
  const response = await fetch(proposal.href);
  const buffer = await response.arrayBuffer();
  release();
  return decoder.decode(buffer);
}

function parseProposal(html: string): Pick<Proposal, "topic" | "outline"> {
  const $ = cheerio.load(html, { decodeEntities: false });
  const prop = $("#propuesta").html() as string;

  return {
    topic: $(".objeto.detalle p").text().replace("Tema:", "").trim(),
    outline: prop.split("<h2>").slice(1).map((item) => {
      const [title, ...contents] = item.split("</h2>").map((key) => key.trim());
      return [title, contents.join("").replace(/<\/?(?:p|br)>/g, "")];
    }),
  };
}

interface Proposal {
  title: string;
  href: string;
  supporters: number;
  id: number;
  category: string;
  topic?: string;
  outline?: string[][];
}
