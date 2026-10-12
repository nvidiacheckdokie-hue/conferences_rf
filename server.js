import express from "express";
const kol = express();
const PORT = 3000;

kol.use(express.urlencoded({ extended: true }));

kol.get("/", (req, res) => res.send("Конференции.РФ"));

kol.get("/register", (req, res) => {
  res.send(`
    <form method="POST" action="/register">
      <input name="login" placeholder="Логин" required>
      <input name="password" type="password" placeholder="Пароль" required>
      <input name="fio" placeholder="ФИО" required>
      <input name="phone" type="tel" placeholder="Номер телефона" required>
      <input name="email" type="email" placeholder="Email" required>
      <button>Создать пользователя</button>
    </form>
  `);
});

kol.post("/register", (req, res) => {
  res.send(`Пользователь зарегистрирован!<br>
    Данные:<br>
    Логин: ${req.body.login}<br>
    Пароль: ${req.body.password}<br>
    ФИО: ${req.body.fio}<br>
    Номер телефона: ${req.body.phone}<br>
    Email: ${req.body.email}`);
});

kol.get("/about", (req, res) => res.send("О нас"));

kol.get("/contacts", (req, res) => res.send("Наши контакты"));

kol.listen(PORT, () => {
  console.log(`Сервер: http://localhost:${PORT}`);
});