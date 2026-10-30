import express from "express";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const bon = express();
const PORT = 3000;

bon.use(express.urlencoded({ extended: true }));
bon.use(express.static(join(__dirname, "public")));

bon.set("view engine", "ejs");
bon.set("views", "./views");

bon.get("/", (req, res) => res.redirect("/login"));

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
    res.render("dashboard", {
        title: 'Мои заявки',
        user: { fio: 'Иванов Иван' },
        requests: [
            { room_name: 'Аудитория №1', status: 'Новая' },
            { room_name: 'Коворкинг', status: 'Завершено' }
        ]
    });
});

bon.get("/about", (req, res) => res.render("about", { title: "О нас", description: "Мы лучшие в мире!" }));

bon.get("/contacts", (req, res) => res.render("contacts", { title: "Наши контакты", phone: "8(000)123-45-67" }));

bon.listen(PORT, () => {
    console.log(`Сервер: http://localhost:${PORT}`);
});