import express from "express";
const kol = express();
const PORT = 3000;

kol.use(express.urlencoded({ extended: true }));

kol.set("view engine", "ejs");
kol.set("views", "./views");

kol.get("/", (req, res) => res.send("Конференции.РФ"));

kol.get("/register", (req, res) => {
  res.render("register", { title: "Регистрация на портале", errors: [] });
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

kol.get("/login", (req, res) => {
  res.render("login", { title: "Авторизация на портале", errors: [] });
});

kol.post("/login", (req, res) => {
  const userLogin = req.body.login;
  res.redirect(`/dashboard?user=${encodeURIComponent(userLogin)}`);
});

kol.get("/dashboard", (req, res) => {
  const login = req.query.user || 'Гость';
  res.render("dashboard", { login: login });
});

kol.get("/about", (req, res) => res.send("О нас"));

kol.get("/contacts", (req, res) => res.send("Наши контакты"));

kol.listen(PORT, () => {
  console.log(`Сервер: http://localhost:${PORT}`);
});