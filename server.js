import express from "express";
const bon = express();
const PORT = 3000;

bon.use(express.urlencoded({ extended: true }));

bon.get("/", (req, res) => res.send("Конференции.РФ"));

bon.get("/register", (req, res) => {
  res.send(`
    <form method="POST" action="/register">
      <input name="login" placeholder="Логин">
      <input name="password" type="password" placeholder="Пароль">
      <input name="fio" placeholder="ФИО">
      <input name="phone" type="tel" placeholder="Номер телефона">
      <input name="email" type="email" placeholder="Email">
      <button>Создать пользователя</button>
    </form>
  `);
});

bon.post("/register", (req, res) => {
  res.send(`Пользователь зарегистрирован!<br>
    Логин: ${req.body.login}<br>
    Пароль: ${req.body.password}<br>
    ФИО: ${req.body.fio}<br>
    Номер телефона: ${req.body.phone}<br>
    Email: ${req.body.email}`);
});

bon.get("/about", (req, res) => res.send("О нас"));

bon.get("/contacts", (req, res) => res.send("Наши контакты"));

bon.listen(PORT, () => {
  console.log(`Сервер: http://localhost:${PORT}`);
});