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

router.get("/gpt", (req, res, next) => {
    res.render('gptprompt', { title: 'Express' });
})

router.post('/gpt/prompt',
    isLoggedIn,
    async (req, res, next) => {
        let completion = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: req.body.prompt,
            temperature: 0.8,
            max_tokens: 1024,
            n: 1,
            stop: null,
        })
        const history = new GPTHistoryItem(
            {
                prompt: req.body.prompt,
                answer: completion.data.choices[0].text,
                createdAt: Date(completion.data.created),
                userId: req.user._id,
            }
        )
        await history.save()
        res.render('gptanswer', { question: req.body.prompt, answer: completion.data.choices[0].text })
    }
)

router.get('/gpt/history',
    isLoggedIn,
    async (req, res, next) => {
        let items = await GPTHistoryItem.find({ userId: req.user._id })
        res.render('history', { items })
    }
)

router.get('/gpt/clear-history',
    isLoggedIn,
    async (req, res, next) => {
        await GPTHistoryItem.remove({ userId: req.user._id })
        res.render('history', { items: [] })
    }
)

module.exports = router;