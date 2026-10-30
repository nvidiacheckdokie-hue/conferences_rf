import express from "express";
const bon = express();
const PORT = 3000;

bon.get("/", (req, res) => res.send("Конференции.РФ"));

bon.get("/about", (req, res) => res.send("О нас"));

bon.get("/contacts", (req, res) => res.send("Наши контакты"));

bon.listen(PORT, () => {
  console.log(`Сервер: http://localhost:${PORT}`);
});