require("dotenv").config();
const puppeteer = require("puppeteer");
const Botkit = require("botkit");

let controller = Botkit.slackbot({});
let bot = controller.spawn();

bot.configureIncomingWebhook({
  url: process.env.WEBHOOK_URL
});

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://adhoc.mayhem.cbssports.com");
  await page.type("input#userid", process.env.USERNAME);
  await page.type("input#password", process.env.PASSWORD);
  await page.click('input[type="submit"]');
  await page.waitForNavigation({
    waitUntil: "domcontentloaded"
  });
  await page.goto("http://adhoc.mayhem.cbssports.com/brackets/standings");
  const results = await page.evaluate(() => {
    let text = "Ad Hoc Team United Standings\n";
    text += 'http://adhoc.mayhem.cbssports.com/\n';
    text += `${document.querySelector("tr.footer").children[0].innerText}\n`;
    text += '```\n';
    text += "Rank\tTeam Name\n";
    let foo = document.querySelector("table.data tbody");
    for (let child of foo.children) {
      if (child.id) {
        let rank = child.children[0].innerText;
        let name = child.children[1].innerText;
        text += `${rank}\t${name}\n`;
      }
    }
    text += '```\n';
    return text;
  });

  const msg = {
    response_type: 'in_channel',
    username: 'bracketbot',
    attachments: [{
      text: results,
    }]
  }

  // console.log(results);
  bot.sendWebhook(msg, (err, res) => {
    if (err) throw err;

    console.log(`\n🚀  bracketbot report delivered 🚀`);
  })
  await browser.close();
})();
