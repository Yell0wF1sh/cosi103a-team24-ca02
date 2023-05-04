const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { Configuration, OpenAIApi } = require("openai");
const GPTHistoryItem = require('../models/GPTHistoryItem');
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

isLoggedIn = (req, res, next) => {
    if (res.locals.loggedIn) {
        next()
    } else {
        res.redirect('/login')
    }
}

router.get("/poetry", (req, res, next) => {
    res.render('gptpoetry', { title: 'Express' });
})

router.post('/poetry',
    isLoggedIn,
    async (req, res, next) => {
        let prompt = "Generate a romatic poem using poetic feelings with the following needs: "
            + "style: " + req.body.style + ", "
            + "theme: " + req.body.theme + ", "
            + "language: " + req.body.language;
        let answer = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: prompt,
            temperature: 1,
            max_tokens: 2048,
            n: 1,
            stop: null,
        })
            .then(results => { return results.data.choices[0].text })
            .catch(error => console.error(error));

        const history = new GPTHistoryItem(
            {
                prompt: "[Poetry] " + "style: " + req.body.style + ", "
                    + "theme: " + req.body.theme + ", "
                    + "language: " + req.body.language,
                answer: answer,
                createdAt: Date(answer.created),
                userId: req.user._id,
            }
        )
        await history.save()
        res.render('poetryAnswer', { answer })
    }
)

module.exports = router;