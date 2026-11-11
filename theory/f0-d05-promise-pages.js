const PAGES = {
  start: { items: ["чай", "кава"], next: "p2" },
  p2: { items: ["какао"], next: null },
};
const getPage = (id) =>
  new Promise((resolve) => setTimeout(() => resolve(PAGES[id]), 100));

const all = [];
let pageId = "start";
while (pageId !== null) {
  const page = await getPage(pageId);
  all.push(...page.items);
  pageId = page.next;
}
console.log(all);