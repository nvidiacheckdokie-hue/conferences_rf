import express from "express";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import db from './db.js';
import { User } from './db.js';
import { Room } from './db.js';
import { Request } from './db.js';

// console.log("Все пользователи: ", User.findAll());
// console.log("Количество пользователей: ", User.count());
// console.log("Пользователь с логином ivan: ", User.exists("ivan"));
// console.log("Пользователь с id = 1: ", User.findById(1));
// console.log("Пользователь с логином ivan: ", User.findByLogin("ivan"));

// console.log("Все комнаты:");
// console.log(Room.findAll());

// console.log("Комната с id=1:");
// console.log(Room.findById(1));

// console.log("Все аудитории:");
// console.log(Room.findByType("Конференц-зал"));

// console.log("Всего комнат:");
// console.log(Room.count());

/*Request.updateStatus(1, "Завершено");

console.log("Заявка с id=1:");
console.log(Request.findById(1));

console.log("Заявки пользователя id=1:");
console.log(Request.findByUserId(1));

console.log("Все заявки (JOIN):");
console.log(Request.findAllDetailed());

console.log("Всего заявок:");
console.log(Request.count());*/

// const users = db.prepare('SELECT * FROM users').all();
// console.log('Все пользователи');
// console.log(users);

// const rooms = db.prepare('SELECT * FROM rooms').all();
// console.log('Все комнаты');
// console.log(rooms);

// const reviews = db.prepare('SELECT * FROM reviews').all();
// console.log('Все отзывы');
// console.log(reviews);

// const requests = db.prepare('SELECT * FROM requests').all();
// console.log('Все запросы');
// console.log(requests);

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