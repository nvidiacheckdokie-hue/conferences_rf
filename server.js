import express from "express";
const kol = express();
const PORT = 3000;

kol.get("/", (req, res) => res.send("Конференции.РФ"));

kol.get("/about", (req, res) => res.send("О нас"));

kol.get("/contacts", (req, res) => res.send("Наши контакты"));

kol.listen(PORT, () => {
  console.log(`Сервер: http://localhost:${PORT}`);
});