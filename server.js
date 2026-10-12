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
  res.redirect(`/dashboard?user=${encodeURIComponent(req.body.login)}`);
});

kol.get("/dashboard", (req, res) => {
  const login = req.query.user || 'Гость';
  res.render("dashboard",
    {
    title: 'Мои заявки',
    user: { fio: 'Иванов Иван' },
    requests: [
      { room_name: 'Аудитория №1', status: 'Новая' },
      { room_name: 'Коворкинг', status: 'Завершено' }
    ]
  });
});

kol.get("/about", (req, res) => {
    res.render("about", { title: 'О нашей компании', description: 'Наша компания лучшая в мире!'})});

kol.get("/contacts", (req, res) => res.send("Наши контакты"));

kol.listen(PORT, () => {
  console.log(`Сервер: http://localhost:${PORT}`);
});