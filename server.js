import express from "express";
const bon = express();
const PORT = 3000;

bon.use(express.urlencoded({ extended: true }));

bon.set("view engine", "ejs");
bon.set("views", "./views");

bon.get("/", (req, res) => res.send("Конференции.РФ"));

bon.get("/register", (req, res) => {
    res.render("register", { title: "Регистрация на портале", errors: [] });
});

bon.post("/register", (req, res) => {
    res.send(`Пользователь зарегистрирован!<br>
    Логин: ${req.body.login}<br>
    Пароль: ${req.body.password}<br>
    ФИО: ${req.body.fio}<br>
    Номер телефона: ${req.body.phone}<br>
    Email: ${req.body.email}`);
});

bon.get("/login", (req, res) => {
    res.render("login", { title: "Авторизация на портале", errors: [] });
});

bon.post("/login", (req, res) => {
    const userLogin = encodeURIComponent(req.body.login);
    res.redirect(`/dashboard?login=${userLogin}`);
});

bon.get("/dashboard", (req, res) => {
    const login = req.query.login || "Гость";
    res.render("dashboard", { title: "Личный кабинет", login: login });
});

bon.get("/about", (req, res) => res.send("О нас"));

bon.get("/contacts", (req, res) => res.send("Наши контакты"));

bon.listen(PORT, () => {
    console.log(`Сервер: http://localhost:${PORT}`);
});