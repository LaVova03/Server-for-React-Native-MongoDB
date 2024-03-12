const express = require('express');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const { ObjectId } = require('mongodb');

const app = express();
const port = 5000;

// Подключение к MongoDB
const url = 'mongodb://localhost:27017';
const dbName = 'itprogram';

app.use(bodyParser.json());

// Middleware для обработки CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8081'); // Разрешить доступ только с http://localhost:8081
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE'); // Разрешить различные HTTP-методы
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Разрешить различные заголовки
    next();
});

// Маршрут для получения новостей
app.get('/api/news', async (req, res) => {
    let client; // Определение переменной client здесь

    try {
        client = await MongoClient.connect(url);
        const db = client.db(dbName);

        const collection = db.collection('news');

        const news = await collection.find({}).toArray();

        res.json(news);
    } catch (error) {
        console.error('Error fetching news', error);
        res.status(500).send('Error fetching news');
    } finally {
        if (client) {
            client.close();
        }
    }
});

// Маршрут для добавления новости
app.post('/api/news', async (req, res) => {
    let client; // Объявляем переменную client

    try {
        client = await MongoClient.connect(url);
        const db = client.db(dbName);

        const collection = db.collection('news');

        const { name, anons, full, key, img } = req.body;
        const result = await collection.insertOne({ name, anons, full, key, img });

        // Возвращаем результат операции вставки
        res.status(201).json(result.ops);
    } catch (error) {
        console.error('Error adding news', error);
        res.status(500).send('Error adding news');
    } finally {
        // В блоке finally закрываем клиента независимо от результата операции вставки данных
        if (client) {
            client.close();
        }
    }
});

// Маршрут для обновления новости
app.put('/api/news/:id', async (req, res) => {
    let client; // Объявляем переменную client

    try {
        const { id } = req.params;
        const { name, anons, full, key, img } = req.body;

        client = await MongoClient.connect(url);
        const db = client.db(dbName);
        const collection = db.collection('news');

        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(id) }, // Условие для поиска новости по идентификатору
            { $set: { name, anons, full, key, img } }, // Обновляемые поля
            { returnOriginal: true } // Опция для возврата обновленного документа
        );

        if (!result.value) {
            // Если не найдено совпадений по идентификатору
            return res.status(404).send('News not found');
        }

        res.status(200).json(result.value); // Возвращаем обновленный документ
    } catch (error) {
        console.error('Error updating news', error);
        res.status(500).send('Error updating news');
    } finally {
        // В блоке fina
        if (client) {
            client.close();
        }
    }
});

app.delete('/api/news/:id', async (req, res) => {
    let client; // Объявляем переменную client

    try {
        const { id } = req.params; // Получаем идентификатор новости из параметров запроса

        client = await MongoClient.connect(url);
        const db = client.db(dbName);
        const collection = db.collection('news');

        const result = await collection.deleteOne({ _id: new ObjectId(id) }); // Удаляем новость с указанным идентификатором

        if (result.deletedCount === 0) { // Проверяем, была ли удалена новость
            return res.status(404).send('News not found');
        }

        res.status(200).json({ message: 'News deleted successfully' }); // Возвращаем сообщение об успешном удалении новости
    } catch (error) {
        console.error('Error deleting news', error);
        res.status(500).send('Error deleting news');
    } finally {
        // В блоке finally закрываем клиента независимо от результата операции удаления данных
        if (client) {
            client.close();
        }
    }
});


app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Internal Server Error');
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
